import { describe, expect, it } from "vitest";

import { buildNativeReportCharts } from "@/lib/data/omdx-native-report-charts";
import type { DiagnosticReport, DimensionId } from "@/lib/types";

const dimensionIds: DimensionId[] = [
  "cultura",
  "visao",
  "comunicacao",
  "processos",
  "lideranca",
  "performance",
];

function buildReport(): DiagnosticReport {
  const dimensions = dimensionIds
    .map((id, index) => {
      const score = id === "processos" ? 2.4 : 3.5 + index * 0.1;

      return {
        id,
        number: index + 1,
        name: id,
        shortName: id,
        question: `Pergunta norteadora de ${id}`,
        description: `Descrição de ${id}`,
        score,
        classification: score <= 3 ? ("Inconsistente" as const) : ("Atenção" as const),
        variance: id === "processos" ? 1.2 : 0.2,
        responses: 20,
        layerScores: {
          fundador: null,
          lideranca: score + 0.2,
          operacao: score - 0.1,
        },
        misalignment: {
          value: 0.3,
          highestGroup: "lideranca" as const,
          lowestGroup: "operacao" as const,
        },
        questions: [
          {
            id: `question-${id}`,
            diagnosticId: "diagnostic-1",
            dimensionId: id,
            text: `Afirmação de ${id}`,
            score,
            variance: 0.2,
            responses: 20,
            layerScores: {
              fundador: null,
              lideranca: score + 0.2,
              operacao: score - 0.1,
            },
          },
        ],
      };
    })
    .reverse();

  return {
    diagnostic: {
      id: "diagnostic-1",
      organizationId: "organization-1",
      organizationName: "Shipping Caps",
      company: "Shipping Caps",
      name: "Maturidade Q3",
      description: null,
      templateId: "omdx-v1",
      status: "encerrado",
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-31T10:00:00.000Z",
      activatedAt: "2026-08-01T10:00:00.000Z",
      closedAt: "2026-08-31T10:00:00.000Z",
      deadline: null,
      responses: { total: 20, fundador: 0, lideranca: 4, operacao: 16 },
      generalScore: 3.5,
    },
    generatedAt: "2026-09-04T10:00:00.000Z",
    threshold: 3,
    generalScore: 3.5,
    classification: "Atenção",
    responses: { total: 20, fundador: 0, lideranca: 4, operacao: 16 },
    layerAverages: { fundador: null, lideranca: 3.8, operacao: 3.4 },
    weakestDimension: {
      id: "processos",
      name: "processos",
      shortName: "processos",
      score: 2.4,
      classification: "Inconsistente",
    },
    highestMisalignment: {
      dimensionId: "processos",
      dimensionName: "processos",
      value: 0.3,
      highestGroup: "lideranca",
      lowestGroup: "operacao",
    },
    dimensions,
  };
}

describe("native OMDx report charts", () => {
  it("uses the selected report scores and preserves missing layers", () => {
    const charts = buildNativeReportCharts(buildReport());

    expect(charts.layerScores).toEqual([
      { label: "Fundador", value: null },
      { label: "Liderança", value: 3.8 },
      { label: "Operação", value: 3.4 },
    ]);
    expect(charts.dimensionScores.map((item) => item.label)).toEqual(dimensionIds);
    expect(charts.benchmarkScores).toEqual([
      { label: "Pontuação", value: 3.5 },
      { label: "Mínimo", value: 3 },
      { label: "Ideal", value: 5 },
    ]);
  });

  it("derives question status and priorities from the report dimensions", () => {
    const charts = buildNativeReportCharts(buildReport());

    expect(charts.vulnerabilityRows[0]).toEqual({
      label: "processos",
      cells: [{ label: "P1", status: "inconsistent" }],
    });
    expect(charts.leverageRows).toHaveLength(4);
    expect(charts.leverageRows[0].label).toBe("processos");
    expect(charts.anatomyScores).toContainEqual({
      label: "processos",
      referenceValue: 3,
      value: 2.4,
    });
  });
});
