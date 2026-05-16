import {
  type ExecutiveCardMetric,
  OverviewExecutiveCards,
} from "@/components/omdx/overview-executive-cards";
import { DimensionQuestionResultsTable } from "@/components/omdx/dimension-question-results-table";
import {
  getDimensionInsightSummary,
  getDimensionQuestionResults,
} from "@/lib/data/omdx-data-source";
import {
  classifyMaturityIndex,
  classifyMisalignmentIndex,
  formatIndex,
  normalizeGapToIndex,
  normalizeLikertToIndex,
} from "@/lib/data/omdx-overview-analytics";
import type { Dimension } from "@/lib/types";

type DimensionInsightDashboardProps = {
  dimension: Dimension;
  selectedDiagnostic: string;
};

function formatScore(value: number | null) {
  return value === null ? "—" : value.toFixed(1);
}

function buildDimensionMetrics(
  summary: ReturnType<typeof getDimensionInsightSummary>,
  selectedDiagnostic: string,
): ExecutiveCardMetric[] {
  const maturityIndex =
    summary.averageScore === null
      ? null
      : normalizeLikertToIndex(summary.averageScore);
  const variationIndex =
    summary.variation === null ? null : normalizeGapToIndex(summary.variation);

  return [
    {
      title: "Base de respostas",
      value: summary.totalResponses.toLocaleString("pt-BR"),
      classification:
        summary.totalResponses === 0 ? "Sem dados" : "Consistente",
      description:
        selectedDiagnostic === "todos"
          ? "Soma das respostas dos diagnósticos com dados disponíveis."
          : "Total de respostas do diagnóstico selecionado.",
    },
    {
      title: "Maturidade da dimensão",
      value: maturityIndex === null ? "—" : formatIndex(maturityIndex),
      suffix: maturityIndex === null ? undefined : "/100",
      classification:
        maturityIndex === null
          ? "Sem dados"
          : classifyMaturityIndex(maturityIndex),
      description: `Índice normalizado do score médio da dimensão. Valor original: ${formatScore(summary.averageScore)}/5.`,
    },
    {
      title: "Diagnósticos analisados",
      value: summary.diagnosticsWithData.toString(),
      classification:
        summary.diagnosticsWithData === 0 ? "Sem dados" : "Consistente",
      description:
        "Quantidade de diagnósticos com leitura consolidável para esta dimensão.",
    },
    {
      title: "Variação entre diagnósticos",
      value: variationIndex === null ? "—" : formatIndex(variationIndex),
      suffix: variationIndex === null ? undefined : "/100",
      classification:
        variationIndex === null
          ? "Sem dados"
          : classifyMisalignmentIndex(variationIndex),
      description: `Diferença normalizada entre o maior e o menor score. Valor original: ${formatScore(summary.variation)}/5.`,
    },
  ];
}

export function DimensionInsightDashboard({
  dimension,
  selectedDiagnostic,
}: DimensionInsightDashboardProps) {
  const summary = getDimensionInsightSummary(dimension.id, selectedDiagnostic);
  const metrics = buildDimensionMetrics(summary, selectedDiagnostic);
  const questionResults = getDimensionQuestionResults(
    dimension.id,
    selectedDiagnostic,
  );

  return (
    <div className="flex flex-col gap-6">
      <OverviewExecutiveCards metrics={metrics} />

      <DimensionQuestionResultsTable questions={questionResults} />
    </div>
  );
}
