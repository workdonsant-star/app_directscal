import "server-only";

import { randomUUID } from "node:crypto";
import { buildManualFollowupQuestion } from "@/lib/agent/follow-up/manual-follow-up";
import { extractManualFollowupReport } from "@/lib/agent/follow-up/manual-follow-up-provider";
import { getActiveAgentProvider, verifyAgentProvider } from "@/lib/data/agent-provider-data-source";
import { AdminCompanyActionPointError } from "@/lib/data/admin-company-action-points";
import { routineOrganizationId } from "@/lib/data/admin-adherence-data-source";
import type { SlackDeliveryJob, SlackReply } from "@/lib/contracts/slack-delivery";
import { getSlackBotTokenForOrganization, getSlackWorkspaceUser, openSlackDirectConversation, postSlackMessage, SlackDeliveryError, type SlackInstallation } from "@/lib/integrations/slack";
import { escapeSlackText } from "@/lib/integrations/slack-format";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function startManualActionPointFollowup(companyId: string, actorId: string, actionPointId: string) {
  const organizationId = routineOrganizationId(companyId);
  const db = createSupabaseAdminClient();
  const { data: point, error } = await db.schema("app_private").from("admin_company_action_points").select("*").eq("organization_id", organizationId).eq("id", actionPointId).maybeSingle();
  if (error) throw new AdminCompanyActionPointError("Não foi possível consultar o action point.", 500);
  if (!point) throw new AdminCompanyActionPointError("Action point não encontrado.", 404);
  const [installation, asset, provider] = await Promise.all([
    getSlackBotTokenForOrganization(organizationId),
    db.from("management_assets").select("id,title,status,archived_at,current_published_version_id").eq("id", point.asset_id).eq("organization_id", organizationId).maybeSingle(),
    getActiveAgentProvider(),
  ]);
  if (!installation || installation.teamId !== point.slack_team_id) throw new AdminCompanyActionPointError("Reconecte o Slack da empresa antes do teste.", 409);
  if (!asset.data || asset.error || asset.data.status !== "publicado" || asset.data.archived_at || asset.data.current_published_version_id !== point.asset_version_id) throw new AdminCompanyActionPointError("O ativo publicado mudou. Revise o action point antes do teste.", 409);
  if (!provider.apiKey || !provider.model || !["anthropic", "openai", "gemini"].includes(provider.provider)) throw new AdminCompanyActionPointError("Conecte e selecione um motor de IA antes do teste.", 409);
  try { await verifyAgentProvider(provider.provider as "anthropic" | "openai" | "gemini", provider.model, provider.apiKey); }
  catch { throw new AdminCompanyActionPointError("O motor de IA não respondeu ao teste de conexão. Revise a configuração antes de enviar.", 409); }
  const person = await getSlackWorkspaceUser(installation.botToken, point.slack_user_id, true).catch(() => null);
  if (!person) throw new AdminCompanyActionPointError("O líder não está ativo no Slack. Revise o cadastro.", 409);

  const uncertain = await db.schema("app_private").from("manual_action_point_followups").select("id").eq("action_point_id", point.id).eq("organization_id", organizationId).eq("status", "incerto").limit(1).maybeSingle();
  if (uncertain.error) throw new AdminCompanyActionPointError("Não foi possível verificar os envios anteriores.", 500);
  if (uncertain.data) throw new AdminCompanyActionPointError("Há um envio incerto. Verifique a conversa no Slack antes de iniciar outro teste.", 409);

  const id = randomUUID();
  const question = buildManualFollowupQuestion({ title: escapeSlackText(point.title), action: escapeSlackText(point.action), assetTitle: escapeSlackText(asset.data.title), runId: id });
  const runs = db.schema("app_private").from("manual_action_point_followups");
  const inserted = await runs.insert({ id, action_point_id: point.id, organization_id: organizationId, asset_version_id: point.asset_version_id, slack_team_id: point.slack_team_id, slack_user_id: point.slack_user_id, title: point.title, action: point.action, question, status: "preparado", started_by: actorId });
  if (inserted.error?.code === "23505") throw new AdminCompanyActionPointError("Já há um acompanhamento aberto para este action point.", 409);
  if (inserted.error) throw new AdminCompanyActionPointError("Não foi possível preparar o acompanhamento.", 500);
  const changed = await runs.update({ status: "enviando", updated_at: new Date().toISOString() }).eq("id", id).eq("status", "preparado").select("id").maybeSingle();
  if (changed.error || !changed.data) throw new AdminCompanyActionPointError("Não foi possível reservar o envio.", 500);
  let channel: string;
  try { channel = await openSlackDirectConversation(installation.botToken, person.userId); }
  catch {
    await runs.update({ status: "falhou", error_code: "conversa_indisponivel", updated_at: new Date().toISOString() }).eq("id", id).eq("status", "enviando");
    throw new AdminCompanyActionPointError("Não foi possível abrir a conversa privada com o líder.", 409);
  }
  try {
    const sent = await postSlackMessage(installation.botToken, { channel, text: question, clientMsgId: id });
    const saved = await runs.update({ status: "enviado", channel_id: sent.channel, message_ts: sent.ts, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "enviando").select("id").maybeSingle();
    if (saved.error || !saved.data) throw new Error("Envio confirmado sem persistência.");
    return { id, status: "enviado" as const };
  } catch (cause) {
    const uncertain = !(cause instanceof SlackDeliveryError) || cause.uncertain;
    await runs.update({ status: uncertain ? "incerto" : "falhou", error_code: cause instanceof SlackDeliveryError ? cause.code : "envio_sem_confirmacao", updated_at: new Date().toISOString() }).eq("id", id).eq("status", "enviando");
    throw new AdminCompanyActionPointError(uncertain ? "O envio ficou incerto. Verifique a conversa no Slack antes de iniciar outro teste." : "O Slack recusou a mensagem. Verifique a conexão antes de iniciar outro teste.", 409);
  }
}

const reportLabels = { executado_relato: "execução relatada", parcial: "avanço parcial", nao_executado: "não execução relatada", bloqueado: "bloqueio", duvida: "dúvida", inconclusivo: "relato inconclusivo" };
const decisionPattern = /^(confirmar|corrigir)\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\s*:\s*([\s\S]+))?$/i;

export async function prepareManualActionPointReply(job: SlackDeliveryJob, installation: SlackInstallation): Promise<SlackReply | null> {
  if (job.question.kind !== "direct" || !job.question.threadTs || job.question.threadTs === job.question.ts) return null;
  const db = createSupabaseAdminClient().schema("app_private");
  const { data: run, error } = await db.from("manual_action_point_followups").select("*")
    .eq("organization_id", installation.organizationId).eq("slack_team_id", job.question.teamId)
    .eq("slack_user_id", job.question.userId).eq("channel_id", job.question.channel)
    .eq("message_ts", job.question.threadTs).in("status", ["enviado", "respondido"]).maybeSingle();
  if (error) throw new Error("Não foi possível identificar o acompanhamento.");
  if (!run) return null;
  const person = await getSlackWorkspaceUser(installation.botToken, job.question.userId, true).catch(() => null);
  if (!person) return { text: "Não foi possível confirmar sua identidade ativa no Slack. Nenhum relato foi registrado." };
  const reports = db.from("manual_action_point_reports");
  const decision = job.question.text.trim().match(decisionPattern);
  let replyText = job.question.text;
  if (decision) {
    const latest = await reports.select("id,confirmed_at").eq("followup_id", run.id).order("registered_at", { ascending: false }).limit(1).maybeSingle();
    if (latest.error) throw new Error("Não foi possível verificar o resumo anterior.");
    if (!latest.data || latest.data.id !== decision[2]) return { text: "Essa proposta não é a mais recente deste acompanhamento. Revise o último resumo na thread antes de confirmar." };
    if (decision[1].toLowerCase() === "confirmar") {
      if (latest.data.confirmed_at) {
        await db.from("manual_action_point_followups").update({ status: "respondido", updated_at: new Date().toISOString() }).eq("id", run.id).eq("status", "enviado");
        return { text: "Esse resumo já foi confirmado. Nenhum novo registro foi criado." };
      }
      const confirmed = await reports.update({ confirmed_at: new Date().toISOString(), confirmation_job_id: job.id }).eq("id", latest.data.id).eq("followup_id", run.id).is("confirmed_at", null).select("id").maybeSingle();
      if (confirmed.error) throw new Error("Não foi possível confirmar o resumo.");
      if (!confirmed.data) return { text: "A proposta mudou ou já foi confirmada. Nenhum novo registro foi criado." };
      const changed = await db.from("manual_action_point_followups").update({ status: "respondido", updated_at: new Date().toISOString() }).eq("id", run.id).eq("status", "enviado");
      if (changed.error) throw new Error("Não foi possível atualizar o acompanhamento.");
      return { text: "Resumo confirmado e registrado no Action Point. Sua confirmação valida o relato, mas não comprova sozinha a execução da prática." };
    }
    if (!decision[3]?.trim()) return { text: `Para corrigir, envie corrigir ${latest.data.id}: seguido do relato completo corrigido.` };
    replyText = decision[3].trim();
  }
  const prior = await reports.select("id,status,summary,evidence").eq("slack_event_job_id", job.id).maybeSingle();
  if (prior.error) throw new Error("Não foi possível verificar o relato anterior.");
  const report = prior.data ?? await extractManualFollowupReport(run.title, run.action, replyText);
  let reportId = prior.data?.id;
  if (!prior.data) {
    const inserted = await reports.insert({ followup_id: run.id, organization_id: run.organization_id, slack_event_job_id: job.id, status: report.status, summary: report.summary, evidence: report.evidence }).select("id").maybeSingle();
    if (inserted.error?.code !== "23505" && inserted.error) throw new Error("Não foi possível registrar o relato.");
    reportId = inserted.data?.id;
    if (!reportId) {
      const duplicate = await reports.select("id").eq("slack_event_job_id", job.id).maybeSingle();
      if (duplicate.error || !duplicate.data) throw new Error("Não foi possível recuperar a proposta do relato.");
      reportId = duplicate.data.id;
    }
  }
  return { text: `Entendi seu relato sobre ${escapeSlackText(run.title)} como ${reportLabels[report.status]}. Resumo proposto: ${escapeSlackText(report.summary)}. Se estiver correto, responda confirmar ${reportId}. Para ajustar, envie corrigir ${reportId}: seguido do relato completo corrigido. O resumo só aparecerá no Action Point após sua confirmação.` };
}
