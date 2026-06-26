"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DimensionResult } from "@/lib/data/omdx-overview-analytics";

type OverviewChartsProps = {
  data: DimensionResult[];
};

type ChartCardProps = {
  children: ReactNode;
  description: string;
  title: string;
};

const LayerStackedScoreChart = dynamic(
  () =>
    import("@/components/omdx/layer-stacked-score-chart").then(
      (mod) => mod.LayerStackedScoreChart,
    ),
  {
    loading: () => <ChartSkeleton label="Carregando composição por camada" />,
    ssr: false,
  },
);

const LayerHeatmapComparisonChart = dynamic(
  () =>
    import("@/components/omdx/layer-heatmap-comparison-chart").then(
      (mod) => mod.LayerHeatmapComparisonChart,
    ),
  {
    loading: () => <ChartSkeleton label="Carregando visão por camada" />,
    ssr: false,
  },
);

function ChartSkeleton({ label }: { label: string }) {
  return (
    <div
      aria-label={label}
      className="flex h-[460px] w-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
    >
      {label}
    </div>
  );
}

function ChartCard({ children, description, title }: ChartCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function OverviewCharts({ data }: OverviewChartsProps) {
  return (
    <section className="grid gap-8 xl:grid-cols-2">
      <ChartCard
        title="Composição por camada"
        description="Empilha as médias de Fundador, Liderança e Operação para mostrar a composição do score por dimensão."
      >
        <LayerStackedScoreChart data={data} />
      </ChartCard>

      <ChartCard
        title="Visão por camada"
        description="Compara diretoria, liderança e time por dimensão em escala de 1 a 5."
      >
        <LayerHeatmapComparisonChart data={data} />
      </ChartCard>
    </section>
  );
}
