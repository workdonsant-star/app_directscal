"use client";

import type { EChartsOption } from "echarts";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useMemo } from "react";

import { echarts } from "@/components/omdx/echarts-core";
import {
  chartBarBorderRadius,
  chartHistoricalMarkerSymbol,
  layerColorFallbacks,
  layerColorTokenByGroup,
} from "@/components/omdx/chart-colors";
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
};

const fallbackColors: Record<string, string> = {
  "--background": "#FFFFFF",
  "--border": "#E2E2E5",
  "--foreground": "#111114",
  "--muted-foreground": "#4A4A52",
  "--popover": "#FFFFFF",
  "--popover-foreground": "#111114",
  ...layerColorFallbacks,
};

const chartFontFamily = "var(--font-funnel-sans)";
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
    colorToken: layerColorTokenByGroup.fundador,
    key: "diretoria",
    name: "Fundador",
  },
  {
    colorToken: layerColorTokenByGroup.lideranca,
    key: "lideranca",
    name: "Liderança",
  },
  {
    colorToken: layerColorTokenByGroup.operacao,
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

function formatDelta(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";

  return `${sign}${scoreFormatter.format(Math.abs(value))}`;
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

function getCumulativeLayerScore(
  dimension: ChartDimension,
  layerIndex: number,
) {
  const targetLayer = layers[layerIndex];

  if (!targetLayer || dimension[targetLayer.key] === null) return null;

  return layers
    .slice(0, layerIndex + 1)
    .reduce((total, layer) => total + (dimension[layer.key] ?? 0), 0);
}

function makeTooltipFormatter(
  data: ChartDimension[],
  historicalData: ChartDimension[],
  referenceLabel: string,
) {
  const hasHistoricalData = historicalData.some((dimension) =>
    layers.some((layer) => dimension[layer.key] !== null),
  );

  return (params: unknown) => {
    const items = Array.isArray(params) ? (params as TooltipParam[]) : [];
    const firstItem = items[0];

    if (typeof firstItem?.dataIndex !== "number") return "";

    const dimension = data[firstItem.dataIndex];
    const historicalDimension = historicalData[firstItem.dataIndex];

    if (!dimension) return "";

    const rows = layers
      .map((layer) => {
        const value = dimension[layer.key];

        if (!hasHistoricalData) {
          return `
            <div style="display:flex;justify-content:space-between;gap:24px;">
              <span style="color:var(--muted-foreground);">${layer.name}</span>
              <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${value === null ? "Sem base" : scoreFormatter.format(value)}</span>
            </div>
          `;
        }

        const historicalValue = historicalDimension?.[layer.key] ?? null;
        const delta =
          value === null || historicalValue === null
            ? null
            : value - historicalValue;

        return `
          <div style="display:grid;grid-template-columns:minmax(72px,1fr) 54px 64px 48px;gap:12px;align-items:center;">
            <span style="color:var(--muted-foreground);">${layer.name}</span>
            <span style="font-variant-numeric:tabular-nums;text-align:right;color:var(--foreground);">${value === null ? "—" : scoreFormatter.format(value)}</span>
            <span style="font-variant-numeric:tabular-nums;text-align:right;color:var(--foreground);">${historicalValue === null ? "—" : scoreFormatter.format(historicalValue)}</span>
            <span style="font-variant-numeric:tabular-nums;text-align:right;font-weight:600;color:var(--foreground);">${delta === null ? "—" : formatDelta(delta)}</span>
          </div>
        `;
      })
      .join("");

    return `
      <div style="min-width:${hasHistoricalData ? "340px" : "240px"};">
        <div style="margin-bottom:4px;font-weight:600;color:var(--foreground);">${escapeHtml(dimension.dimension)}</div>
        ${hasHistoricalData ? `<div style="margin-bottom:10px;font-size:11px;color:var(--muted-foreground);">Referência: ${escapeHtml(referenceLabel)}</div>` : ""}
        <div style="display:grid;gap:6px;">
          ${hasHistoricalData ? `<div style="display:grid;grid-template-columns:minmax(72px,1fr) 54px 64px 48px;gap:12px;color:var(--muted-foreground);font-size:11px;">
            <span>Camada</span><span style="text-align:right;">Atual</span><span style="text-align:right;">Histórico</span><span style="text-align:right;">Δ</span>
          </div>` : ""}
          ${rows}
        </div>
      </div>
    `;
  };
}

export function LayerDimensionStackedChart({
  data,
  historicalData = [],
  referenceLabel = "Média histórica",
}: {
  data: DimensionResult[];
  historicalData?: DimensionResult[];
  referenceLabel?: string;
}) {
  const colors = useChartThemeColors(fallbackColors);
  const chartData = useMemo(() => buildChartData(data), [data]);
  const historicalChartData = useMemo(() => {
    const historicalByDimension = new Map(
      buildChartData(historicalData).map((dimension) => [
        dimension.dimension,
        dimension,
      ]),
    );

    return chartData.map(
      (dimension) =>
        historicalByDimension.get(dimension.dimension) ?? {
          dimension: dimension.dimension,
          diretoria: null,
          lideranca: null,
          shortDimension: dimension.shortDimension,
          time: null,
          total: 0,
        },
    );
  }, [chartData, historicalData]);
  const yAxisMax = useMemo(() => {
    const maxValue = Math.max(
      ...chartData.map((item) => item.total),
      ...historicalChartData.map((item) => item.total),
      5,
    );

    return Math.ceil(maxValue / 2) * 2;
  }, [chartData, historicalChartData]);
  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 180,
      aria: {
        enabled: true,
        label: {
          description:
            historicalData.length > 0
              ? "Barras empilhadas com as pontuações do diagnóstico selecionado para Fundador, Liderança e Operação por dimensão e traços neutros indicando a média dos diagnósticos anteriores."
              : "Barras empilhadas com as pontuações consolidadas de Fundador, Liderança e Operação por dimensão em todos os diagnósticos.",
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
        formatter: makeTooltipFormatter(
          chartData,
          historicalChartData,
          referenceLabel,
        ),
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
          name: `${layer.name} · Atual`,
          type: "bar" as const,
          stack: "atual",
          barWidth: 34,
          data: chartData.map((dimension) => dimension[layer.key]),
          itemStyle: {
            borderRadius: chartBarBorderRadius,
            color: colors[layer.colorToken],
            borderColor: colors["--background"],
            borderWidth: 1,
          },
        })),
        ...(historicalData.length > 0
          ? layers.map((layer, layerIndex) => ({
              name: `${layer.name} · Histórico`,
              type: "scatter" as const,
              symbol: chartHistoricalMarkerSymbol,
              symbolSize: [28, 3],
              data: historicalChartData.map((dimension) => [
                dimension.shortDimension,
                getCumulativeLayerScore(dimension, layerIndex),
              ]),
              itemStyle: {
                color: colors["--foreground"],
                opacity: 0.58,
              },
              silent: true,
              tooltip: { show: false },
              z: 5,
            }))
          : []),
        {
          name: "Total",
          type: "scatter" as const,
          symbolSize: 0,
          data: chartData.map((dimension) => [
            dimension.shortDimension,
            dimension.total,
          ]),
          silent: true,
          label: {
            show: true,
            position: "top" as const,
            color: colors["--foreground"],
            fontFamily: chartFontFamily,
            fontSize: 10,
            formatter: (params: { value?: unknown }) => {
              const value = Array.isArray(params.value)
                ? getNumericValue(params.value[1])
                : getNumericValue(params.value);

              return value === null ? "" : scoreFormatter.format(value);
            },
          },
          tooltip: { show: false },
        },
      ],
    }),
    [
      chartData,
      colors,
      historicalChartData,
      historicalData.length,
      referenceLabel,
      yAxisMax,
    ],
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
