import "server-only";

import { buildManualFollowupHistory, contradictsReportedCompletion, isSelfReportedComplete } from "@/lib/agent/follow-up/manual-follow-up";
import { extractManualFollowupReport } from "@/lib/agent/follow-up/manual-follow-up-provider";
import { answerManualFollowupQuestion } from "@/lib/agent/follow-up/manual-follow-up-chat";
import { buildManagementAssetChunks } from "@/lib/data/management-asset-indexer";
import { richTextDocumentSchema } from "@/lib/contracts/rich-text";
import type { SlackDeliveryJob, SlackReply } from "@/lib/contracts/slack-delivery";
import { fetchSlackActionPointThread, getSlackBotUserId, getSlackWorkspaceUser, type SlackInstallation } from "@/lib/integrations/slack";
import { escapeSlackText } from "@/lib/integrations/slack-format";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const reportLabels = { executado_relato: "execução relatada", parcial: "avanço parcial", nao_executado: "não execução relatada", bloqueado: "bloqueio", duvida: "dúvida", inconclusivo: "relato inconclusivo" };
const decisionPattern = /^(confirmar|corrigir)(?:\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}))?(?:\s*:\s*([\s\S]+))?$/i;

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
    const recent = await base().eq("status", "enviado").gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).order("created_at", { ascending: false }).limit(2);
    if (recent.error) throw new Error("Não foi possível identificar o acompanhamento.");
    return recent.data?.length ? { text: "Para registrar o andamento de um Action Point, responda na thread da pergunta correspondente. Assim mantenho o contexto da ação correta." } : null;
  }
  if (error) throw new Error("Não foi possível identificar o acompanhamento.");
  if (!run) return null;
  const person = await getSlackWorkspaceUser(installation.botToken, job.question.userId, true).catch(() => null);
  if (!person) return { text: "Não foi possível confirmar sua identidade ativa no Slack. Nenhum relato foi registrado." };
  const reports = db.from("manual_action_point_reports");
  const decision = job.question.text.trim().match(decisionPattern);
  let replyText = job.question.text;
  if (decision) {
    const latest = await reports.select("id,status,confirmed_at").eq("followup_id", run.id).order("registered_at", { ascending: false }).limit(1).maybeSingle();
    if (latest.error) throw new Error("Não foi possível verificar o resumo anterior.");
    if (!latest.data) return { text: "Ainda não há um resumo para confirmar. Conte o que foi executado, o que falta e qualquer bloqueio." };
    if (decision[2] && latest.data.id !== decision[2]) return { text: "Essa proposta não é a mais recente deste acompanhamento. Revise o último resumo na thread antes de confirmar." };
    if (decision[1].toLowerCase() === "confirmar") {
      if (latest.data.status === "inconclusivo") return { text: "Esse relato ainda não descreve o que foi executado. Conte quais partes da ação você realizou, quando fez isso e se existe algum registro para consultar." };
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
  const prior = await reports.select("id,followup_id,status,summary,evidence,confirmed_at").eq("slack_event_job_id", job.id).maybeSingle();
  if (prior.error) throw new Error("Não foi possível verificar o relato anterior.");
  if (prior.data && prior.data.followup_id !== run.id) throw new Error("O relato anterior não corresponde a este acompanhamento.");
  const directCompletion = isSelfReportedComplete(replyText);
  let history: ReturnType<typeof buildManualFollowupHistory> = [];
  let extracted: Awaited<ReturnType<typeof extractManualFollowupReport>> | null = null;
  if (!prior.data && !directCompletion) {
    try {
      const botUserId = await getSlackBotUserId(installation);
      history = buildManualFollowupHistory(
        await fetchSlackActionPointThread(installation.botToken, job.question.channel, run.message_ts!, job.question.ts),
        { userId: job.question.userId, botUserId, currentTs: job.question.ts, rootTs: run.message_ts! },
      );
    } catch (error) {
      console.error("[manual-followup] thread read failed", error instanceof Error ? error.name : "unknown");
      return { text: "Não consegui ler esta conversa agora. Nenhum relato foi registrado. Tente novamente nesta thread em alguns minutos." };
    }
    try {
      extracted = await extractManualFollowupReport({ title: run.title, action: run.action, question: run.question, history, reply: replyText });
    } catch (error) {
      console.error("[manual-followup] analysis failed", error instanceof Error ? error.name : "unknown");
      const missingModel = error instanceof Error && error.message === "Selecione um modelo de IA antes de registrar o relato.";
      return { text: missingModel
        ? "O motor de IA deste acompanhamento não está selecionado. Nenhum relato foi registrado; a operação precisa configurar o motor antes de continuar."
        : "Não consegui analisar sua resposta agora. Nenhum relato foi registrado. Tente novamente nesta thread em alguns minutos." };
    }
  }
  const report = prior.data ?? (directCompletion
    ? { status: "executado_relato" as const, summary: `Conclusão integral declarada pela pessoa responsável: ${replyText.trim()}`, evidence: null, supportingQuote: replyText.trim(), followUpQuestion: null }
    : extracted!);
  if (report.status === "duvida") {
    const point = await db.from("admin_company_action_points")
      .select("reason,action,continuity,asset_id,asset_version_id")
      .eq("id", run.action_point_id).eq("organization_id", run.organization_id).maybeSingle();
    if (point.error) throw new Error("Não foi possível consultar o Action Point.");
    if (!point.data || point.data.asset_version_id !== run.asset_version_id || point.data.action !== run.action) {
      return { text: `O Action Point ${escapeSlackText(run.title)} mudou desde esta pergunta. Peça à operação o acordo atual antes de executar.` };
    }
    const publicDb = createSupabaseAdminClient();
    const asset = await publicDb.from("management_assets")
      .select("id,title,status,archived_at,current_published_version_id")
      .eq("id", point.data.asset_id).eq("organization_id", run.organization_id).maybeSingle();
    if (asset.error) throw new Error("Não foi possível consultar o ativo vinculado.");
    if (!asset.data || asset.data.status !== "publicado" || asset.data.archived_at || asset.data.current_published_version_id !== run.asset_version_id) {
      return { text: "O ativo vinculado mudou ou deixou de estar publicado. Peça à operação que revise este Action Point." };
    }
    const [version, chunks] = await Promise.all([
      publicDb.from("management_asset_versions").select("id,version_number,review_status,content").eq("id", run.asset_version_id).eq("asset_id", asset.data.id).eq("organization_id", run.organization_id).maybeSingle(),
      publicDb.from("management_asset_chunks").select("heading_path,content").eq("asset_id", asset.data.id).eq("version_id", run.asset_version_id).eq("organization_id", run.organization_id).order("ordinal", { ascending: true }).limit(12),
    ]);
    if (version.error || chunks.error) throw new Error("Não foi possível consultar a versão publicada do ativo.");
    if (!version.data || version.data.review_status !== "publicado") return { text: "A versão vinculada do ativo não está disponível. Peça à operação que revise este Action Point." };
    const document = richTextDocumentSchema.safeParse(version.data.content);
    const sections = (chunks.data?.length ? chunks.data : document.success ? buildManagementAssetChunks({ title: asset.data.title, content: document.data }).map(chunk => ({ heading_path: chunk.headingPath, content: chunk.content })) : []).slice(0, 12);
    if (!sections.length) return { text: "O ativo vinculado não tem conteúdo consultável. Peça à operação que revise este Action Point." };
    return { text: await answerManualFollowupQuestion({
      question: replyText, title: run.title, reason: point.data.reason, action: run.action, continuity: point.data.continuity,
      assetTitle: asset.data.title, assetVersion: version.data.version_number, sections,
      history: history.map(turn => ({ role: turn.role === "person" ? "user" as const : "assistant" as const, text: turn.text })),
    }) };
  }
  if (report.status === "inconclusivo") {
    const proposed = "followUpQuestion" in report && report.followUpQuestion ? report.followUpQuestion : "O que ficou concluído ou pendente?";
    const repeated = history.some(turn => turn.role === "assistant" && turn.text.toLocaleLowerCase("pt-BR").includes(proposed.toLocaleLowerCase("pt-BR")));
    return { text: escapeSlackText(repeated ? "Para registrar sem repetir a pergunta: você concluiu a ação, fez apenas parte dela ou ficou impedido de executá-la?" : proposed) };
  }
  if (report.status === "executado_relato") {
    if (!prior.data && contradictsReportedCompletion(replyText)) return { text: "Entendi que ainda há algo pendente. Qual parte da ação ficou sem concluir?" };
    if (!prior.data && !("supportingQuote" in report && report.supportingQuote)) return { text: "Não consegui identificar uma declaração clara de conclusão. Você concluiu toda a ação ou ainda há algo pendente?" };
    if (!prior.data) {
      const recorded = await reports.insert({
        followup_id: run.id, organization_id: run.organization_id, slack_event_job_id: job.id,
        status: "executado_relato", summary: report.summary, evidence: report.evidence,
        confirmed_at: new Date().toISOString(), confirmation_job_id: job.id,
      }).select("id").maybeSingle();
      if (recorded.error?.code !== "23505" && recorded.error) throw new Error("Não foi possível registrar o relato.");
      if (!recorded.data) {
        const duplicate = await reports.select("id,followup_id,status,confirmed_at").eq("slack_event_job_id", job.id).maybeSingle();
        if (duplicate.error || duplicate.data?.followup_id !== run.id || duplicate.data.status !== "executado_relato" || !duplicate.data.confirmed_at) throw new Error("Não foi possível recuperar o relato.");
      }
    } else if (!prior.data.confirmed_at) {
      const confirmed = await reports.update({ confirmed_at: new Date().toISOString(), confirmation_job_id: job.id }).eq("id", prior.data.id).eq("followup_id", run.id).is("confirmed_at", null);
      if (confirmed.error) throw new Error("Não foi possível confirmar o relato.");
    }
    const changed = await runs.update({ status: "respondido", updated_at: new Date().toISOString() }).eq("id", run.id).eq("status", "enviado");
    if (changed.error) throw new Error("Não foi possível atualizar o acompanhamento.");
    return { text: `Registrei sua conclusão de ${escapeSlackText(run.title)} como relato seu. A operação poderá revisar esse registro; ele não é uma verificação da execução.` };
  }
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
