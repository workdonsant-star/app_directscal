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
import type { LayerScoreResult } from "@/lib/data/omdx-overview-analytics";

type LayerScoreBarChartProps = {
  data: LayerScoreResult[];
  historicalData?: LayerScoreResult[];
  referenceLabel?: string;
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

const colorTokenByLayer: Record<LayerScoreResult["id"], string> = {
  fundador: layerColorTokenByGroup.fundador,
  lideranca: layerColorTokenByGroup.lideranca,
  operacao: layerColorTokenByGroup.operacao,
};
const chartFontFamily = "var(--font-funnel-sans)";
const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function getNumericValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatDelta(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";

  return `${sign}${scoreFormatter.format(Math.abs(value))} ${Math.abs(value) === 1 ? "ponto" : "pontos"}`;
}

function makeTooltipFormatter(
  data: LayerScoreResult[],
  historicalData: LayerScoreResult[],
  referenceLabel: string,
) {
  return (params: unknown) => {
    const dataIndex =
      params && typeof params === "object" && "dataIndex" in params
        ? (params as TooltipParam).dataIndex
        : undefined;
    const item = typeof dataIndex === "number" ? data[dataIndex] : undefined;
    const score = getNumericValue(item?.score);

    if (!item || score === null) return "";

    const historicalScore =
      historicalData.find((historical) => historical.id === item.id)?.score ??
      null;
    const historicalRows =
      historicalScore === null
        ? ""
        : `
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">${referenceLabel}</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${scoreFormatter.format(historicalScore)}/5</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Variação</span>
            <span style="font-variant-numeric:tabular-nums;font-weight:600;color:var(--foreground);">${formatDelta(score - historicalScore)}</span>
          </div>
        `;

    return `
      <div style="min-width:240px;">
        <div style="margin-bottom:10px;font-weight:600;color:var(--foreground);">${item.label === "Time" ? "Operação" : item.label}</div>
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

export function LayerScoreBarChart({
  data,
  historicalData = [],
  referenceLabel = "Média histórica",
}: LayerScoreBarChartProps) {
  const colors = useChartThemeColors(fallbackColors);
  const availableScores = data.filter((layer) => layer.score !== null);
  const historicalScoresByLayer = useMemo(
    () => new Map(historicalData.map((layer) => [layer.id, layer.score])),
    [historicalData],
  );
  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 180,
      aria: {
        enabled: true,
        label: {
          description:
            historicalData.length > 0
              ? "Gráfico de barras com as pontuações do diagnóstico selecionado para Fundador, Liderança e Time e marcadores da média dos diagnósticos anteriores, em escala de 0 a 5."
              : "Gráfico de barras com as pontuações consolidadas de Fundador, Liderança e Time em todos os diagnósticos, em escala de 0 a 5.",
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
        formatter: makeTooltipFormatter(data, historicalData, referenceLabel),
        renderMode: "html",
        textStyle: {
          color: colors["--popover-foreground"],
          fontFamily: chartFontFamily,
          fontSize: 13,
        },
      },
      xAxis: {
        type: "category",
        data: data.map((layer) => layer.label),
        axisLabel: {
          color: colors["--muted-foreground"],
          fontFamily: chartFontFamily,
          fontSize: 10,
          interval: 0,
          margin: 10,
          formatter: (value: string) => (value === "Time" ? "Operação" : value),
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
          data: data.map((layer) => ({
            layer: layer.label,
            value: layer.score,
            itemStyle: {
              borderRadius: chartBarBorderRadius,
              color: colors[colorTokenByLayer[layer.id]],
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

              return value === null ? "Sem base" : scoreFormatter.format(value);
            },
          },
        },
        {
          name: referenceLabel,
          type: "scatter",
          symbol: chartHistoricalMarkerSymbol,
          symbolSize: [28, 3],
          data: data.map((layer) => [
            layer.label,
            historicalScoresByLayer.get(layer.id) ?? null,
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
      colors,
      data,
      historicalData,
      historicalScoresByLayer,
      referenceLabel,
    ],
  );

  if (availableScores.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center text-sm text-muted-foreground">
        Ainda não há respostas suficientes para exibir a pontuação por camada.
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
      aria-label="Pontuação por camada"
    />
  );
}
