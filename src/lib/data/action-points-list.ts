import type {
  ActionPointAssignee,
  ActionPointAssignment,
  ActionPointCadence,
  ActionPointEvent,
  ActionPointStageValue,
  DiagnosticActionPointPriority,
  GanttActionPointDetails,
  GanttTask,
} from "@/lib/contracts";

export type ActionPointStage = ActionPointStageValue | "sem_responsavel";

export type ActionPointGroupBy = "dimensao" | "responsavel" | "prazo";

export type ActionPointRow = {
  id: string;
  title: string;
  start: string;
  end: string;
  stage: ActionPointStage;
  overdue: boolean;
  assignee: ActionPointAssignee | null;
  cadence: ActionPointCadence;
  progress: number;
  lastInteractionAt: string | null;
  details: GanttActionPointDetails;
};

export type ActionPointGroup = {
  key: string;
  label: string;
  hint: string | null;
  assignee: ActionPointAssignee | null;
  rows: ActionPointRow[];
  summary: {
    total: number;
    active: number;
    progress: number;
    lastInteractionAt: string | null;
    nextEnd: string;
    topPriority: DiagnosticActionPointPriority;
  };
};

export const actionPointStageLabels: Record<ActionPointStage, string> = {
  sem_responsavel: "Sem responsável",
  atribuido: "Atribuído",
  em_implementacao: "Em implementação",
  bloqueado: "Bloqueado",
  concluido: "Concluído",
};

export const actionPointCadenceLabels: Record<ActionPointCadence, string> = {
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
};

const priorityRank: Record<DiagnosticActionPointPriority, number> = {
  Alta: 0,
  Média: 1,
  Baixa: 2,
};

const monthNames = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const noAssigneeKey = "sem_responsavel";

export function defaultCadence(
  priority: DiagnosticActionPointPriority,
): ActionPointCadence {
  return priority === "Alta" ? "semanal" : "quinzenal";
}

export function isActiveStage(stage: ActionPointStage) {
  return stage === "em_implementacao" || stage === "bloqueado";
}

export function flattenActionPoints(
  tasks: GanttTask[],
  assignments: ActionPointAssignment[],
  events: ActionPointEvent[],
  today: string,
): ActionPointRow[] {
  const lastEventById = new Map<string, string>();

  for (const event of events) {
    const current = lastEventById.get(event.actionPointId);
    if (!current || event.createdAt > current) {
      lastEventById.set(event.actionPointId, event.createdAt);
    }
  }

  const assignmentById = new Map(
    assignments.map((assignment) => [assignment.actionPointId, assignment]),
  );
  const rows: ActionPointRow[] = [];

  function visit(task: GanttTask) {
    if (task.actionPoint) {
      const assignment = assignmentById.get(task.id);
      const stage: ActionPointStage = assignment?.stage ?? "sem_responsavel";
      const end = assignment?.dueOn ?? task.end;

      rows.push({
        id: task.id,
        title: task.title,
        start: assignment?.startsOn ?? task.start,
        end,
        stage,
        overdue: stage !== "concluido" && end < today,
        assignee: assignment?.assignee ?? null,
        cadence: assignment?.cadence ?? defaultCadence(task.actionPoint.priority),
        progress: assignment?.progress ?? 0,
        lastInteractionAt: lastEventById.get(task.id) ?? null,
        details: task.actionPoint,
      });
    }
    task.subitems?.forEach(visit);
  }

  tasks.forEach(visit);

  return rows;
}

function latestOf(values: (string | null)[]) {
  return values.reduce<string | null>(
    (latest, value) => (value && (!latest || value > latest) ? value : latest),
    null,
  );
}

// Rótulo da última interação em relação ao dia informado (YYYY-MM-DD).
export function formatLastInteraction(createdAt: string | null, today: string) {
  if (!createdAt) return "Sem interação";

  const day = createdAt.slice(0, 10);
  const days = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) /
      86_400_000,
  );

  if (days <= 0) return "Hoje";
  if (days === 1) return "Ontem";
  if (days < 7) return `Há ${days} dias`;

  return formatShortDate(day);
}

export function formatShortDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return `${day} ${monthNames[month - 1].slice(0, 3)} ${year}`;
}

export function formatMonthLabel(date: string) {
  const [year, month] = date.split("-").map(Number);
  const name = monthNames[month - 1];

  return `${name.charAt(0).toLocaleUpperCase("pt-BR")}${name.slice(1)} de ${year}`;
}

function compareRows(first: ActionPointRow, second: ActionPointRow) {
  return (
    priorityRank[first.details.priority] -
      priorityRank[second.details.priority] ||
    first.end.localeCompare(second.end) ||
    first.title.localeCompare(second.title, "pt-BR")
  );
}

function groupKeyFor(row: ActionPointRow, groupBy: ActionPointGroupBy) {
  if (groupBy === "dimensao") return row.details.dimensionId;
  if (groupBy === "responsavel") return row.assignee?.userId ?? noAssigneeKey;
  return row.end.slice(0, 7);
}

function groupLabelFor(row: ActionPointRow, groupBy: ActionPointGroupBy) {
  if (groupBy === "dimensao") return row.details.dimensionName;
  if (groupBy === "responsavel") return row.assignee?.name ?? "Sem responsável";
  return formatMonthLabel(row.end);
}

export function groupActionPoints(
  rows: ActionPointRow[],
  groupBy: ActionPointGroupBy,
): ActionPointGroup[] {
  const byKey = new Map<string, ActionPointRow[]>();

  for (const row of [...rows].sort(compareRows)) {
    const key = groupKeyFor(row, groupBy);
    byKey.set(key, [...(byKey.get(key) ?? []), row]);
  }

  const groups = [...byKey.entries()].map(([key, groupRows]) => {
    const first = groupRows[0];
    const sortedByEnd = [...groupRows].sort((a, b) =>
      a.end.localeCompare(b.end),
    );

    return {
      key,
      label: groupLabelFor(first, groupBy),
      hint:
        groupBy === "dimensao"
          ? `Nota ${first.details.score.toLocaleString("pt-BR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })} de 5`
          : null,
      assignee: groupBy === "responsavel" ? first.assignee : null,
      rows: groupRows,
      summary: {
        total: groupRows.length,
        active: groupRows.filter((row) => isActiveStage(row.stage)).length,
        progress: Math.round(
          groupRows.reduce((sum, row) => sum + row.progress, 0) /
            groupRows.length,
        ),
        lastInteractionAt: latestOf(groupRows.map((row) => row.lastInteractionAt)),
        nextEnd: sortedByEnd[0].end,
        topPriority: first.details.priority,
      },
    };
  });

  return groups.sort((first, second) => {
    if (groupBy === "dimensao") {
      return (
        first.rows[0].details.score - second.rows[0].details.score ||
        first.label.localeCompare(second.label, "pt-BR")
      );
    }
    if (groupBy === "responsavel") {
      // Quem não tem responsável vem por último.
      if (first.key === noAssigneeKey) return 1;
      if (second.key === noAssigneeKey) return -1;
      return first.label.localeCompare(second.label, "pt-BR");
    }
    return first.key.localeCompare(second.key);
  });
}
