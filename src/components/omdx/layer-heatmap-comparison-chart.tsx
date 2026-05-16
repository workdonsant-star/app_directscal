"use client";

import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

import type { DimensionResult } from "@/lib/data/omdx-overview-analytics";

type HeatmapDatum = [number, number, number];

type TooltipParam = {
  data?: HeatmapDatum;
};

type LayerHeatmapComparisonChartProps = {
  data: DimensionResult[];
};

const fallbackColors: Record<string, string> = {
  "--background": "#FFFFFF",
  "--border": "#E2E2E5",
  "--foreground": "#111114",
  "--muted": "#F4F4F5",
  "--muted-foreground": "#4A4A52",
  "--popover": "#FFFFFF",
  "--popover-foreground": "#111114",
  "--omdx-layer-diretoria-30": "#A6C8FF",
  "--omdx-layer-lideranca-50": "#1192E8",
  "--omdx-layer-time-70": "#005D5D",
};

const chartFontFamily = "var(--font-inter)";
const chartAxisFontSize = 13;
const chartUiFontSize = 14;
const chartHeight = 460;
const layers = ["Diretoria", "Liderança", "Time"];
const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const shortDimensionNameByFullName: Record<string, string> = {
  "Cultura e Segurança Psicológica": "Cultura",
  "Visão e Alinhamento Estratégico": "Visão",
  "Comunicação e Rituais": "Comunicação",
  "Processos e Sistemas": "Processos",
  "Liderança e Gestão": "Liderança",
  "Performance e Foco": "Performance",
};

function getShortDimensionName(name: string) {
  if (shortDimensionNameByFullName[name]) return shortDimensionNameByFullName[name];
  if (name.includes("Cultura")) return "Cultura";
  if (name.includes("Visão")) return "Visão";
  if (name.includes("Comunicação")) return "Comunicação";
  if (name.includes("Processos")) return "Processos";
  if (name.includes("Liderança")) return "Liderança";
  if (name.includes("Performance")) return "Performance";

  return name;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readCssVariables() {
  if (typeof window === "undefined") return fallbackColors;

  const styles = window.getComputedStyle(document.documentElement);

  return Object.fromEntries(
    Object.entries(fallbackColors).map(([name, fallback]) => [
      name,
      styles.getPropertyValue(name).trim() || fallback,
    ]),
  );
}

function makeHeatmapData(data: DimensionResult[]): HeatmapDatum[] {
  return data.flatMap((dimension, dimensionIndex) => [
    [0, dimensionIndex, dimension.diretoria],
    [1, dimensionIndex, dimension.lideranca],
    [2, dimensionIndex, dimension.time],
  ]);
}

function getHeatmapDatum(value: unknown): HeatmapDatum | null {
  if (
    !Array.isArray(value) ||
    value.length < 3 ||
    typeof value[0] !== "number" ||
    typeof value[1] !== "number" ||
    typeof value[2] !== "number"
  ) {
    return null;
  }

  return [value[0], value[1], value[2]];
}

function makeTooltipFormatter(dimensions: DimensionResult[]) {
  return (params: unknown) => {
    const value =
      params && typeof params === "object" && "data" in params
        ? (params as TooltipParam).data
        : undefined;
    const item = getHeatmapDatum(value);

    if (!item) return "";

    const [layerIndex, dimensionIndex, score] = item;
    const dimension = dimensions[dimensionIndex];
    const layer = layers[layerIndex] ?? "";

    if (!dimension || !layer) return "";

    return `
      <div style="min-width:240px;">
        <div style="margin-bottom:10px;font-weight:600;color:var(--foreground);">${escapeHtml(dimension.dimension)}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;">
          <span style="color:var(--muted-foreground);">${escapeHtml(layer)}</span>
          <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${scoreFormatter.format(score)}</span>
        </div>
      </div>
    `;
  };
}

export function LayerHeatmapComparisonChart({
  data,
}: LayerHeatmapComparisonChartProps) {
  const colors = useMemo(() => readCssVariables(), []);
  const heatmapData = useMemo(() => makeHeatmapData(data), [data]);
  const dimensions = useMemo(
    () => data.map((item) => getShortDimensionName(item.dimension)),
    [data],
  );

  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 500,
      aria: {
        enabled: true,
        label: {
          description:
            "Heatmap das percepções de diretoria, liderança e time por dimensão do OMDx em escala de 1 a 5.",
        },
      },
      grid: {
        top: 44,
        right: 18,
        bottom: 48,
        left: 112,
      },
      tooltip: {
        trigger: "item",
        backgroundColor: colors["--popover"],
        borderColor: colors["--border"],
        borderWidth: 1,
        className: "omdx-echarts-tooltip",
        confine: true,
        extraCssText:
          "box-shadow:0 14px 40px rgba(0,0,0,.12);padding:12px;",
        formatter: makeTooltipFormatter(data),
        renderMode: "html",
        textStyle: {
          color: colors["--popover-foreground"],
          fontFamily: chartFontFamily,
          fontSize: chartUiFontSize,
        },
      },
      xAxis: {
        type: "category",
        data: layers,
        position: "top",
        axisLabel: {
          color: colors["--foreground"],
          fontFamily: chartFontFamily,
          fontSize: chartAxisFontSize,
          fontWeight: 500,
          interval: 0,
          margin: 12,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitArea: { show: false },
        splitLine: {
          show: true,
          lineStyle: {
            color: colors["--border"],
            opacity: 0.4,
          },
        },
      },
      yAxis: {
        type: "category",
        data: dimensions,
        inverse: true,
        axisLabel: {
          color: colors["--foreground"],
          fontFamily: chartFontFamily,
          fontSize: chartAxisFontSize,
          fontWeight: 500,
          margin: 14,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitArea: { show: false },
        splitLine: {
          show: true,
          lineStyle: {
            color: colors["--border"],
            opacity: 0.4,
          },
        },
      },
      visualMap: {
        show: false,
        min: 1,
        max: 5,
        calculable: false,
        inRange: {
          color: [
            colors["--muted"],
            colors["--omdx-layer-diretoria-30"],
            colors["--omdx-layer-lideranca-50"],
            colors["--omdx-layer-time-70"],
          ],
        },
      },
      series: [
        {
          type: "heatmap",
          data: heatmapData,
          label: {
            show: true,
            color: colors["--foreground"],
            fontFamily: chartFontFamily,
            fontSize: chartUiFontSize,
            fontWeight: 600,
            formatter: (params: { value?: unknown }) => {
              const value = getHeatmapDatum(params.value)?.[2];
              return typeof value === "number"
                ? scoreFormatter.format(value)
                : "";
            },
          },
          emphasis: {
            itemStyle: {
              borderColor: colors["--foreground"],
              borderWidth: 1,
            },
          },
          itemStyle: {
            borderColor: colors["--background"],
            borderWidth: 3,
          },
        },
      ],
    }),
    [colors, data, dimensions, heatmapData],
  );

  if (data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Ainda não há percepção por camada para exibir.
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      style={{ height: chartHeight, width: "100%" }}
      opts={{ renderer: "canvas" }}
      aria-label="Visão por camada"
    />
  );
}
