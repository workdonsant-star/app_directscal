import { describe, expect, it } from "vitest";

import type {
  ActionPointAssignment,
  ActionPointEvent,
  GanttActionPointDetails,
  GanttTask,
} from "@/lib/contracts";
import {
  defaultCadence,
  flattenActionPoints,
  formatLastInteraction,
  formatShortDate,
  groupActionPoints,
} from "@/lib/data/action-points-list";

function details(
  overrides: Partial<GanttActionPointDetails>,
): GanttActionPointDetails {
  return {
    dimensionId: "processos",
    dimensionName: "Processos",
    problem: "Processos críticos dependem de improviso.",
    recommendedAction: "Mapear os processos críticos.",
    owner: "Liderança",
    involved: ["Operação"],
    suggestedDeadline: "30 dias",
    expectedImpact: "Menos retrabalho.",
    successIndicator: "Processos documentados.",
    priority: "Média",
    score: 2.4,
    gap: 1,
    ...overrides,
  };
}

function task(
  id: string,
  start: string,
  end: string,
  actionPoint: GanttActionPointDetails,
): GanttTask {
  return {
    id,
    title: id,
    owner: actionPoint.owner,
    blocker: actionPoint.problem,
    status: "planejado",
    progress: 0,
    start,
    end,
    actionPoint,
  };
}

function assignment(
  actionPointId: string,
  overrides: Partial<ActionPointAssignment> & {
    userId: string;
    name: string;
  },
): ActionPointAssignment {
  const { userId, name, ...rest } = overrides;

  return {
    diagnosticId: "diag",
    actionPointId,
    assignee: { teamId: "T1", userId, name, avatarUrl: null },
    stage: "atribuido",
    startsOn: null,
    dueOn: null,
    cadence: "semanal",
    progress: 0,
    updatedAt: "2026-10-09T12:00:00.000Z",
    ...rest,
  };
}

const today = "2026-10-09";

const tasks: GanttTask[] = [
  {
    id: "action_points",
    title: "Action points",
    owner: "Operação",
    blocker: "Plano",
    status: "andamento",
    progress: 0,
    start: "2026-10-09",
    end: "2026-12-01",
    subitems: [
      task("a", "2026-10-09", "2026-11-07", details({ priority: "Alta" })),
      task("b", "2026-10-16", "2026-11-20", details({ priority: "Baixa" })),
      task(
        "c",
        "2026-10-09",
        "2026-12-01",
        details({
          dimensionId: "cultura",
          dimensionName: "Cultura",
          score: 1.8,
        }),
      ),
    ],
  },
];

const events: ActionPointEvent[] = [
  { id: "e1", actionPointId: "a", kind: "atribuicao", authorName: "Marina", body: "atribuiu a ação a Ana", detail: null, createdAt: "2026-10-02T10:00:00.000Z" },
  { id: "e2", actionPointId: "a", kind: "andamento", authorName: "Marina", body: "atualizou o progresso de 0% para 40%", detail: null, createdAt: "2026-10-08T15:00:00.000Z" },
];

const assignments = [
  assignment("a", { userId: "U1", name: "Ana", stage: "em_implementacao", progress: 40 }),
  assignment("c", {
    userId: "U1",
    name: "Ana",
    stage: "concluido",
    dueOn: "2026-10-01",
  }),
];

describe("flattenActionPoints", () => {
  const rows = flattenActionPoints(tasks, assignments, events, today);

  it("junta a seleção publicada às atribuições; sem atribuição fica sem responsável", () => {
    expect(rows.map((row) => [row.id, row.stage])).toEqual([
      ["a", "em_implementacao"],
      ["b", "sem_responsavel"],
      ["c", "concluido"],
    ]);
    expect(rows[1].assignee).toBeNull();
  });

  it("usa datas gravadas quando existem e a janela do plano quando não", () => {
    expect(rows[0]).toMatchObject({ start: "2026-10-09", end: "2026-11-07" });
    expect(rows[2].end).toBe("2026-10-01");
  });

  it("marca atraso só para ações não concluídas", () => {
    const late = flattenActionPoints(
      tasks,
      [
        assignment("a", { userId: "U1", name: "Ana", dueOn: "2026-10-01" }),
        assignment("c", {
          userId: "U1",
          name: "Ana",
          stage: "concluido",
          dueOn: "2026-10-01",
        }),
      ],
      [],
      today,
    );

    expect(late.map((row) => row.overdue)).toEqual([true, false, false]);
  });

  it("traz progresso gravado e a última interação de cada ação", () => {
    expect(rows.map((row) => row.progress)).toEqual([40, 0, 0]);
    expect(rows.map((row) => row.lastInteractionAt)).toEqual([
      "2026-10-08T15:00:00.000Z",
      null,
      null,
    ]);
  });

  it("deriva a cadência padrão pela prioridade", () => {
    expect(rows[0].cadence).toBe("semanal");
    expect(rows[1].cadence).toBe("quinzenal");
    expect(defaultCadence("Média")).toBe("quinzenal");
  });
});

describe("groupActionPoints", () => {
  const rows = flattenActionPoints(tasks, assignments, events, today);

  it("agrupa por dimensão com a menor nota primeiro", () => {
    const groups = groupActionPoints(rows, "dimensao");

    expect(groups.map((group) => group.label)).toEqual(["Cultura", "Processos"]);
    expect(groups[0].hint).toBe("Nota 1,8 de 5");
    expect(groups[1].summary).toMatchObject({
      total: 2,
      active: 1,
      progress: 20,
      lastInteractionAt: "2026-10-08T15:00:00.000Z",
      topPriority: "Alta",
    });
  });

  it("agrupa por responsável, deixando quem não tem responsável por último", () => {
    const groups = groupActionPoints(rows, "responsavel");

    expect(groups.map((group) => group.label)).toEqual(["Ana", "Sem responsável"]);
    expect(groups[0].assignee?.userId).toBe("U1");
    expect(groups[0].rows.map((row) => row.id)).toEqual(["a", "c"]);
    expect(groups[1].assignee).toBeNull();
  });

  it("agrupa por mês do prazo em ordem cronológica", () => {
    const groups = groupActionPoints(rows, "prazo");

    expect(groups.map((group) => group.label)).toEqual([
      "Outubro de 2026",
      "Novembro de 2026",
    ]);
  });
});

describe("formatShortDate", () => {
  it("formata datas ISO sem deslocamento de fuso", () => {
    expect(formatShortDate("2026-11-07")).toBe("7 nov 2026");
  });
});

describe("formatLastInteraction", () => {
  it("descreve a distância em dias e cai na data a partir de uma semana", () => {
    const today = "2026-10-09";

    expect(formatLastInteraction(null, today)).toBe("Sem interação");
    expect(formatLastInteraction("2026-10-09T08:00:00.000Z", today)).toBe("Hoje");
    expect(formatLastInteraction("2026-10-08T23:00:00.000Z", today)).toBe("Ontem");
    expect(formatLastInteraction("2026-10-05T10:00:00.000Z", today)).toBe("Há 4 dias");
    expect(formatLastInteraction("2026-09-20T10:00:00.000Z", today)).toBe("20 set 2026");
  });
});
