import type { AdherenceCycle } from "@/lib/contracts/asset-adherence";
import type { RoutineReplyOperation } from "@/lib/contracts/routine-replies";
import type { RoutineSupervisionEvent } from "@/lib/contracts/routine-supervision";
import { getAdherenceCycleState } from "@/lib/data/asset-adherence";

export type RoutineReviewEvent = RoutineSupervisionEvent & { sequence: number; sourceProposalId: string | null };
export type RoutineReviewProposal = { id: string; cycleId: string; status: "pendente" | "confirmada" | "cancelada"; operation: RoutineReplyOperation; expiresAt: string; createdAt: string; factId: string | null; actorName: string };
export type RoutineReviewCycle = { cycle: AdherenceCycle; reviews: RoutineReviewEvent[]; proposals: RoutineReviewProposal[]; deliveredAt: string | null; title: string; successIndicator?: string | null };
export const routineAlertLabels = { evidencia: "Evidência para revisão", excecao: "Exceção para revisão", bloqueio: "Bloqueio relatado", silencio: "Sem relato após contato", escalado: "Silêncio escalonado à operação", atraso: "Retorno em atraso", confirmacao: "Confirmação expirada" } as const;
export type RoutineAlert = keyof typeof routineAlertLabels;
export function getRoutineReviewState(item: RoutineReviewCycle, at: Date) {
  const facts = item.cycle.facts.filter(fact => Date.parse(fact.recordedAt) <= at.getTime()).sort((a, b) => a.sequence - b.sequence);
  const execution = facts.findLast(fact => fact.payload.kind === "execucao_relatada");
  const validation = facts.findLast(fact => fact.payload.kind === "evidencia_revisada");
  const exception = facts.findLast(fact => fact.payload.kind === "excecao_solicitada");
  const exceptionReview = facts.findLast(fact => fact.payload.kind === "excecao_revisada");
  const reviews = item.reviews.filter(review => Date.parse(review.recordedAt) <= at.getTime()).sort((a, b) => a.sequence - b.sequence);
  const currentReview = reviews.at(-1);
  const returnDeadline = reviews.findLast(review => review.operation === "prazo")?.responseDueAt ?? item.cycle.dueAt;
  const blocker = item.proposals.filter(proposal => proposal.status === "confirmada" && proposal.operation.kind === "bloqueio" && proposal.factId === execution?.id).at(-1);
  const unresolvedBlocker = blocker && !reviews.some(review => review.sourceProposalId === blocker.id);
  const alerts: RoutineAlert[] = [];
  const state = getAdherenceCycleState(item.cycle, at);
  if (execution?.payload.kind === "execucao_relatada" && execution.payload.performed && execution.payload.evidence.length &&
    !(validation?.payload.kind === "evidencia_revisada" && validation.payload.executionId === execution.id && validation.sequence > execution.sequence)) alerts.push("evidencia");
  if (exception && !(exceptionReview?.payload.kind === "excecao_revisada" && exceptionReview.payload.requestId === exception.id && exceptionReview.sequence > exception.sequence)) alerts.push("excecao");
  if (unresolvedBlocker) alerts.push("bloqueio");
  if (!state.excluded && !execution && !item.proposals.length && item.deliveredAt && at.getTime() - Date.parse(item.deliveredAt) >= 24 * 60 * 60 * 1000) {
    alerts.push(at.getTime() - Date.parse(item.deliveredAt) >= 48 * 60 * 60 * 1000 ? "escalado" : "silencio");
  }
  if (!state.excluded && !state.reported && Date.parse(returnDeadline) < at.getTime()) alerts.push("atraso");
  if (item.proposals.some(proposal => proposal.status === "pendente" && Date.parse(proposal.expiresAt) < at.getTime() && Date.parse(proposal.createdAt) > Date.parse(execution?.recordedAt ?? "1970-01-01"))) alerts.push("confirmacao");
  return { alerts, execution, exception, blocker: unresolvedBlocker ? blocker : undefined, expectedEventId: currentReview?.id ?? null, returnDeadline };
}
