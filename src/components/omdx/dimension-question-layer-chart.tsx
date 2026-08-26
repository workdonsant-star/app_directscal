"use client";

import dynamic from "next/dynamic";

import type { DimensionQuestionResult } from "@/lib/types";

type DimensionQuestionLayerChartProps = {
  scores: DimensionQuestionResult["layerScores"];
};

const DimensionQuestionLayerECharts = dynamic(
  () =>
    import("@/components/omdx/dimension-question-layer-echarts").then(
      (mod) => mod.DimensionQuestionLayerECharts,
    ),
  {
    loading: () => (
      <div
        className="h-[22px] w-full bg-muted"
        aria-label="Carregando pontuação empilhada"
      />
    ),
    ssr: false,
  },
);

export function DimensionQuestionLayerChart({
  scores,
}: DimensionQuestionLayerChartProps) {
  return <DimensionQuestionLayerECharts scores={scores} />;
}
