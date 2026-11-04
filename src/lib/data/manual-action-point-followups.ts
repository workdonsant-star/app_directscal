import "server-only";

import { isVagueManualFollowupReply } from "@/lib/agent/follow-up/manual-follow-up";
import { extractManualFollowupReport } from "@/lib/agent/follow-up/manual-follow-up-provider";
import type { SlackDeliveryJob, SlackReply } from "@/lib/contracts/slack-delivery";
import { getSlackWorkspaceUser, type SlackInstallation } from "@/lib/integrations/slack";
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
  if (isVagueManualFollowupReply(replyText)) return { text: `Para registrar o relato de ${escapeSlackText(run.title)}, diga quais partes da ação você executou, quando fez isso e se existe algum registro para consultar. Uma afirmação geral ainda não permite resumir o andamento.` };
  const prior = await reports.select("id,status,summary,evidence").eq("slack_event_job_id", job.id).maybeSingle();
  if (prior.error) throw new Error("Não foi possível verificar o relato anterior.");
  const report = prior.data ?? await extractManualFollowupReport(run.title, run.action, replyText);
  if (report.status === "inconclusivo") return { text: `Ainda preciso de detalhes sobre ${escapeSlackText(run.title)}: quais partes da ação você executou, quando fez isso e se existe algum registro para consultar?` };
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
