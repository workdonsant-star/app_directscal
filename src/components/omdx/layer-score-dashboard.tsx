"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OverviewExecutiveCards } from "@/components/omdx/overview-executive-cards";
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

const LayerScoreBarChart = dynamic(
  () =>
    import("@/components/omdx/layer-score-bar-chart").then(
      (module) => module.LayerScoreBarChart,
    ),
  {
    loading: () => <ChartSkeleton label="Carregando pontuação por camada" />,
    ssr: false,
  },
);

const DimensionScoreBarChart = dynamic(
  () =>
    import("@/components/omdx/dimension-score-bar-chart").then(
      (module) => module.DimensionScoreBarChart,
    ),
  {
    loading: () => <ChartSkeleton label="Carregando pontuação por dimensão" />,
    ssr: false,
  },
);

const LayerDimensionStackedChart = dynamic(
  () =>
    import("@/components/omdx/layer-dimension-stacked-chart").then(
      (module) => module.LayerDimensionStackedChart,
    ),
  {
    loading: () => <ChartSkeleton label="Carregando composição por dimensão" />,
    ssr: false,
  },
);

const VulnerabilityQuestionMatrix = dynamic(
  () =>
    import("@/components/omdx/vulnerability-question-matrix").then(
      (module) => module.VulnerabilityQuestionMatrix,
    ),
  {
    loading: () => <MatrixSkeleton label="Carregando vulnerabilidades" />,
    ssr: false,
  },
);

const LeverageMatrix = dynamic(
  () =>
    import("@/components/omdx/leverage-matrix").then(
      (module) => module.LeverageMatrix,
    ),
  {
    loading: () => <MatrixSkeleton label="Carregando alavancas" />,
    ssr: false,
  },
);

function ChartSkeleton({ label }: { label: string }) {
  return (
    <div
      aria-label={label}
      className="h-[376px]"
    >
      <Skeleton className="size-full rounded-[3px]" />
    </div>
  );
}

function MatrixSkeleton({ label }: { label: string }) {
  return (
    <div
      aria-label={label}
      className="h-[316px]"
    >
      <Skeleton className="size-full rounded-[3px]" />
    </div>
  );
}

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
          : "gap-1.5 rounded-[5px] border-0 bg-sidebar p-5 shadow-none ring-0",
        className,
      )}
      data-testid={testId}
    >
      <CardHeader className={cn("px-0", distilled ? "gap-1 pb-1" : "h-10")}>
        <CardTitle
          className="overflow-hidden text-sm leading-5 font-medium text-card-foreground"
          title={description}
        >
          {title ?? description}
        </CardTitle>
        {distilled ? (
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
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

  return (
    <div className={cn("flex flex-col", distilled ? "gap-4" : "gap-6")}>
      {distilled ? null : (
        <OverviewExecutiveCards metrics={metrics} presentation="number" />
      )}

      <section
        aria-label="Comparativos de maturidade"
        className={cn("grid xl:grid-cols-3", distilled ? "gap-4" : "gap-6")}
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
          title="Maturidade por dimensão"
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
          title="Composição por dimensão"
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
        className={cn("grid xl:grid-cols-2", distilled ? "gap-4" : "gap-6")}
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
