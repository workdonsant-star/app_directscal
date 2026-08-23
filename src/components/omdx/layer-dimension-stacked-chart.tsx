"use client";

import type { EChartsOption } from "echarts";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useMemo } from "react";

import { echarts } from "@/components/omdx/echarts-core";
import { useChartThemeColors } from "@/components/omdx/use-chart-theme-colors";
import type { DimensionResult } from "@/lib/data/omdx-overview-analytics";

type LayerKey = "diretoria" | "lideranca" | "time";

type ChartDimension = {
  dimension: string;
  diretoria: number | null;
  lideranca: number | null;
  shortDimension: string;
  time: number | null;
  total: number;
};

type TooltipParam = {
  dataIndex?: number;
  marker?: string;
  seriesName?: string;
  value?: unknown;
};

const fallbackColors: Record<string, string> = {
  "--background": "#FFFFFF",
  "--border": "#E2E2E5",
  "--foreground": "#111114",
  "--muted-foreground": "#4A4A52",
  "--popover": "#FFFFFF",
  "--popover-foreground": "#111114",
  "--omdx-chart-lime": "#A8E017",
  "--omdx-chart-lime-deep": "#6E9C11",
  "--omdx-chart-purple": "#7E21FF",
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
const layers: Array<{
  colorToken: string;
  key: LayerKey;
  name: string;
}> = [
  {
    colorToken: "--omdx-chart-lime",
    key: "diretoria",
    name: "Fundador",
  },
  {
    colorToken: "--omdx-chart-lime-deep",
    key: "lideranca",
    name: "Liderança",
  },
  {
    colorToken: "--omdx-chart-purple",
    key: "time",
    name: "Operação",
  },
];
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

function buildChartData(data: DimensionResult[]): ChartDimension[] {
  return data
    .map((dimension) => {
      const values = {
        diretoria: dimension.diretoria,
        lideranca: dimension.lideranca,
        time: dimension.time,
      };

      return {
        ...values,
        dimension: dimension.dimension,
        shortDimension: dimension.shortDimension,
        total: Object.values(values).reduce<number>(
          (sum, value) => sum + (value ?? 0),
          0,
        ),
      };
    })
    .filter((dimension) =>
      layers.some((layer) => dimension[layer.key] !== null),
    )
    .sort((first, second) => {
      const firstIndex = dimensionOrder.indexOf(
        first.shortDimension as (typeof dimensionOrder)[number],
      );
      const secondIndex = dimensionOrder.indexOf(
        second.shortDimension as (typeof dimensionOrder)[number],
      );

      return firstIndex - secondIndex;
    });
}

function makeTooltipFormatter(data: ChartDimension[]) {
  return (params: unknown) => {
    const items = Array.isArray(params) ? (params as TooltipParam[]) : [];
    const firstItem = items.find((item) => item.seriesName !== "Total");

    if (typeof firstItem?.dataIndex !== "number") return "";

    const dimension = data[firstItem.dataIndex];

    if (!dimension) return "";

    const rows = layers
      .map((layer) => {
        const value = dimension[layer.key];
        const marker =
          items.find((item) => item.seriesName === layer.name)?.marker ?? "";

        return `
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">${marker}${layer.name}</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${value === null ? "Sem base" : scoreFormatter.format(value)}</span>
          </div>
        `;
      })
      .join("");

    return `
      <div style="min-width:240px;">
        <div style="margin-bottom:10px;font-weight:600;color:var(--foreground);">${escapeHtml(dimension.dimension)}</div>
        <div style="display:grid;gap:6px;">${rows}</div>
      </div>
    `;
  };
}

export function LayerDimensionStackedChart({
  data,
}: {
  data: DimensionResult[];
}) {
  const colors = useChartThemeColors(fallbackColors);
  const chartData = useMemo(() => buildChartData(data), [data]);
  const yAxisMax = useMemo(() => {
    const maxValue = Math.max(...chartData.map((item) => item.total), 5);

    return Math.ceil(maxValue / 2) * 2;
  }, [chartData]);
  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 180,
      aria: {
        enabled: true,
        label: {
          description:
            "Barras empilhadas com as pontuações de Fundador, Liderança e Operação por dimensão.",
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
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: colors["--popover"],
        borderColor: colors["--border"],
        borderWidth: 1,
        className: "omdx-echarts-tooltip",
        confine: true,
        extraCssText: "box-shadow:0 14px 40px rgba(0,0,0,.12);padding:12px;",
        formatter: makeTooltipFormatter(chartData),
        renderMode: "html",
        textStyle: {
          color: colors["--popover-foreground"],
          fontFamily: chartFontFamily,
          fontSize: 12,
        },
      },
      xAxis: {
        type: "category",
        data: chartData.map((item) => item.shortDimension),
        axisLabel: {
          color: colors["--muted-foreground"],
          fontFamily: chartFontFamily,
          fontSize: 10,
          interval: 0,
          margin: 10,
        },
        axisLine: { lineStyle: { color: colors["--border"] } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: yAxisMax,
        interval: 2,
        axisLabel: {
          color: colors["--muted-foreground"],
          fontFamily: chartFontFamily,
          fontSize: 10,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: { color: colors["--border"], opacity: 0.65 },
        },
      },
      series: [
        ...layers.map((layer) => ({
          name: layer.name,
          type: "bar" as const,
          stack: "camadas",
          barWidth: 34,
          data: chartData.map((dimension) => dimension[layer.key]),
          itemStyle: {
            color: colors[layer.colorToken],
            borderColor: colors["--background"],
            borderWidth: 1,
          },
        })),
        {
          name: "Total",
          type: "bar" as const,
          barGap: "-100%",
          barWidth: 34,
          data: chartData.map((dimension) => dimension.total),
          silent: true,
          itemStyle: { color: "transparent" },
          label: {
            show: true,
            position: "top" as const,
            color: colors["--foreground"],
            fontFamily: chartFontFamily,
            fontSize: 10,
            formatter: (params: { value?: unknown }) => {
              const value = getNumericValue(params.value);

              return value === null ? "" : scoreFormatter.format(value);
            },
          },
          tooltip: { show: false },
        },
      ],
    }),
    [chartData, colors, yAxisMax],
  );

  if (chartData.length === 0) {
    return (
      <div className="flex h-[376px] items-center justify-center text-sm text-muted-foreground">
        Ainda não há base por camada para exibir.
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
      aria-label="Pontuação das dimensões por camada"
    />
  );
}
