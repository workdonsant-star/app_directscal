import type { ActionPointAssignment, GanttWorkspaceData } from "@/lib/contracts";
import type { AdherenceBoard } from "@/lib/data/action-points-adherence-example";
import { actionPointCadenceLabels, actionPointStageLabels, defaultCadence } from "@/lib/data/action-points-list";
import type { RoutineExecutionRecord } from "@/lib/contracts/routine-replies";
import { getAdherenceCycleState } from "@/lib/data/asset-adherence";

/** Progresso de implantação não é evidência de aderência recorrente. */
export function buildPublishedActionPointsBoard(
  workspace: GanttWorkspaceData,
  assignments: ActionPointAssignment[],
  records: RoutineExecutionRecord[] = [],
  at = new Date(),
): AdherenceBoard {
  const byId = new Map(assignments.map(item => [item.actionPointId, item]));
  const tasks = workspace.tasks.flatMap(group => group.subitems ?? []);
  return {
    company: workspace.source?.company ?? "",
    source: workspace.source ? { diagnosticId: workspace.source.diagnosticId, name: workspace.source.diagnosticName } : undefined,
    categories: tasks.flatMap(task => {
      if (!task.actionPoint) return [];
      const assignment = byId.get(task.id);
      const ownRecords = records.filter(record => record.cycle.rule.actionPointId === task.id && record.cycle.rule.diagnosticId === workspace.source?.diagnosticId);
      const since = at.getTime() - 30 * 24 * 60 * 60 * 1000;
      const eligible = ownRecords.filter(record => Date.parse(record.cycle.dueAt) >= since && Date.parse(record.cycle.dueAt) <= at.getTime() && !getAdherenceCycleState(record.cycle, at).excluded);
      const reported = eligible.filter(record => getAdherenceCycleState(record.cycle, at).reported).length;
      const validated = eligible.filter(record => getAdherenceCycleState(record.cycle, at).validated).length;
      const executions = eligible.flatMap(record => record.cycle.facts.filter(fact => fact.payload.kind === "execucao_relatada" && Date.parse(fact.recordedAt) <= at.getTime()));
      const latestReport = ownRecords.flatMap(record => record.cycle.facts.filter(fact => fact.payload.kind === "execucao_relatada" && Date.parse(fact.recordedAt) <= at.getTime()))
        .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt) || b.sequence - a.sequence)[0];
      const health = !assignment ? "parado" as const : !eligible.length || !executions.length ? "aguardando" as const
        : reported === eligible.length ? "consistente" as const : reported > 0 ? "atencao" as const : "risco" as const;
      const format = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
      const messages = ownRecords.flatMap(record => record.messages.map(message => ({ ...message, context: `Ciclo de ${format(record.cycle.opensAt)} a ${format(record.cycle.dueAt)}` }))).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
      return [{
        id: task.id,
        name: task.actionPoint.dimensionName,
        colorKey: "governanca" as const,
        version: "Publicada",
        leader: assignment ? { id: `${assignment.assignee.teamId}:${assignment.assignee.userId}`, name: assignment.assignee.name, sector: task.actionPoint.dimensionName, avatarUrl: assignment.assignee.avatarUrl } : null,
        actionPoints: [{
          id: task.id,
          name: task.title,
          frequency: actionPointCadenceLabels[assignment?.cadence ?? defaultCadence(task.actionPoint.priority)],
          mode: "evento" as const,
          health,
          trend: "estavel" as const,
          eventLabel: eligible.length ? `${reported} de ${eligible.length} oportunidades com execução relatada` : "Sem medição",
          actualCounts: { eligible: eligible.length, reported, validated },
          lastCheckIn: latestReport ? format(latestReport.recordedAt) : "Sem relato",
          lastCheckInAt: latestReport?.recordedAt,
          why: task.actionPoint.problem,
          description: task.actionPoint.recommendedAction,
          implementation: {
            stage: actionPointStageLabels[assignment?.stage ?? "sem_responsavel"],
            dueOn: assignment?.dueOn ?? null,
            progress: assignment?.progress ?? null,
            suggestedDeadline: task.actionPoint.suggestedDeadline,
          },
          checkIns: messages.map(message => ({ author: message.name, fromLeader: message.actor === "pessoa", when: format(message.at), message: message.text, context: message.context, source: "slack" as const })),
        }],
      }];
    }),
  };
}
