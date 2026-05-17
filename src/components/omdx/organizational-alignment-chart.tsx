"use client";

import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

import {
  calculateDimensionCriticality,
  calculateDimensionGap,
  classifyCriticalityIndex,
  normalizeLikertToIndex,
  type DimensionResult,
  type ExecutiveMetricStatus,
} from "@/lib/data/omdx-overview-analytics";
import { useChartThemeColors } from "@/components/omdx/use-chart-theme-colors";

type TooltipParam = {
  data?: MaturityCriticalityDatum;
};

type MaturityCriticalityDatum = {
  dimension: string;
  maturityIndex: number;
  criticalityIndex: number;
  status: ExecutiveMetricStatus;
  gap: number | null;
  dispersion: number;
  criticalPercentage: number;
  value: [number, number];
  itemStyle: {
    color: string;
  };
};

type OrganizationalAlignmentChartProps = {
  data?: DimensionResult[];
};

const fallbackColors: Record<string, string> = {
  "--background": "#FFFFFF",
  "--border": "#E2E2E5",
  "--foreground": "#111114",
  "--muted-foreground": "#4A4A52",
  "--popover": "#FFFFFF",
  "--popover-foreground": "#111114",
  "--omdx-dimension-cool-gray-30": "#C1C7CD",
  "--omdx-dimension-cool-gray-40": "#A2A9B0",
  "--omdx-dimension-cool-gray-70": "#4D5358",
  "--omdx-status-consistente": "#0F62FE",
  "--omdx-status-inconsistente": "#A56EFF",
  "--omdx-status-atencao": "#EE5396",
  "--omdx-status-critico": "#FA4D56",
};

const chartFontFamily = "var(--font-inter)";
const chartAxisFontSize = 16;
const chartUiFontSize = 14;
const maturityCutoff = 50;
const criticalityCutoff = 50;
const statusOrder: ExecutiveMetricStatus[] = [
  "Crítico",
  "Inconsistente",
  "Atenção",
  "Consistente",
];
const indexFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});
const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatScoreOrNoBase(value: number | null) {
  return value === null ? "Sem base" : scoreFormatter.format(value);
}

function getStatusColor(
  status: ExecutiveMetricStatus,
  colors: Record<string, string>,
) {
  const colorByStatus: Record<ExecutiveMetricStatus, string> = {
    Consistente: colors["--omdx-status-consistente"],
    Atenção: colors["--omdx-status-atencao"],
    Inconsistente: colors["--omdx-status-inconsistente"],
    Crítico: colors["--omdx-status-critico"],
  };

  return colorByStatus[status];
}

function getQuadrantReading(item: MaturityCriticalityDatum) {
  const highMaturity = item.maturityIndex >= maturityCutoff;
  const highCriticality = item.criticalityIndex >= criticalityCutoff;

  if (highMaturity && !highCriticality) return "Maturidade protegida";
  if (highMaturity && highCriticality) return "Maturidade sob pressão";
  if (!highMaturity && !highCriticality) return "Baixa maturidade controlada";
  return "Baixa maturidade com alta criticidade";
}

function makeTooltipFormatter() {
  return (params: unknown) => {
    const param = Array.isArray(params) ? params[0] : params;
    const item =
      param && typeof param === "object" && "data" in param
        ? (param as TooltipParam).data
        : undefined;

    if (!item) return "";

    return `
      <div style="min-width:280px;">
        <div style="margin-bottom:10px;font-weight:600;color:var(--foreground);">${escapeHtml(item.dimension)}</div>
        <div style="display:grid;gap:6px;">
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Maturidade</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${indexFormatter.format(item.maturityIndex)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Criticidade operacional</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${indexFormatter.format(item.criticalityIndex)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Status</span>
            <span style="font-weight:500;color:var(--foreground);">${escapeHtml(item.status)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Gap</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${formatScoreOrNoBase(item.gap)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Dispersão</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${scoreFormatter.format(item.dispersion)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Respostas críticas</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${indexFormatter.format(item.criticalPercentage)}%</span>
          </div>
        </div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);color:var(--foreground);">${escapeHtml(getQuadrantReading(item))}</div>
      </div>
    `;
  };
}

function makeLabelFormatter() {
  return (params: unknown) => {
    const item =
      params && typeof params === "object" && "data" in params
        ? (params as TooltipParam).data
        : undefined;

    return item?.dimension.split(" ")[0] ?? "";
  };
}

export function OrganizationalAlignmentChart({
  data = [],
}: OrganizationalAlignmentChartProps) {
  const colors = useChartThemeColors(fallbackColors);
  const chartData = useMemo<MaturityCriticalityDatum[]>(
    () =>
      data.map((dimension) => {
        const maturityIndex = normalizeLikertToIndex(dimension.maturity);
        const criticalityIndex = calculateDimensionCriticality(dimension);
        const status = classifyCriticalityIndex(criticalityIndex);

        return {
          dimension: dimension.dimension,
          maturityIndex,
          criticalityIndex,
          status,
          gap: calculateDimensionGap(dimension),
          dispersion: dimension.dispersion,
          criticalPercentage: dimension.criticalPercentage,
          value: [maturityIndex, criticalityIndex],
          itemStyle: {
            color: getStatusColor(status, colors),
          },
        };
      }),
    [colors, data],
  );

  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 500,
      aria: {
        enabled: true,
        label: {
          description:
            "Mapa de maturidade e criticidade, posicionando dimensões do OMDx por maturidade e criticidade operacional em escala de 0 a 100.",
        },
      },
      legend: {
        bottom: 0,
        data: statusOrder.map((name) => ({ name, icon: "circle" })),
        textStyle: {
          color: colors["--muted-foreground"],
          fontFamily: chartFontFamily,
          fontSize: chartUiFontSize,
        },
      },
      grid: {
        top: 38,
        right: 24,
        bottom: 58,
        left: 62,
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
        formatter: makeTooltipFormatter(),
        renderMode: "html",
        textStyle: {
          color: colors["--popover-foreground"],
          fontFamily: chartFontFamily,
          fontSize: chartUiFontSize,
        },
      },
      xAxis: {
        type: "value",
        name: "Maturidade",
        min: 0,
        max: 100,
        interval: 25,
        nameLocation: "middle",
        nameGap: 32,
        nameTextStyle: {
          color: colors["--muted-foreground"],
          fontFamily: chartFontFamily,
          fontSize: chartUiFontSize,
        },
        axisLabel: {
          color: colors["--muted-foreground"],
          fontFamily: chartFontFamily,
          fontSize: chartAxisFontSize,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: {
            color: colors["--border"],
            opacity: 0.55,
          },
        },
      },
      yAxis: {
        type: "value",
        name: "Criticidade",
        min: 0,
        max: 100,
        interval: 25,
        nameTextStyle: {
          color: colors["--muted-foreground"],
          fontFamily: chartFontFamily,
          fontSize: chartUiFontSize,
        },
        axisLabel: {
          color: colors["--muted-foreground"],
          fontFamily: chartFontFamily,
          fontSize: chartAxisFontSize,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: {
            color: colors["--border"],
            opacity: 0.55,
          },
        },
      },
      graphic: [
        {
          type: "text",
          left: 72,
          top: 14,
          style: {
            text: "Baixa maturidade, alta criticidade",
            fill: colors["--muted-foreground"],
            font: `500 12px ${chartFontFamily}`,
          },
        },
        {
          type: "text",
          right: 28,
          bottom: 40,
          style: {
            text: "Alta maturidade, baixa criticidade",
            fill: colors["--muted-foreground"],
            font: `500 12px ${chartFontFamily}`,
          },
        },
      ],
      series: statusOrder.map((status, i) => ({
        name: status,
        type: "scatter",
        symbolSize: 32,
        data: chartData.filter((item) => item.status === status),
        itemStyle: {
          color: getStatusColor(status, colors),
          borderColor: colors["--background"],
          borderWidth: 1.5,
        },
        label: {
          show: true,
          formatter: makeLabelFormatter(),
          color: colors["--foreground"],
          fontFamily: chartFontFamily,
          fontSize: 13,
          fontWeight: 500,
          position: "right",
          distance: 8,
        },
        labelLayout: { moveOverlap: "shiftY" },
        emphasis: {
          focus: "self",
          scale: true,
        },
        ...(i === 0
          ? {
              markArea: {
                silent: true,
                itemStyle: {
                  color: colors["--omdx-dimension-cool-gray-30"],
                  opacity: 0.08,
                },
                data: [
                  [
                    { xAxis: 0, yAxis: criticalityCutoff },
                    { xAxis: maturityCutoff, yAxis: 100 },
                  ],
                  [
                    { xAxis: maturityCutoff, yAxis: 0 },
                    { xAxis: 100, yAxis: criticalityCutoff },
                  ],
                ],
              },
              markLine: {
                silent: true,
                symbol: "none",
                label: { show: false },
                lineStyle: {
                  color: colors["--omdx-dimension-cool-gray-70"],
                  opacity: 0.45,
                  type: "dashed",
                },
                data: [{ xAxis: maturityCutoff }, { yAxis: criticalityCutoff }],
              },
            }
          : {}),
      })),
    }),
    [chartData, colors],
  );

  if (chartData.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        Ainda não há dados consolidados para cruzar maturidade e criticidade.
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      style={{ height: 460, width: "100%" }}
      opts={{ renderer: "canvas" }}
      aria-label="Mapa de Maturidade e Criticidade"
    />
  );
}
