import { describe, expect, it } from "vitest";

import { diagnosticReportSchema } from "@/lib/contracts";
import {
  buildDimensionScoreSummary,
  buildOmdxOverviewAnalyticsFromReports,
  buildOmdxOverviewComparisonFromReports,
} from "@/lib/data/omdx-overview-analytics";
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
      name: "Maturidade",
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

function buildComparisonReport({
  closedAt,
  id,
  score,
}: {
  closedAt: string;
  id: string;
  score: number;
}) {
  const report = buildFounderOnlyReport();

  return diagnosticReportSchema.parse({
    ...report,
    diagnostic: {
      ...report.diagnostic,
      id,
      name: `Diagnóstico ${closedAt.slice(0, 10)}`,
      closedAt,
      status: "encerrado",
    },
    generalScore: score,
    layerAverages: {
      ...report.layerAverages,
      fundador: score,
    },
    weakestDimension: {
      ...report.weakestDimension,
      score,
    },
    dimensions: report.dimensions.map((dimension) => ({
      ...dimension,
      score,
      layerScores: {
        ...dimension.layerScores,
        fundador: score,
      },
      questions: dimension.questions.map((question) => ({
        ...question,
        diagnosticId: id,
        score,
        layerScores: {
          ...question.layerScores,
          fundador: score,
        },
      })),
    })),
  });
}

describe("Maturidade founder analysis base", () => {
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

  it("keeps unavailable layers explicit in the layer dashboard data", () => {
    const analytics = buildOmdxOverviewAnalyticsFromReports([
      buildFounderOnlyReport(),
    ]);

    expect(analytics.layerScores).toEqual([
      { id: "fundador", label: "Fundador", score: 3.4 },
      { id: "lideranca", label: "Liderança", score: null },
      { id: "operacao", label: "Time", score: null },
    ]);
    expect(analytics.layerSummary).toBe(
      "A pontuação disponível é de 3,4/5 para Fundador; as demais camadas ainda não têm base.",
    );
  });

  it("summarizes the six dimension scores without changing their scale", () => {
    const analytics = buildOmdxOverviewAnalyticsFromReports([
      buildFounderOnlyReport(),
    ]);
    const scores = [3.2, 3.8, 2.9, 4.1, 3.5, 3.7];
    const dimensions = analytics.dimensions.map((dimension, index) => ({
      ...dimension,
      maturity: scores[index],
    }));

    expect(analytics.dimensionSummary).toBe(
      "As dimensões apresentam a mesma pontuação de 3,4/5.",
    );
    expect(buildDimensionScoreSummary(dimensions)).toBe(
      "D4 registra a maior pontuação, 4,1/5, enquanto D3 apresenta 2,9/5. A diferença entre as dimensões é de 1,2 ponto.",
    );
  });

  it("prepares the dashboard matrices without inventing missing alignment", () => {
    const analytics = buildOmdxOverviewAnalyticsFromReports([
      buildFounderOnlyReport(),
    ]);

    expect(analytics.vulnerabilityRows).toHaveLength(6);
    expect(analytics.vulnerabilityRows[0].cells).toEqual([
      expect.objectContaining({
        classification: "Atenção",
        label: "P1",
        score: 3.4,
      }),
    ]);
    expect(analytics.leverageRows).toHaveLength(6);
    expect(analytics.leverageRows[0].cells).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Alinhamento",
          level: "Sem dados",
          value: null,
        }),
      ]),
    );
  });

  it("compares the latest closed diagnostic with the average of all previous diagnostics", () => {
    const oldest = buildComparisonReport({
      closedAt: "2026-01-10T00:00:00.000Z",
      id: "00000000-0000-4000-8000-000000000211",
      score: 2,
    });
    const middle = buildComparisonReport({
      closedAt: "2026-03-10T00:00:00.000Z",
      id: "00000000-0000-4000-8000-000000000212",
      score: 4,
    });
    const latest = buildComparisonReport({
      closedAt: "2026-05-10T00:00:00.000Z",
      id: "00000000-0000-4000-8000-000000000213",
      score: 4.5,
    });
    const result = buildOmdxOverviewComparisonFromReports(
      [latest, oldest, middle],
      latest.diagnostic.id,
    );

    expect(result.analytics.dimensions[0].maturity).toBe(4.5);
    expect(result.comparison).toMatchObject({
      currentDiagnosticId: latest.diagnostic.id,
      currentDiagnosticDate: latest.diagnostic.closedAt,
      historicalDiagnosticCount: 2,
      referenceLabel: "Média de 2 diagnósticos anteriores",
    });
    expect(
      result.comparison?.historicalAnalytics.dimensions[0].maturity,
    ).toBe(3);
    expect(
      result.analytics.summaryMetrics.find(
        (metric) => metric.title === "Base de respostas",
      )?.comparison,
    ).toEqual({
      label: "vs. média dos anteriores",
      lowerIsBetter: false,
      percentage: 0,
    });
    expect(
      result.analytics.summaryMetrics.find(
        (metric) => metric.title === "Maturidade geral",
      )?.comparison,
    ).toEqual({
      label: "vs. média dos anteriores",
      lowerIsBetter: false,
      percentage: 50,
    });
    expect(
      result.analytics.summaryMetrics.find(
        (metric) => metric.title === "Risco",
      ),
    ).toMatchObject({
      suffix: "/100",
      comparison: {
        label: "vs. média dos anteriores",
        lowerIsBetter: true,
      },
    });
  });

  it("aggregates every diagnostic and compares the latest report with the previous one", () => {
    const oldest = buildComparisonReport({
      closedAt: "2026-01-10T00:00:00.000Z",
      id: "00000000-0000-4000-8000-000000000214",
      score: 2,
    });
    const middle = buildComparisonReport({
      closedAt: "2026-03-10T00:00:00.000Z",
      id: "00000000-0000-4000-8000-000000000215",
      score: 4,
    });
    const latest = buildComparisonReport({
      closedAt: "2026-05-10T00:00:00.000Z",
      id: "00000000-0000-4000-8000-000000000216",
      score: 4.5,
    });
    const result = buildOmdxOverviewComparisonFromReports([
      latest,
      oldest,
      middle,
    ]);

    expect(result.comparison).toBeNull();
    expect(result.analytics.dimensions[0].maturity).toBe(3.5);
    expect(result.analytics.layerScores[0].score).toBe(3.5);
    expect(result.analytics.vulnerabilityRows[0].cells[0].score).toBe(3.5);
    expect(result.analytics.leverageRows).toHaveLength(6);
    expect(
      result.analytics.summaryMetrics.find(
        (metric) => metric.title === "Base de respostas",
      ),
    ).toMatchObject({
      value: "3",
      comparison: {
        label: "último vs. anterior",
        lowerIsBetter: false,
        percentage: 0,
      },
    });
    expect(
      result.analytics.summaryMetrics.find(
        (metric) => metric.title === "Maturidade geral",
      ),
    ).toMatchObject({
      value: "3,5",
      suffix: "/5",
      comparison: {
        label: "último vs. anterior",
        lowerIsBetter: false,
        percentage: 12.5,
      },
    });
  });

  it("does not show a recent trend when there is no previous report", () => {
    const report = buildComparisonReport({
      closedAt: "2026-05-10T00:00:00.000Z",
      id: "00000000-0000-4000-8000-000000000217",
      score: 4.5,
    });
    const result = buildOmdxOverviewComparisonFromReports([report]);

    expect(
      result.analytics.summaryMetrics.find(
        (metric) => metric.title === "Maturidade geral",
      )?.comparison,
    ).toBeUndefined();
  });

  it("uses only diagnostics older than the selected diagnostic as its reference", () => {
    const oldest = buildComparisonReport({
      closedAt: "2026-01-10T00:00:00.000Z",
      id: "00000000-0000-4000-8000-000000000221",
      score: 2.5,
    });
    const selected = buildComparisonReport({
      closedAt: "2026-03-10T00:00:00.000Z",
      id: "00000000-0000-4000-8000-000000000222",
      score: 3.5,
    });
    const newer = buildComparisonReport({
      closedAt: "2026-05-10T00:00:00.000Z",
      id: "00000000-0000-4000-8000-000000000223",
      score: 4.5,
    });
    const result = buildOmdxOverviewComparisonFromReports(
      [newer, selected, oldest],
      selected.diagnostic.id,
    );

    expect(result.analytics.dimensions[0].maturity).toBe(3.5);
    expect(result.comparison?.historicalDiagnosticCount).toBe(1);
    expect(
      result.comparison?.historicalAnalytics.dimensions[0].maturity,
    ).toBe(2.5);
  });
});
