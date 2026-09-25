"use client";

import type { EChartsOption } from "echarts";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useMemo } from "react";

import { echarts } from "@/components/omdx/echarts-core";
import {
  chartBarBorderRadius,
  layerColorFallbacks,
  layerColorTokenByGroup,
} from "@/components/omdx/chart-colors";
import { useChartThemeColors } from "@/components/omdx/use-chart-theme-colors";
import type { DimensionQuestionResult, RespondentGroup } from "@/lib/types";

type DimensionQuestionLayerChartProps = {
  scores: DimensionQuestionResult["layerScores"];
};

type TooltipParam = {
  marker?: string;
  seriesName?: string;
};

const fallbackColors: Record<string, string> = {
  "--background": "#FFFFFF",
  "--border": "#E2E2E5",
  "--muted": "#F3F3F5",
  "--muted-foreground": "#4A4A52",
  "--popover": "#FFFFFF",
  "--popover-foreground": "#111114",
  ...layerColorFallbacks,
};
const chartFontFamily = "var(--font-funnel-sans)";
const maxStackedScore = 15;
const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const layers: Array<{
  colorToken: string;
  id: RespondentGroup;
  label: string;
}> = [
  {
    id: "fundador",
    label: "Diretoria",
    colorToken: layerColorTokenByGroup.fundador,
  },
  {
    id: "lideranca",
    label: "Liderança",
    colorToken: layerColorTokenByGroup.lideranca,
  },
  {
    id: "operacao",
    label: "Time",
    colorToken: layerColorTokenByGroup.operacao,
  },
];

function getTotal(scores: DimensionQuestionResult["layerScores"]) {
  return layers.reduce((total, layer) => total + (scores[layer.id] ?? 0), 0);
}

function makeTooltipFormatter(
  scores: DimensionQuestionResult["layerScores"],
  total: number,
) {
  return (params: unknown) => {
    const items = Array.isArray(params) ? (params as TooltipParam[]) : [];
    const rows = layers
      .map((layer) => {
        const score = scores[layer.id];
        const marker =
          items.find((item) => item.seriesName === layer.label)?.marker ?? "";

        return `
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">${marker}${layer.label}</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${score === null ? "Sem base" : scoreFormatter.format(score)}</span>
          </div>
        `;
      })
      .join("");

    return `
      <div style="min-width:220px;">
        <div style="display:grid;gap:6px;">${rows}</div>
        <div style="display:flex;justify-content:space-between;gap:24px;border-top:1px solid var(--border);margin-top:8px;padding-top:8px;">
          <span style="color:var(--muted-foreground);">Total acumulado</span>
          <span style="font-variant-numeric:tabular-nums;font-weight:600;color:var(--foreground);">${scoreFormatter.format(total)} de 15</span>
        </div>
      </div>
    `;
  };
}

export function DimensionQuestionLayerECharts({
  scores,
}: DimensionQuestionLayerChartProps) {
  const colors = useChartThemeColors(fallbackColors);
  const total = getTotal(scores);
  const accessibleDescription = layers
    .map((layer) => {
      const score = scores[layer.id];

      return `${layer.label}: ${score === null ? "sem base" : `${scoreFormatter.format(score)} de 5`}`;
    })
    .concat(`Total acumulado: ${scoreFormatter.format(total)} de 15`)
    .join("; ");
  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 180,
      aria: {
        enabled: true,
        label: { description: accessibleDescription },
      },
      grid: {
        top: 2,
        right: 0,
        bottom: 2,
        left: 0,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: colors["--popover"],
        borderColor: colors["--border"],
        borderWidth: 1,
        className: "omdx-echarts-tooltip",
        confine: true,
        extraCssText: "box-shadow:0 14px 40px rgba(0,0,0,.12);padding:12px;",
        formatter: makeTooltipFormatter(scores, total),
        renderMode: "html",
        textStyle: {
          color: colors["--popover-foreground"],
          fontFamily: chartFontFamily,
          fontSize: 12,
        },
      },
      xAxis: {
        type: "value",
        min: 0,
        max: maxStackedScore,
        show: false,
      },
      yAxis: {
        type: "category",
        data: ["Pontuação"],
        show: false,
      },
      series: layers.map((layer, index) => ({
        name: layer.label,
        type: "bar" as const,
        stack: "camadas",
        barWidth: 16,
        data: [scores[layer.id]],
        showBackground: index === 0,
        backgroundStyle: {
          borderRadius: chartBarBorderRadius,
          color: colors["--muted"],
        },
        itemStyle: {
          borderRadius: chartBarBorderRadius,
          color: colors[layer.colorToken],
        },
      })),
    }),
    [accessibleDescription, colors, scores, total],
  );

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      notMerge
      lazyUpdate
      style={{ height: 22, width: "100%" }}
      opts={{ renderer: "canvas" }}
      aria-label={accessibleDescription}
    />
  );
}
