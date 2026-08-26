"use client";

import type { EChartsOption } from "echarts";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useMemo } from "react";

import { echarts } from "@/components/omdx/echarts-core";
import { useChartThemeColors } from "@/components/omdx/use-chart-theme-colors";
import type { DimensionResult } from "@/lib/data/omdx-overview-analytics";

type DimensionScoreBarChartProps = {
  data: DimensionResult[];
  historicalData?: DimensionResult[];
  referenceLabel?: string;
};

type TooltipParam = {
  dataIndex?: number;
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

function formatDelta(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";

  return `${sign}${scoreFormatter.format(Math.abs(value))} ${Math.abs(value) === 1 ? "ponto" : "pontos"}`;
}

function makeTooltipFormatter(
  data: DimensionResult[],
  historicalData: DimensionResult[],
  referenceLabel: string,
) {
  return (params: unknown) => {
    const dataIndex =
      params && typeof params === "object" && "dataIndex" in params
        ? (params as TooltipParam).dataIndex
        : undefined;
    const item = typeof dataIndex === "number" ? data[dataIndex] : undefined;
    const score = getNumericValue(item?.maturity);

    if (!item || score === null) return "";

    const historicalScore =
      historicalData.find(
        (historical) => historical.dimension === item.dimension,
      )?.maturity ?? null;
    const historicalRows =
      historicalScore === null
        ? ""
        : `
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">${escapeHtml(referenceLabel)}</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${scoreFormatter.format(historicalScore)}/5</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Variação</span>
            <span style="font-variant-numeric:tabular-nums;font-weight:600;color:var(--foreground);">${formatDelta(score - historicalScore)}</span>
          </div>
        `;

    return `
      <div style="min-width:240px;">
        <div style="margin-bottom:10px;font-weight:600;color:var(--foreground);">${escapeHtml(item.dimension)}</div>
        <div style="display:grid;gap:6px;">
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Atual</span>
            <span style="font-variant-numeric:tabular-nums;font-weight:600;color:var(--foreground);">${scoreFormatter.format(score)}/5</span>
          </div>
          ${historicalRows}
        </div>
      </div>
    `;
  };
}

export function DimensionScoreBarChart({
  data,
  historicalData = [],
  referenceLabel = "Média histórica",
}: DimensionScoreBarChartProps) {
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
  const historicalScoresByDimension = useMemo(
    () =>
      new Map(
        historicalData.map((dimension) => [
          dimension.dimension,
          dimension.maturity,
        ]),
      ),
    [historicalData],
  );
  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 180,
      aria: {
        enabled: true,
        label: {
          description:
            "Gráfico de barras com as pontuações atuais das seis dimensões e marcadores da média dos diagnósticos anteriores, em escala de 0 a 5.",
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
        formatter: makeTooltipFormatter(
          chartData,
          historicalData,
          referenceLabel,
        ),
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
        {
          name: referenceLabel,
          type: "scatter",
          symbol: "rect",
          symbolSize: [28, 3],
          data: chartData.map((dimension) => [
            dimension.shortDimension,
            historicalScoresByDimension.get(dimension.dimension) ?? null,
          ]),
          itemStyle: {
            color: colors["--foreground"],
            opacity: 0.58,
          },
          z: 5,
        },
      ],
    }),
    [
      chartData,
      colors,
      historicalData,
      historicalScoresByDimension,
      referenceLabel,
    ],
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
