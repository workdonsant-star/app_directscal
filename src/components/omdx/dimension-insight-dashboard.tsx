import {
  type ExecutiveCardMetric,
  OverviewExecutiveCards,
} from "@/components/omdx/overview-executive-cards";
import { DimensionQuestionResultsTable } from "@/components/omdx/dimension-question-results-table";
import {
  calculateLatestVsPreviousComparison,
  classifyMaturityIndex,
  classifyMisalignmentIndex,
  normalizeGapToIndex,
  normalizeLikertToIndex,
} from "@/lib/data/omdx-overview-analytics";
import type { DimensionInsightSummary, DimensionQuestionResult } from "@/lib/types";

type DimensionInsightDashboardProps = {
  questionResults: DimensionQuestionResult[];
  selectedDiagnostic: string;
  summary: DimensionInsightSummary;
};

function formatScore(value: number | null) {
  return value === null
    ? "—"
    : value.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
}

function buildDimensionMetrics(
  summary: DimensionInsightSummary,
  selectedDiagnostic: string,
): ExecutiveCardMetric[] {
  const orderedTrend = [...summary.trend].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
  const latestTrendPoint = orderedTrend.at(-1);
  const gapTrend = orderedTrend.flatMap((point) =>
    point.gap === null
      ? []
      : [
          {
            createdAt: point.createdAt,
            label: point.diagnosticName,
            value: point.gap,
          },
        ],
  );
  const latestGap = gapTrend.at(-1)?.value ?? null;
  const displayedResponses = latestTrendPoint?.responses ?? 0;
  const displayedScore = latestTrendPoint?.score ?? null;
  const maturityIndex =
    displayedScore === null ? null : normalizeLikertToIndex(displayedScore);
  const gapIndex = latestGap === null ? null : normalizeGapToIndex(latestGap);
  const responseComparison = calculateLatestVsPreviousComparison(
    summary.trend.map((point) => ({
      createdAt: point.createdAt,
      value: point.responses,
    })),
  );
  const maturityComparison = calculateLatestVsPreviousComparison(
    summary.trend.map((point) => ({
      createdAt: point.createdAt,
      value: point.score,
    })),
  );
  const gapComparison = calculateLatestVsPreviousComparison(gapTrend);
  const comparisonLabel = "vs. média dos anteriores";

  return [
    {
      title: "Base de respostas",
      value: displayedResponses.toLocaleString("pt-BR"),
      classification:
        displayedResponses === 0 ? "Sem dados" : "Consistente",
      comparison: responseComparison
        ? {
            label: comparisonLabel,
            percentage: responseComparison.percentage,
          }
        : undefined,
      description:
        selectedDiagnostic === "todos"
          ? "Respostas do diagnóstico mais recente, comparadas à média dos anteriores."
          : "Total de respostas do diagnóstico selecionado.",
    },
    {
      title: "Maturidade da dimensão",
      value: formatScore(displayedScore),
      suffix: displayedScore === null ? undefined : "/5",
      classification:
        maturityIndex === null
          ? "Sem dados"
          : classifyMaturityIndex(maturityIndex),
      comparison: maturityComparison
        ? {
            label: comparisonLabel,
            percentage: maturityComparison.percentage,
          }
        : undefined,
      description:
        selectedDiagnostic === "todos"
          ? "Score do diagnóstico mais recente na escala de 1 a 5, comparado à média dos anteriores."
          : "Score do diagnóstico selecionado na escala original da pesquisa, de 1 a 5.",
    },
    {
      title: "Gap médio",
      value: formatScore(latestGap),
      suffix: latestGap === null ? undefined : "/5",
      classification:
        gapIndex === null ? "Sem dados" : classifyMisalignmentIndex(gapIndex),
      comparison: gapComparison
        ? {
            label: comparisonLabel,
            lowerIsBetter: true,
            percentage: gapComparison.percentage,
          }
        : undefined,
      description:
        "Diferença entre a maior e a menor média de camada no diagnóstico mais recente. Quanto menor, melhor.",
    },
  ];
}

export function DimensionInsightDashboard({
  questionResults,
  selectedDiagnostic,
  summary,
}: DimensionInsightDashboardProps) {
  const metrics = buildDimensionMetrics(summary, selectedDiagnostic);

  return (
    <div className="flex flex-col gap-6">
      <OverviewExecutiveCards metrics={metrics} presentation="number" />

      <DimensionQuestionResultsTable questions={questionResults} />
    </div>
  );
}
