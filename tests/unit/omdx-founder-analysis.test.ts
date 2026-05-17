import { describe, expect, it } from "vitest";

import { diagnosticReportSchema } from "@/lib/contracts";
import { buildOmdxOverviewAnalyticsFromReports } from "@/lib/data/omdx-overview-analytics";
import type { DimensionId } from "@/lib/types";

const dimensionIds: DimensionId[] = [
  "cultura",
  "visao",
  "comunicacao",
  "processos",
  "lideranca",
  "performance",
];

function buildFounderOnlyReport() {
  const dimensions = dimensionIds.map((id, index) => ({
    id,
    number: index + 1,
    name: `Dimensão ${index + 1}`,
    shortName: `D${index + 1}`,
    question: `Pergunta norteadora ${index + 1}`,
    description: `Descrição ${index + 1}`,
    score: 3.4,
    classification: "Atenção" as const,
    variance: 0,
    responses: 1,
    layerScores: {
      fundador: 3.4,
      lideranca: null,
      operacao: null,
    },
    misalignment: null,
    questions: [
      {
        id: `question-${id}`,
        diagnosticId: "00000000-0000-4000-8000-000000000201",
        dimensionId: id,
        text: `Afirmação ${index + 1}`,
        score: 3.4,
        variance: 0,
        responses: 1,
        layerScores: {
          fundador: 3.4,
          lideranca: null,
          operacao: null,
        },
      },
    ],
  }));

  return diagnosticReportSchema.parse({
    diagnostic: {
      id: "00000000-0000-4000-8000-000000000201",
      organizationId: "00000000-0000-4000-8000-000000000301",
      organizationName: "Directscal",
      company: "Directscal",
      name: "OMDx",
      description: null,
      templateId: "omdx-v1",
      status: "ativo",
      createdAt: "2026-05-17T00:00:00.000Z",
      updatedAt: "2026-05-17T00:00:00.000Z",
      activatedAt: "2026-05-17T00:00:00.000Z",
      closedAt: null,
      deadline: null,
      responses: {
        total: 1,
        fundador: 1,
        lideranca: 0,
        operacao: 0,
      },
      generalScore: 3.4,
    },
    generatedAt: "2026-05-17T00:00:00.000Z",
    threshold: 3,
    generalScore: 3.4,
    classification: "Atenção",
    responses: {
      total: 1,
      fundador: 1,
      lideranca: 0,
      operacao: 0,
    },
    layerAverages: {
      fundador: 3.4,
      lideranca: null,
      operacao: null,
    },
    weakestDimension: {
      id: "cultura",
      name: "Dimensão 1",
      shortName: "D1",
      score: 3.4,
      classification: "Atenção",
    },
    highestMisalignment: null,
    dimensions,
  });
}

describe("OMDx founder analysis base", () => {
  it("accepts founder-only reports without inventing layer scores", () => {
    const report = buildFounderOnlyReport();

    expect(report.layerAverages).toEqual({
      fundador: 3.4,
      lideranca: null,
      operacao: null,
    });
    expect(report.highestMisalignment).toBeNull();
    expect(report.dimensions[0].layerScores.lideranca).toBeNull();
  });

  it("keeps gap-dependent overview metrics without data for founder-only reports", () => {
    const analytics = buildOmdxOverviewAnalyticsFromReports([
      buildFounderOnlyReport(),
    ]);

    expect(analytics.dimensions[0].diretoria).toBe(3.4);
    expect(analytics.dimensions[0].lideranca).toBeNull();
    expect(
      analytics.metrics.find(
        (metric) => metric.title === "Desalinhamento Organizacional",
      )?.classification,
    ).toBe("Sem dados");
  });
});
