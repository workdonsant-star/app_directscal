import type {
  Classification,
  DiagnosticReport,
  DiagnosticReportDimension,
  DimensionId,
} from "@/lib/types";

export type NativeReportBarDatum = {
  label: string;
  referenceValue?: number;
  value: number | null;
};

export type NativeReportMatrixStatus =
  | "attention"
  | "consistent"
  | "critical"
  | "high"
  | "inconsistent"
  | "low"
  | "medium";

export type NativeReportMatrixRow = {
  cells: Array<{
    label: string;
    status: NativeReportMatrixStatus;
  }>;
  label: string;
};

export type NativeReportCharts = {
  anatomyScores: NativeReportBarDatum[];
  benchmarkScores: NativeReportBarDatum[];
  dimensionScores: NativeReportBarDatum[];
  layerScores: NativeReportBarDatum[];
  leverageRows: NativeReportMatrixRow[];
  vulnerabilityRows: NativeReportMatrixRow[];
};

const leverageColumns = ["Cadência", "Papéis", "Dados", "Processos"] as const;

const leverageAffinity: Record<
  DimensionId,
  Record<(typeof leverageColumns)[number], number>
> = {
  cultura: { Cadência: 0.8, Papéis: 1, Dados: 0.45, Processos: 0.55 },
  visao: { Cadência: 1, Papéis: 0.8, Dados: 0.75, Processos: 0.5 },
  comunicacao: { Cadência: 1, Papéis: 0.85, Dados: 0.55, Processos: 0.75 },
  processos: { Cadência: 0.7, Papéis: 0.8, Dados: 0.65, Processos: 1 },
  lideranca: { Cadência: 0.9, Papéis: 1, Dados: 0.75, Processos: 0.6 },
  performance: { Cadência: 0.85, Papéis: 0.65, Dados: 1, Processos: 0.8 },
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function classificationToStatus(
  classification: Classification,
): NativeReportMatrixStatus {
  const statuses: Record<Classification, NativeReportMatrixStatus> = {
    Atenção: "attention",
    Consistente: "consistent",
    Crítico: "critical",
    Inconsistente: "inconsistent",
  };

  return statuses[classification];
}

function classifyQuestionScore(score: number): Classification {
  if (score <= 2) return "Crítico";
  if (score <= 3) return "Inconsistente";
  if (score <= 4) return "Atenção";
  return "Consistente";
}

function getDimensionCriticality(dimension: DiagnosticReportDimension) {
  const maturityDeficit = clamp((5 - dimension.score) / 4, 0, 1);
  const misalignment = clamp((dimension.misalignment?.value ?? 0) / 4, 0, 1);
  const dispersion = clamp(dimension.variance / 4, 0, 1);

  return maturityDeficit * 0.6 + misalignment * 0.25 + dispersion * 0.15;
}

function impactToStatus(value: number): NativeReportMatrixStatus {
  if (value < 45) return "low";
  if (value < 70) return "medium";
  return "high";
}

export function buildNativeReportCharts(
  report: DiagnosticReport,
): NativeReportCharts {
  const orderedDimensions = [...report.dimensions].sort(
    (first, second) => first.number - second.number,
  );
  const criticalDimensions = [...orderedDimensions].sort(
    (first, second) =>
      getDimensionCriticality(second) - getDimensionCriticality(first),
  );

  return {
    layerScores: [
      { label: "Fundador", value: report.layerAverages.fundador },
      { label: "Liderança", value: report.layerAverages.lideranca },
      { label: "Operação", value: report.layerAverages.operacao },
    ],
    dimensionScores: orderedDimensions.map((dimension) => ({
      label: dimension.shortName,
      value: dimension.score,
    })),
    benchmarkScores: [
      { label: "Pontuação", value: report.generalScore },
      { label: "Mínimo", value: report.threshold },
      { label: "Ideal", value: 5 },
    ],
    anatomyScores: orderedDimensions.map((dimension) => ({
      label: dimension.shortName,
      referenceValue: report.threshold,
      value: dimension.score,
    })),
    vulnerabilityRows: criticalDimensions.map((dimension) => ({
      label: dimension.shortName,
      cells: dimension.questions.map((question, index) => ({
        label: `P${index + 1}`,
        status: classificationToStatus(classifyQuestionScore(question.score)),
      })),
    })),
    leverageRows: criticalDimensions.slice(0, 4).map((dimension) => {
      const criticality = getDimensionCriticality(dimension);

      return {
        label: dimension.shortName,
        cells: leverageColumns.map((label) => {
          const value = Math.round(
            (leverageAffinity[dimension.id][label] * 0.6 + criticality * 0.4) *
              100,
          );

          return { label, status: impactToStatus(value) };
        }),
      };
    }),
  };
}
