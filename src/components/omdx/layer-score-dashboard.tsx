"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import { LeverageMatrix } from "@/components/omdx/leverage-matrix";
import { VulnerabilityQuestionMatrix } from "@/components/omdx/vulnerability-question-matrix";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DimensionResult,
  LeverageMatrixRow,
  LayerScoreResult,
  VulnerabilityMatrixRow,
} from "@/lib/data/omdx-overview-analytics";
import { cn } from "@/lib/utils";

type LayerScoreDashboardProps = {
  dimensionScores: DimensionResult[];
  dimensionSummary: string;
  leverageRows: LeverageMatrixRow[];
  scores: LayerScoreResult[];
  summary: string;
  vulnerabilityRows: VulnerabilityMatrixRow[];
};

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
  description: string;
  testId: string;
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

function ChartSkeleton({ label }: { label: string }) {
  return (
    <div
      aria-label={label}
      className="flex h-[376px] items-center justify-center text-sm text-muted-foreground"
    >
      {label}
    </div>
  );
}

function DashboardCard({
  children,
  className,
  description,
  testId,
}: DashboardCardProps) {
  return (
    <Card
      className={cn(
        "gap-1.5 p-5 ring-1 ring-foreground/10 dark:ring-0",
        className,
      )}
      data-testid={testId}
    >
      <CardHeader className="h-10 px-0">
        <CardTitle
          className="overflow-hidden text-sm leading-5 font-medium text-card-foreground"
          title={description}
        >
          {description}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">{children}</CardContent>
    </Card>
  );
}

export function LayerScoreDashboard({
  dimensionScores,
  dimensionSummary,
  leverageRows,
  scores,
  summary,
  vulnerabilityRows,
}: LayerScoreDashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="Comparativos de maturidade"
        className="grid gap-6 xl:grid-cols-3"
      >
        <DashboardCard
          className="h-[462px]"
          description={summary}
          testId="layer-score-card"
        >
          <LayerScoreBarChart data={scores} />
        </DashboardCard>

        <DashboardCard
          className="h-[462px]"
          description={dimensionSummary}
          testId="dimension-score-card"
        >
          <DimensionScoreBarChart data={dimensionScores} />
        </DashboardCard>

        <DashboardCard
          className="h-[462px]"
          description="Compare como Fundador, Liderança e Operação compõem a pontuação de cada dimensão."
          testId="layer-dimension-score-card"
        >
          <LayerDimensionStackedChart data={dimensionScores} />
        </DashboardCard>
      </section>

      <section
        aria-label="Matrizes de vulnerabilidades e alavancas"
        className="grid gap-6 xl:grid-cols-2"
      >
        <DashboardCard
          className="min-h-[414px]"
          description="Principais vulnerabilidades operacionais encontradas nas perguntas de cada dimensão."
          testId="vulnerability-matrix-card"
        >
          <VulnerabilityQuestionMatrix rows={vulnerabilityRows} />
        </DashboardCard>

        <DashboardCard
          className="min-h-[414px]"
          description="Matriz de alavancas"
          testId="leverage-matrix-card"
        >
          <LeverageMatrix rows={leverageRows} />
        </DashboardCard>
      </section>
    </div>
  );
}
