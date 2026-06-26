import {
  ganttWorkspaceDataSchema,
  type DiagnosticActionPlan,
  type DiagnosticActionPoint,
  type GanttTask,
  type GanttTaskStatus,
  type GanttWorkspaceData,
} from "@/lib/contracts";

const defaultAnchorDate = "2026-06-21";

const priorityStatus: Record<DiagnosticActionPoint["priority"], GanttTaskStatus> = {
  Alta: "atencao",
  Média: "planejado",
  Baixa: "proximo",
};

const priorityOffsetDays: Record<DiagnosticActionPoint["priority"], number> = {
  Alta: 0,
  Média: 7,
  Baixa: 14,
};

function parseDateOnly(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: string, days: number) {
  const parsed = parseDateOnly(date);

  parsed.setDate(parsed.getDate() + days);

  return toDateOnly(parsed);
}

function getDeadlineDays(actionPoint: DiagnosticActionPoint) {
  const match = actionPoint.suggestedDeadline.match(/\d+/);

  return match ? Number(match[0]) : 60;
}

function buildActionPointSubitem(
  actionPoint: DiagnosticActionPoint,
  index: number,
  anchorDate: string,
): GanttTask {
  const staggerDays = priorityOffsetDays[actionPoint.priority] + index * 3;
  const deadlineDays = getDeadlineDays(actionPoint);
  const start = addDays(anchorDate, staggerDays);
  const end = addDays(start, Math.max(1, deadlineDays) - 1);

  return {
    id: actionPoint.id,
    title: actionPoint.recommendedAction,
    owner: actionPoint.owner,
    blocker: `${actionPoint.dimensionName}: ${actionPoint.problem}`,
    status: priorityStatus[actionPoint.priority],
    progress: 0,
    start,
    end,
    actionPoint: {
      dimensionId: actionPoint.dimensionId,
      dimensionName: actionPoint.dimensionName,
      problem: actionPoint.problem,
      recommendedAction: actionPoint.recommendedAction,
      owner: actionPoint.owner,
      involved: actionPoint.involved,
      suggestedDeadline: actionPoint.suggestedDeadline,
      expectedImpact: actionPoint.expectedImpact,
      successIndicator: actionPoint.successIndicator,
      priority: actionPoint.priority,
      score: actionPoint.score,
      gap: actionPoint.gap,
    },
  };
}

function getScheduleBounds(tasks: GanttTask[]) {
  return tasks.reduce(
    (bounds, task) => {
      return {
        start:
          parseDateOnly(task.start) < parseDateOnly(bounds.start)
            ? task.start
            : bounds.start,
        end:
          parseDateOnly(task.end) > parseDateOnly(bounds.end)
            ? task.end
            : bounds.end,
      };
    },
    { start: tasks[0].start, end: tasks[0].end },
  );
}

function buildActionPointsTask(
  actionPoints: DiagnosticActionPoint[],
  anchorDate: string,
): GanttTask[] {
  const subitems = actionPoints.map((actionPoint, index) =>
    buildActionPointSubitem(actionPoint, index, anchorDate),
  );

  if (subitems.length === 0) {
    return [];
  }

  const { start, end } = getScheduleBounds(subitems);

  return [
    {
      id: "action_points",
      title: "Action points",
      owner: "Operação",
      blocker: "Plano consolidado de ações priorizadas",
      status: "andamento",
      progress: 0,
      start,
      end,
      subitems,
    },
  ];
}

export function buildGanttWorkspaceDataFromActionPlan(
  plan: DiagnosticActionPlan,
  anchorDate = defaultAnchorDate,
): GanttWorkspaceData {
  return ganttWorkspaceDataSchema.parse({
    source: {
      diagnosticId: plan.diagnostic.id,
      diagnosticName: plan.diagnostic.name,
      company: plan.diagnostic.company,
      generatedAt: plan.generatedAt,
    },
    tasks: buildActionPointsTask(plan.actionPoints, anchorDate),
  });
}
