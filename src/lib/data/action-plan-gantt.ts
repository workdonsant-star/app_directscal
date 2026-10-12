import {
  ganttWorkspaceDataSchema,
  type AdminActionPointTemplate,
  type AdminDeliveryPublication,
  type DiagnosticActionPlan,
  type DiagnosticActionPointPriority,
  type GanttTask,
  type GanttTaskStatus,
  type GanttWorkspaceData,
} from "@/lib/contracts";

const priorityStatus: Record<DiagnosticActionPointPriority, GanttTaskStatus> = {
  Alta: "atencao",
  Média: "planejado",
  Baixa: "proximo",
};

// Alta começa na publicação; as demais entram em ondas semanais.
const priorityOffsetDays: Record<DiagnosticActionPointPriority, number> = {
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

function getDeadlineDays(deadline: string) {
  const match = deadline.match(/\d+/);

  return match ? Number(match[0]) : 60;
}

function getScheduleBounds(tasks: GanttTask[]) {
  return tasks.reduce(
    (bounds, task) => ({
      start: task.start < bounds.start ? task.start : bounds.start,
      end: task.end > bounds.end ? task.end : bounds.end,
    }),
    { start: tasks[0].start, end: tasks[0].end },
  );
}

function buildSubitem({
  template,
  dimension,
  reading,
  anchorDate,
}: {
  template: AdminActionPointTemplate;
  dimension: DiagnosticActionPlan["dimensions"][number];
  reading: string;
  anchorDate: string;
}): GanttTask {
  const start = addDays(anchorDate, priorityOffsetDays[template.priority]);
  const end = addDays(start, Math.max(1, getDeadlineDays(template.deadline)) - 1);
  const owner = template.owner === "Fundador" ? "Fundador" : "Liderança";

  return {
    id: template.id,
    title: template.title,
    owner,
    blocker: `${dimension.name}: ${reading}`,
    status: priorityStatus[template.priority],
    progress: 0,
    start,
    end,
    actionPoint: {
      dimensionId: dimension.id,
      dimensionName: dimension.name,
      problem: reading,
      recommendedAction: template.description,
      owner,
      involved: [template.involved],
      suggestedDeadline: template.deadline,
      expectedImpact: template.expectedImpact,
      successIndicator: template.successIndicator,
      priority: template.priority,
      score: dimension.score,
      gap: dimension.gap,
    },
  };
}

/**
 * Converte a seleção publicada pelo gestor Directscal em tarefas de lista.
 * O que entra e o texto de cada ação vêm do catálogo da entrega; a nota e o
 * gap vêm do diagnóstico. O "porquê" prioriza a leitura do especialista.
 */
export function buildGanttWorkspaceDataFromDelivery({
  plan,
  publication,
  templates,
}: {
  plan: DiagnosticActionPlan;
  publication: AdminDeliveryPublication;
  templates: AdminActionPointTemplate[];
}): GanttWorkspaceData {
  const publishedAt = publication.publishedAt;

  if (!publishedAt) {
    return { source: null, tasks: [] };
  }

  const anchorDate = publishedAt.slice(0, 10);
  const subitems: GanttTask[] = [];

  for (const id of publication.selectedActionPointIds) {
    const template = templates.find((item) => item.id === id);
    const dimension = template
      ? plan.dimensions.find((item) => item.name === template.dimension)
      : undefined;

    if (!template || !dimension) continue;

    const autoPoint = plan.actionPoints.find(
      (item) => item.dimensionId === dimension.id,
    );
    const reading =
      publication.dimensionReadings[dimension.id]?.trim() ||
      autoPoint?.problem ||
      template.description;

    subitems.push(buildSubitem({ template, dimension, reading, anchorDate }));
  }

  const { start, end } = subitems.length
    ? getScheduleBounds(subitems)
    : { start: anchorDate, end: anchorDate };

  return ganttWorkspaceDataSchema.parse({
    source: {
      diagnosticId: plan.diagnostic.id,
      diagnosticName: plan.diagnostic.name,
      company: plan.diagnostic.company,
      generatedAt: publishedAt,
    },
    tasks: subitems.length
      ? [
          {
            id: "action_points",
            title: "Action points",
            owner: "Operação",
            blocker: "Ações selecionadas pela Directscal para a entrega",
            status: "andamento",
            progress: 0,
            start,
            end,
            subitems,
          },
        ]
      : [],
  });
}
