import { describe, expect, it } from "vitest";

import type { AdminDeliveryPublication } from "@/lib/contracts";
import { buildGanttWorkspaceDataFromDelivery, buildPublishedActionPlan } from "@/lib/data/action-plan-gantt";
import { adminActionPointTemplates } from "@/lib/data/admin-operations-data-source";
import type { DiagnosticActionPlan } from "@/lib/types";

function buildActionPlan(): DiagnosticActionPlan {
  const dimension = (
    id: "processos" | "cultura",
    name: string,
    score: number,
    gap: number | null,
  ) => ({
    id,
    name,
    shortName: name,
    score,
    classification: "Inconsistente" as const,
    gap,
    layerScores: { fundador: 3, lideranca: 2.8, operacao: 2.5 },
    criticalQuestions: [],
  });

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
      responses: { total: 12, fundador: 1, lideranca: 5, operacao: 6 },
      generalScore: 2.8,
    },
    generatedAt: "2026-06-21T12:00:00.000Z",
    generalScore: 2.8,
    classification: "Inconsistente",
    responses: { total: 12, fundador: 1, lideranca: 5, operacao: 6 },
    weakestDimension: {
      id: "processos",
      name: "Processos",
      shortName: "Processos",
      score: 2.4,
      classification: "Inconsistente",
    },
    highestMisalignment: null,
    layerAverages: { fundador: 3.1, lideranca: 2.8, operacao: 2.5 },
    dimensions: [
      dimension("processos", "Processos", 2.4, 1.1),
      dimension("cultura", "Cultura", 1.8, null),
    ] as unknown as DiagnosticActionPlan["dimensions"],
    actionPoints: [
      {
        id: "action_processos",
        dimensionId: "processos",
        dimensionName: "Processos",
        problem: "Processos críticos dependem de improviso.",
        recommendedAction: "Texto automático que não deve aparecer.",
        owner: "Liderança",
        involved: ["Liderança"],
        suggestedDeadline: "30 dias",
        expectedImpact: "Impacto automático.",
        successIndicator: "Indicador automático.",
        priority: "Alta",
        score: 2.4,
        gap: 1.1,
      },
    ],
  };
}

function publication(
  overrides: Partial<AdminDeliveryPublication>,
): AdminDeliveryPublication {
  return {
    diagnosticId: "00000000-0000-4000-8000-000000000201",
    organizationId: "00000000-0000-4000-8000-000000000301",
    specialistId: "specialist_1",
    status: "publicada",
    report: {
      executiveSummary: "",
      generalReading: "",
      vulnerabilities: "",
      structuralCauses: "",
      recommendations: "",
      conclusion: "",
    },
    dimensionReadings: {},
    selectedActionPointIds: [],
    publishedAt: "2026-06-21T15:00:00.000Z",
    updatedAt: "2026-06-21T15:00:00.000Z",
    ...overrides,
  };
}

describe("buildGanttWorkspaceDataFromDelivery", () => {
  it("inclui apenas as ações que o gestor selecionou, na ordem da seleção", () => {
    const workspace = buildGanttWorkspaceDataFromDelivery({
      plan: buildActionPlan(),
      publication: publication({
        selectedActionPointIds: [
          "action_cultura_criterios",
          "action_processos_ritual",
        ],
      }),
      templates: adminActionPointTemplates,
    });

    expect(workspace.source).toMatchObject({
      company: "Vertex Logistics",
      diagnosticName: "Maturidade operacional 2026",
      generatedAt: "2026-06-21T15:00:00.000Z",
    });
    expect(workspace.tasks[0].subitems?.map((task) => task.id)).toEqual([
      "action_cultura_criterios",
      "action_processos_ritual",
    ]);
  });

  it("usa o texto do catálogo, nota e gap do diagnóstico e prazo ancorado na publicação", () => {
    const workspace = buildGanttWorkspaceDataFromDelivery({
      plan: buildActionPlan(),
      publication: publication({
        selectedActionPointIds: ["action_processos_ritual"],
      }),
      templates: adminActionPointTemplates,
    });
    const task = workspace.tasks[0].subitems?.[0];

    expect(task).toMatchObject({
      title: "Mapear os processos críticos da operação",
      start: "2026-06-21",
      end: "2026-08-04",
      actionPoint: {
        dimensionName: "Processos",
        priority: "Alta",
        score: 2.4,
        gap: 1.1,
        suggestedDeadline: "45 dias",
        expectedImpact:
          "Reduzir variação de execução e dependência individual.",
      },
    });
    expect(task?.actionPoint?.recommendedAction).toContain(
      "Formalizar entradas, etapas",
    );
  });

  it("prefere a leitura do especialista como motivo e cai no diagnóstico quando ela está vazia", () => {
    const withReading = buildGanttWorkspaceDataFromDelivery({
      plan: buildActionPlan(),
      publication: publication({
        selectedActionPointIds: ["action_processos_ritual"],
        dimensionReadings: { processos: "  Leitura do especialista.  " },
      }),
      templates: adminActionPointTemplates,
    });
    const withoutReading = buildGanttWorkspaceDataFromDelivery({
      plan: buildActionPlan(),
      publication: publication({
        selectedActionPointIds: ["action_processos_ritual"],
        dimensionReadings: { processos: "   " },
      }),
      templates: adminActionPointTemplates,
    });

    expect(withReading.tasks[0].subitems?.[0].actionPoint?.problem).toBe(
      "Leitura do especialista.",
    );
    expect(withoutReading.tasks[0].subitems?.[0].actionPoint?.problem).toBe(
      "Processos críticos dependem de improviso.",
    );
  });

  it("ignora ids fora do catálogo e devolve lista vazia sem seleção ou publicação", () => {
    const base = { plan: buildActionPlan(), templates: adminActionPointTemplates };

    expect(
      buildGanttWorkspaceDataFromDelivery({
        ...base,
        publication: publication({ selectedActionPointIds: ["inexistente"] }),
      }).tasks,
    ).toEqual([]);
    expect(
      buildGanttWorkspaceDataFromDelivery({
        ...base,
        publication: publication({
          status: "em_analise",
          publishedAt: null,
          selectedActionPointIds: ["action_processos_ritual"],
        }),
      }),
    ).toEqual({ source: null, tasks: [] });
  });
  it("concilia nomes completos por ID e deduplica seleção no painel e PDF", () => {
    const plan = buildActionPlan();
    plan.dimensions[0].name = "Processos e Execução Operacional";
    const published = publication({ selectedActionPointIds: ["action_processos_ritual", "action_processos_ritual"] });
    const workspace = buildGanttWorkspaceDataFromDelivery({ plan, publication: published, templates: adminActionPointTemplates });
    const pdfPlan = buildPublishedActionPlan(plan, published, adminActionPointTemplates);
    expect(workspace.tasks[0].subitems).toHaveLength(1);
    expect(pdfPlan.actionPoints.map(item => item.id)).toEqual(["action_processos_ritual"]);
    expect(pdfPlan.actionPoints[0].dimensionName).toBe("Processos e Execução Operacional");
    expect(pdfPlan.actionPoints[0].recommendedAction).toBe(workspace.tasks[0].subitems?.[0].actionPoint?.recommendedAction);
  });

  it("recusa rascunho mesmo com timestamp e publicação de outra coleta ou empresa", () => {
    for (const overrides of [{ status: "em_analise" as const }, { diagnosticId: "outra" }, { organizationId: "outra" }]) {
      expect(buildGanttWorkspaceDataFromDelivery({ plan: buildActionPlan(), templates: adminActionPointTemplates,
        publication: publication({selectedActionPointIds: ["action_processos_ritual"], ...overrides})
      })).toEqual({source:null,tasks:[]});
    }
  });

});
