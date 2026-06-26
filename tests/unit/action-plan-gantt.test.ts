import { describe, expect, it } from "vitest";

import { buildGanttWorkspaceDataFromActionPlan } from "@/lib/data/action-plan-gantt";
import type { DiagnosticActionPlan } from "@/lib/types";

function buildActionPlan(): DiagnosticActionPlan {
  return {
    diagnostic: {
      id: "00000000-0000-4000-8000-000000000201",
      organizationId: "00000000-0000-4000-8000-000000000301",
      organizationName: "Directscal",
      company: "Vertex Logistics",
      name: "Maturidade operacional 2026",
      description: null,
      templateId: "omdx-v1",
      status: "encerrado",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-20T00:00:00.000Z",
      activatedAt: "2026-06-01T00:00:00.000Z",
      closedAt: "2026-06-20T00:00:00.000Z",
      deadline: null,
      responses: {
        total: 12,
        fundador: 1,
        lideranca: 5,
        operacao: 6,
      },
      generalScore: 2.8,
    },
    generatedAt: "2026-06-21T12:00:00.000Z",
    generalScore: 2.8,
    classification: "Inconsistente",
    responses: {
      total: 12,
      fundador: 1,
      lideranca: 5,
      operacao: 6,
    },
    weakestDimension: {
      id: "processos",
      name: "Processos",
      shortName: "Processos",
      score: 2.4,
      classification: "Inconsistente",
    },
    highestMisalignment: null,
    layerAverages: {
      fundador: 3.1,
      lideranca: 2.8,
      operacao: 2.5,
    },
    dimensions: [],
    actionPoints: [
      {
        id: "action_processos",
        dimensionId: "processos",
        dimensionName: "Processos",
        problem: "Processos críticos dependem de improviso.",
        recommendedAction:
          "Mapear os cinco processos críticos da operação e definir padrão mínimo.",
        owner: "Liderança",
        involved: ["Liderança", "Operação"],
        suggestedDeadline: "30 dias",
        expectedImpact: "Aumentar repetibilidade operacional.",
        successIndicator: "Percentual de processos críticos com dono definido.",
        priority: "Alta",
        score: 2.4,
        gap: 1.1,
      },
    ],
  };
}

describe("action plan Gantt builder", () => {
  it("turns quantitative action points into one scheduled Gantt group", () => {
    const workspace = buildGanttWorkspaceDataFromActionPlan(
      buildActionPlan(),
      "2026-06-21",
    );

    expect(workspace.source).toMatchObject({
      company: "Vertex Logistics",
      diagnosticName: "Maturidade operacional 2026",
    });
    expect(workspace.tasks).toHaveLength(1);
    expect(workspace.tasks[0]).toMatchObject({
      end: "2026-07-20",
      owner: "Operação",
      start: "2026-06-21",
      status: "andamento",
      title: "Action points",
    });
    expect(workspace.tasks[0].subitems).toHaveLength(1);
    expect(workspace.tasks[0].subitems?.[0]).toMatchObject({
      actionPoint: {
        dimensionName: "Processos",
        expectedImpact: "Aumentar repetibilidade operacional.",
        problem: "Processos críticos dependem de improviso.",
        successIndicator: "Percentual de processos críticos com dono definido.",
      },
      blocker: "Processos: Processos críticos dependem de improviso.",
      owner: "Liderança",
      status: "atencao",
      start: "2026-06-21",
      end: "2026-07-20",
    });
    expect(workspace.tasks[0].subitems?.[0].title).toBe(
      "Mapear os cinco processos críticos da operação e definir padrão mínimo.",
    );
  });
});
