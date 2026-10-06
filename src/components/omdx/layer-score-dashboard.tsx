"use client";

import type { ReactNode } from "react";

import { DimensionScoreBarChart } from "@/components/omdx/dimension-score-bar-chart";
import { LayerDimensionStackedChart } from "@/components/omdx/layer-dimension-stacked-chart";
import { LayerScoreBarChart } from "@/components/omdx/layer-score-bar-chart";
import { LeverageMatrix } from "@/components/omdx/leverage-matrix";
import { OverviewExecutiveCards } from "@/components/omdx/overview-executive-cards";
import { VulnerabilityQuestionMatrix } from "@/components/omdx/vulnerability-question-matrix";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DimensionResult,
  ExecutiveMetric,
  LeverageMatrixRow,
  LayerScoreResult,
  OverviewHistoricalComparison,
  VulnerabilityMatrixRow,
} from "@/lib/data/omdx-overview-analytics";
import { cn } from "@/lib/utils";

type LayerScoreDashboardProps = {
  comparison: OverviewHistoricalComparison | null;
  dimensionScores: DimensionResult[];
  dimensionSummary: string;
  leverageRows: LeverageMatrixRow[];
  metrics: ExecutiveMetric[];
  scores: LayerScoreResult[];
  summary: string;
  vulnerabilityRows: VulnerabilityMatrixRow[];
  presentation?: "default" | "distilled";
};

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
  description: string;
  presentation?: "default" | "distilled";
  testId: string;
  title?: string;
};

function DashboardCard({
  children,
  className,
  description,
  presentation = "default",
  testId,
  title,
}: DashboardCardProps) {
  const distilled = presentation === "distilled";

  return (
    <Card
      className={cn(
        distilled
          ? "gap-0 rounded-[5px] border-0 bg-sidebar p-4 shadow-none ring-0"
          : "gap-1.5 rounded-[10px] border-0 bg-sidebar p-5 shadow-none ring-0",
        className,
      )}
      data-testid={testId}
    >
      <CardHeader
        className={cn(
          "px-0",
          distilled ? "gap-1 pb-1" : "h-[46px] gap-0 pb-0",
        )}
      >
        <CardTitle
          className="overflow-hidden text-sm leading-5 font-semibold text-card-foreground"
          title={description}
        >
          {title ?? description}
        </CardTitle>
        <p
          className={cn(
            "line-clamp-2 text-muted-foreground",
            distilled
              ? "text-xs leading-5"
              : "max-w-[299px] text-[10px] leading-[13px]",
          )}
        >
          {description}
        </p>
      </CardHeader>
      <CardContent className="px-0">{children}</CardContent>
    </Card>
  );
}

export function LayerScoreDashboard({
  comparison,
  dimensionScores,
  dimensionSummary,
  leverageRows,
  metrics,
  scores,
  summary,
  vulnerabilityRows,
  presentation = "default",
}: LayerScoreDashboardProps) {
  const distilled = presentation === "distilled";

  if (distilled) {
    return (
      <div className="flex flex-col gap-4">
        <section
          aria-label="Comparativos de maturidade"
          className="grid gap-4 xl:grid-cols-3"
        >
          <DashboardCard
            className="h-[462px]"
            description={summary}
            presentation={presentation}
            testId="layer-score-card"
            title="Maturidade por camada"
          >
            <LayerScoreBarChart
              data={scores}
              historicalData={comparison?.historicalAnalytics.layerScores}
              referenceLabel={comparison?.referenceLabel}
            />
          </DashboardCard>

          <DashboardCard
            className="h-[462px]"
            description={dimensionSummary}
            presentation={presentation}
            testId="dimension-score-card"
            title="Dimensões gerenciais"
          >
            <DimensionScoreBarChart
              data={dimensionScores}
              historicalData={comparison?.historicalAnalytics.dimensions}
              referenceLabel={comparison?.referenceLabel}
            />
          </DashboardCard>

          <DashboardCard
            className="h-[462px]"
            description={
              comparison
                ? "Compare como Fundador, Liderança e Operação compõem a pontuação atual; os traços indicam a média anterior."
                : "Compare como Fundador, Liderança e Operação compõem a pontuação consolidada de cada dimensão."
            }
            presentation={presentation}
            testId="layer-dimension-score-card"
            title="Dimensões por camadas"
          >
            <LayerDimensionStackedChart
              data={dimensionScores}
              historicalData={comparison?.historicalAnalytics.dimensions}
              referenceLabel={comparison?.referenceLabel}
            />
          </DashboardCard>
        </section>

        <section
          aria-label="Matrizes de vulnerabilidades e alavancas"
          className="grid gap-4 xl:grid-cols-2"
        >
          <DashboardCard
            className="min-h-[414px]"
            description="Principais vulnerabilidades operacionais encontradas nas perguntas de cada dimensão."
            presentation={presentation}
            testId="vulnerability-matrix-card"
            title="Vulnerabilidades por pergunta"
          >
            <VulnerabilityQuestionMatrix rows={vulnerabilityRows} />
          </DashboardCard>

          <DashboardCard
            className="min-h-[414px]"
            description="Cruza maturidade, alinhamento, consenso e prioridade."
            presentation={presentation}
            testId="leverage-matrix-card"
            title="Alavancas prioritárias"
          >
            <LeverageMatrix rows={leverageRows} />
          </DashboardCard>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <OverviewExecutiveCards metrics={metrics} presentation="overview" />

      <section
        aria-label="Visão executiva de maturidade"
        className="grid gap-4 xl:grid-cols-3"
      >
        <DashboardCard
          className="h-[490px] min-w-0"
          description="Entenda as nuances de percepção ao nível de maturidade em gestão sobre cada camada da empresa."
          testId="leverage-matrix-card"
          title="Alavancas prioritárias"
        >
          <LeverageMatrix rows={leverageRows} height={389} />
        </DashboardCard>

        <DashboardCard
          className="h-[490px] min-w-0"
          description="Pontuação de maturidade por dimensão discriminada por camada de gestão."
          testId="layer-dimension-score-card"
          title="Dimensões por camadas"
        >
          <LayerDimensionStackedChart
            data={dimensionScores}
            height={389}
            historicalData={comparison?.historicalAnalytics.dimensions}
            referenceLabel={comparison?.referenceLabel}
          />
        </DashboardCard>

        <DashboardCard
          className="h-[490px] min-w-0"
          description="O índice de maturidade que cada dimensão da empresa atingiu na pesquisa de maturidade."
          testId="dimension-score-card"
          title="Dimensões gerenciais"
        >
          <DimensionScoreBarChart
            data={dimensionScores}
            height={389}
            historicalData={comparison?.historicalAnalytics.dimensions}
            referenceLabel={comparison?.referenceLabel}
          />
        </DashboardCard>
      </section>
    </div>
  );
}
