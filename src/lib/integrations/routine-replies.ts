import "server-only";
import { z } from "zod";
import { routineReplyContextSchema, routineReplyProposalSchema, type RoutineReplyOperation } from "@/lib/contracts/routine-replies";
import type { SlackDeliveryJob, SlackReply } from "@/lib/contracts/slack-delivery";
import { parseRoutineReply } from "@/lib/data/routine-reply-parser";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSlackWorkspaceUser, type SlackInstallation } from "@/lib/integrations/slack";
import { escapeSlackText } from "@/lib/integrations/slack-format";
import type { Json } from "@/lib/supabase/database.types";

export const ROUTINE_REPLY_ACTIONS = { confirmar: "routine_reply_confirm", cancelar: "routine_reply_cancel" } as const;
function operationText(operation: RoutineReplyOperation) {
  switch (operation.kind) {
    case "execucao": return `${operation.performed ? "Execução relatada" : "Não execução relatada"}: ${operation.description}`;
    case "bloqueio": return `Bloqueio relatado: ${operation.reason}. A etapa de implantação permanece como está.`;
    case "excecao": return `Solicitação de exceção: ${operation.reason}. A oportunidade permanece na base até a revisão da operação.`;
    case "progresso": return `Progresso de implantação: ${operation.value}%. Motivo: ${operation.reason}. A etapa permanece como está; progresso não comprova aderência.`;
    case "leitura": return "Leitura do ativo confirmada. Leitura não comprova execução da rotina.";
  }
}
const resolutionSchema = z.object({ status: z.enum(["confirmada", "cancelada", "expirou", "mudou", "indisponivel"]) });

// null significa consulta: somente este resultado pode seguir para o agente de busca.
export async function prepareRoutineReply(job: SlackDeliveryJob, installation: SlackInstallation): Promise<SlackReply | null> {
  if (job.question.kind !== "direct") return null;
  const intent = parseRoutineReply(job.question.text);
  if (intent.kind === "consulta") return null;
  const person = await getSlackWorkspaceUser(installation.botToken, job.question.userId);
  if (!person) return { text: "Não foi possível confirmar uma pessoa ativa para este registro. Nenhuma alteração foi feita." };
  if (intent.kind === "ambigua") return { text: intent.message };
  const db = createSupabaseAdminClient().schema("app_private");
  if (intent.kind === "decisao") {
    const { data, error } = await db.rpc("resolve_routine_reply", { p_job_id: job.id, p_lease_id: job.lease_id, p_proposal_id: intent.proposalId, p_confirm: intent.decision === "confirmar" });
    if (error) throw new Error("Não foi possível confirmar o registro da rotina.");
    const result = resolutionSchema.parse(data);
    const messages = {
      confirmada: `Registro confirmado. A evidência e a referência ${intent.proposalId} estão disponíveis no acompanhamento da rotina no app. Uma confirmação repetida não cria outro registro.`,
      cancelada: "Proposta cancelada. Nenhum registro de execução foi criado por esta proposta.",
      expirou: "A proposta expirou. Envie o relato novamente para revisar o ciclo e confirmar uma nova proposta.",
      mudou: "A rotina recebeu outra atualização depois desta proposta. Envie o relato novamente para revisar o estado atual antes de confirmar.",
      indisponivel: "Esta proposta não está disponível para esta pessoa e conversa, ou a atribuição mudou. Nenhuma nova alteração foi feita.",
    };
    return { text: messages[result.status] };
  }
  const { data, error } = await db.rpc("get_routine_reply_contexts", { p_job_id: job.id, p_lease_id: job.lease_id, ...(intent.cycleId ? { p_cycle_id: intent.cycleId } : {}) });
  if (error) throw new Error("Não foi possível identificar o ciclo da rotina.");
  const contexts = routineReplyContextSchema.array().parse(data);
  if (contexts.length === 0) return { text: "Não encontrei um ciclo com contato confirmado nesta conversa e atribuído a você. Responda à mensagem da rotina ou informe sua referência. Nenhuma alteração foi feita." };
  if (contexts.length !== 1) return { text: "Há mais de um ciclo disponível nesta conversa. Responda na thread da mensagem da rotina ou comece o relato com rotina seguida da referência do ciclo. Nenhuma alteração foi feita." };
  const saved = await db.rpc("propose_routine_reply", { p_job_id: job.id, p_lease_id: job.lease_id, p_cycle_id: contexts[0].cycleId, p_actor_name: person.name, p_operation: intent.operation as Json });
  if (saved.error) throw new Error("Não foi possível preparar a confirmação da rotina.");
  if (!saved.data) return { text: "A atribuição ou publicação mudou durante a preparação. Nenhuma alteração foi feita. Consulte a operação DirectScal." };
  const proposal = routineReplyProposalSchema.parse(saved.data);
  if (proposal.status !== "pendente") return { text: `Esta proposta já foi ${proposal.status}. Nenhuma nova alteração foi feita.` };
  const date = (value: string) => new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
  const lines = [
    `Confirme o registro em ${proposal.context.title}.`,
    `Ativo: ${proposal.context.assetTitle} · versão ${proposal.context.assetVersion}`,
    `Ciclo: ${date(proposal.context.opensAt)} a ${date(proposal.context.dueAt)} (São Paulo)`,
    operationText(proposal.operation),
    ...(proposal.operation.kind === "execucao" ? proposal.operation.evidence.map(url => `Evidência: ${url}`) : []),
    `Referência do ciclo: ${proposal.context.cycleId}`,
    `Confirme até ${date(proposal.expiresAt)} pelos botões ou envie confirmar ${proposal.id}. Para desistir, envie cancelar ${proposal.id}.`,
  ];
  return {
    text: lines.map(escapeSlackText).join("\n\n"),
    blocks: [
      ...lines.map(text => ({ type: "section", text: { type: "plain_text", text, emoji: false } })),
      { type: "actions", elements: [
        { type: "button", action_id: ROUTINE_REPLY_ACTIONS.confirmar, text: { type: "plain_text", text: "Confirmar registro", emoji: false }, value: proposal.id },
        { type: "button", action_id: ROUTINE_REPLY_ACTIONS.cancelar, text: { type: "plain_text", text: "Cancelar", emoji: false }, value: proposal.id },
      ] },
    ],
  };
}
