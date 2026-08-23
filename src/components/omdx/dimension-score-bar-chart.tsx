"use client";

import type { EChartsOption } from "echarts";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useMemo } from "react";

import { echarts } from "@/components/omdx/echarts-core";
import { useChartThemeColors } from "@/components/omdx/use-chart-theme-colors";
import type { DimensionResult } from "@/lib/data/omdx-overview-analytics";

type DimensionScoreBarChartProps = {
  data: DimensionResult[];
};

type TooltipParam = {
  data?: {
    dimension: string;
    value: number;
  };
};

const fallbackColors: Record<string, string> = {
  "--border": "#E2E2E5",
  "--foreground": "#111114",
  "--muted-foreground": "#4A4A52",
  "--popover": "#FFFFFF",
  "--popover-foreground": "#111114",
  "--omdx-chart-lime-deep": "#6E9C11",
};

const chartFontFamily = "var(--font-inter)";
const dimensionOrder = [
  "Comunicação",
  "Processos",
  "Liderança",
  "Cultura",
  "Performance",
  "Visão",
] as const;
const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function getNumericValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeTooltipFormatter() {
  return (params: unknown) => {
    const item =
      params && typeof params === "object" && "data" in params
        ? (params as TooltipParam).data
        : undefined;
    const score = getNumericValue(item?.value);

    if (!item || score === null) return "";

    return `
      <div style="display:flex;min-width:200px;justify-content:space-between;gap:24px;">
        <span style="color:var(--muted-foreground);">${escapeHtml(item.dimension)}</span>
        <span style="font-variant-numeric:tabular-nums;font-weight:600;color:var(--foreground);">${scoreFormatter.format(score)}/5</span>
      </div>
    `;
  };
}

export function DimensionScoreBarChart({ data }: DimensionScoreBarChartProps) {
  const colors = useChartThemeColors(fallbackColors);
  const chartData = useMemo(
    () =>
      [...data].sort((first, second) => {
        const firstIndex = dimensionOrder.indexOf(
          first.shortDimension as (typeof dimensionOrder)[number],
        );
        const secondIndex = dimensionOrder.indexOf(
          second.shortDimension as (typeof dimensionOrder)[number],
        );

        return firstIndex - secondIndex;
      }),
    [data],
  );
  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 180,
      aria: {
        enabled: true,
        label: {
          description:
            "Gráfico de barras com as pontuações consolidadas de Cultura, Visão, Comunicação, Processos, Liderança e Performance em escala de 0 a 5.",
        },
      },
      grid: {
        top: 18,
        right: 0,
        bottom: 30,
        left: 0,
        containLabel: true,
      },
      tooltip: {
        trigger: "item",
        backgroundColor: colors["--popover"],
        borderColor: colors["--border"],
        borderWidth: 1,
        className: "omdx-echarts-tooltip",
        confine: true,
        extraCssText: "box-shadow:0 14px 40px rgba(0,0,0,.12);padding:12px;",
        formatter: makeTooltipFormatter(),
        renderMode: "html",
        textStyle: {
          color: colors["--popover-foreground"],
          fontFamily: chartFontFamily,
          fontSize: 13,
        },
      },
      xAxis: {
        type: "category",
        data: chartData.map((dimension) => dimension.shortDimension),
        axisLabel: {
          color: colors["--muted-foreground"],
          fontFamily: chartFontFamily,
          fontSize: 10,
          interval: 0,
          margin: 10,
        },
        axisLine: {
          lineStyle: {
            color: colors["--border"],
          },
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 5,
        interval: 1,
        axisLabel: {
          color: colors["--muted-foreground"],
          fontFamily: chartFontFamily,
          fontSize: 10,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: {
            color: colors["--border"],
            opacity: 0.65,
          },
        },
      },
      series: [
        {
          name: "Pontuação",
          type: "bar",
          barWidth: 34,
          data: chartData.map((dimension) => ({
            dimension: dimension.shortDimension,
            value: dimension.maturity,
            itemStyle: {
              color: colors["--omdx-chart-lime-deep"],
            },
          })),
          label: {
            show: true,
            position: "top",
            color: colors["--foreground"],
            fontFamily: chartFontFamily,
            fontSize: 10,
            fontWeight: 400,
            formatter: (params: { value?: unknown }) => {
              const value = getNumericValue(params.value);

              return value === null ? "" : scoreFormatter.format(value);
            },
          },
        },
      ],
    }),
    [chartData, colors],
  );

  if (data.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
        Ainda não há respostas suficientes para exibir a pontuação por dimensão.
      </div>
    );
  }

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      notMerge
      lazyUpdate
      style={{ height: 376, width: "100%" }}
      opts={{ renderer: "canvas" }}
      aria-label="Pontuação por dimensão"
    />
  );
}
