import "server-only";

import { randomUUID } from "node:crypto";
import { isGenericManualFollowupCompletion } from "@/lib/agent/follow-up/manual-follow-up";
import { generateManualFollowupQuestion } from "@/lib/agent/follow-up/manual-follow-up-question-provider";
import { extractManualFollowupReport } from "@/lib/agent/follow-up/manual-follow-up-provider";
import { answerManualFollowupQuestion } from "@/lib/agent/follow-up/manual-follow-up-chat";
import { getActiveAgentProvider, verifyAgentProvider } from "@/lib/data/agent-provider-data-source";
import { buildManagementAssetChunks } from "@/lib/data/management-asset-indexer";
import { AdminCompanyActionPointError } from "@/lib/data/admin-company-action-points";
import { routineOrganizationId } from "@/lib/data/admin-adherence-data-source";
import { dueManualActionPointSlot } from "@/lib/data/manual-action-point-schedule";
import type { SlackDeliveryJob, SlackReply } from "@/lib/contracts/slack-delivery";
import { richTextDocumentSchema } from "@/lib/contracts/rich-text";
import { fetchSlackConversation, getSlackBotTokenForOrganization, getSlackBotUserId, getSlackWorkspaceUser, openSlackDirectConversation, postSlackMessage, SlackDeliveryError, type SlackInstallation } from "@/lib/integrations/slack";
import { buildSlackConversationHistory, escapeSlackText } from "@/lib/integrations/slack-format";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function startManualActionPointFollowup(companyId: string, actorId: string | null, actionPointId: string, scheduledSlot?: string) {
  const organizationId = routineOrganizationId(companyId);
  const db = createSupabaseAdminClient();
  const { data: point, error } = await db.schema("app_private").from("admin_company_action_points").select("*").eq("organization_id", organizationId).eq("id", actionPointId).maybeSingle();
  if (error) throw new AdminCompanyActionPointError("Não foi possível consultar o action point.", 500);
  if (!point) throw new AdminCompanyActionPointError("Action point não encontrado.", 404);
  if (scheduledSlot && dueManualActionPointSlot(point, new Date()) !== scheduledSlot) throw new AdminCompanyActionPointError("O horário deste action point mudou.", 409);
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

  const [uncertain, previous, scheduled] = await Promise.all([
    db.schema("app_private").from("manual_action_point_followups").select("id").eq("action_point_id", point.id).eq("organization_id", organizationId).eq("status", "incerto").limit(1).maybeSingle(),
    db.schema("app_private").from("manual_action_point_followups").select("question").eq("action_point_id", point.id).eq("organization_id", organizationId).in("status", ["enviado", "respondido"]).order("created_at", { ascending: false }).limit(5),
    scheduledSlot ? db.schema("app_private").from("manual_action_point_followups").select("id").eq("action_point_id", point.id).eq("scheduled_slot", scheduledSlot).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (uncertain.error || previous.error || scheduled.error) throw new AdminCompanyActionPointError("Não foi possível verificar os envios anteriores.", 500);
  if (scheduled.data) throw new AdminCompanyActionPointError("Esta ocorrência já foi preparada.", 409);
  if (uncertain.data) throw new AdminCompanyActionPointError("Há um envio incerto. Verifique a conversa no Slack antes de iniciar outro teste.", 409);

  const id = randomUUID();
  let question: string;
  try {
    question = await generateManualFollowupQuestion(provider, {
      name: person.name.trim().split(/\s+/)[0], title: point.title, action: point.action,
      previousQuestions: (previous.data ?? []).map(row => row.question),
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("O Gemini está temporariamente sobrecarregado.")) {
      throw new AdminCompanyActionPointError(error.message, 500);
    }
    throw new AdminCompanyActionPointError("O motor de IA não conseguiu preparar a pergunta. Tente novamente antes de enviar.", 500);
  }
  const runs = db.schema("app_private").from("manual_action_point_followups");
  const inserted = await runs.insert({ id, action_point_id: point.id, organization_id: organizationId, asset_version_id: point.asset_version_id, slack_team_id: point.slack_team_id, slack_user_id: point.slack_user_id, title: point.title, action: point.action, question, status: "preparado", scheduled_slot: scheduledSlot ?? null, started_by: scheduledSlot ? null : actorId });
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
  if (job.question.kind !== "direct") return null;
  const db = createSupabaseAdminClient().schema("app_private");
  const runs = db.from("manual_action_point_followups");
  const base = () => runs.select("*")
    .eq("organization_id", installation.organizationId).eq("slack_team_id", job.question.teamId)
    .eq("slack_user_id", job.question.userId).eq("channel_id", job.question.channel);
  let run;
  let error;
  if (job.question.threadTs && job.question.threadTs !== job.question.ts) {
    ({ data: run, error } = await base().eq("message_ts", job.question.threadTs).in("status", ["enviado", "respondido"]).maybeSingle());
  } else {
    // Uma resposta direta só tem contexto seguro se houver um único teste recente aberto.
    const recent = await base().eq("status", "enviado").gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).order("created_at", { ascending: false }).limit(2);
    error = recent.error;
    if (recent.data?.length === 2) return { text: "Há mais de um Action Point aguardando resposta. Abra a pergunta desejada e responda na thread daquela mensagem para vincular seu relato." };
    run = recent.data?.[0] ?? null;
  }
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
      return { text: "Resumo confirmado e registrado no Action Point." };
    }
    if (!decision[3]?.trim()) return { text: `Para corrigir, envie corrigir ${latest.data.id}: seguido do relato completo corrigido.` };
    replyText = decision[3].trim();
  }
  const prior = await reports.select("id,status,summary,evidence").eq("slack_event_job_id", job.id).maybeSingle();
  if (prior.error) throw new Error("Não foi possível verificar o relato anterior.");
  const report = prior.data ?? (isGenericManualFollowupCompletion(replyText)
    ? { status: "executado_relato" as const, summary: replyText, evidence: null }
    : await extractManualFollowupReport(run.title, run.action, replyText));
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
  if (report.status === "duvida") {
    const point = await db.from("admin_company_action_points")
      .select("reason,action,continuity,asset_id,asset_version_id")
      .eq("id", run.action_point_id).eq("organization_id", run.organization_id).maybeSingle();
    if (point.error) throw new Error("Não foi possível consultar o action point.");
    if (!point.data || point.data.asset_version_id !== run.asset_version_id || point.data.action !== run.action) {
      return { text: `O action point ${escapeSlackText(run.title)} mudou desde esta pergunta. Neste acompanhamento, a ação combinada era: ${escapeSlackText(run.action)} Peça à operação a versão atual antes de executar.` };
    }
    const publicDb = createSupabaseAdminClient();
    const asset = await publicDb.from("management_assets")
      .select("id,title,status,archived_at,current_published_version_id")
      .eq("id", point.data.asset_id).eq("organization_id", run.organization_id).maybeSingle();
    if (asset.error) throw new Error("Não foi possível consultar o ativo vinculado.");
    if (!asset.data || asset.data.status !== "publicado" || asset.data.archived_at || asset.data.current_published_version_id !== run.asset_version_id) {
      return { text: "O ativo vinculado mudou ou deixou de estar publicado. Peça à operação que revise este Action Point antes de seguir a orientação." };
    }
    if (!run.message_ts) return { text: "Não consegui recuperar a conversa deste acompanhamento. Peça à operação que revise o envio antes de continuar." };
    const [version, chunks, botUserId] = await Promise.all([
      publicDb.from("management_asset_versions").select("id,version_number,review_status,content").eq("id", run.asset_version_id).eq("asset_id", asset.data.id).eq("organization_id", run.organization_id).maybeSingle(),
      publicDb.from("management_asset_chunks").select("heading_path,content").eq("asset_id", asset.data.id).eq("version_id", run.asset_version_id).eq("organization_id", run.organization_id).order("ordinal", { ascending: true }).limit(12),
      getSlackBotUserId(installation),
    ]);
    if (version.error || chunks.error) throw new Error("Não foi possível consultar a versão publicada do ativo.");
    if (!version.data || version.data.review_status !== "publicado") return { text: "A versão vinculada do ativo não está disponível para consulta. Peça à operação que revise este Action Point." };
    const document = richTextDocumentSchema.safeParse(version.data.content);
    const sections = (chunks.data?.length ? chunks.data : document.success ? buildManagementAssetChunks({ title: asset.data.title, content: document.data }).map(chunk => ({ heading_path: chunk.headingPath, content: chunk.content })) : []).slice(0, 12);
    if (sections.length === 0) return { text: "O ativo vinculado está publicado, mas não tem conteúdo consultável. Peça à operação que revise este Action Point." };
    const conversationTs = job.question.threadTs && job.question.threadTs !== job.question.ts ? run.message_ts : undefined;
    const messages = await fetchSlackConversation(installation.botToken, job.question.channel, conversationTs);
    const conversation = buildSlackConversationHistory(messages, { botUserId, currentTs: job.question.ts });
    return { text: await answerManualFollowupQuestion({
      question: replyText, title: run.title, reason: point.data.reason, action: run.action, continuity: point.data.continuity,
      assetTitle: asset.data.title, assetVersion: version.data.version_number, sections, history: conversation.history,
    }) };
  }
  return { text: `Entendi seu relato sobre ${escapeSlackText(run.title)} como ${reportLabels[report.status]}. Resumo proposto: ${escapeSlackText(report.summary)}. Se estiver correto, responda confirmar ${reportId}. Para ajustar, envie corrigir ${reportId}: seguido do relato completo corrigido. O resumo só aparecerá no Action Point após sua confirmação.` };
}
