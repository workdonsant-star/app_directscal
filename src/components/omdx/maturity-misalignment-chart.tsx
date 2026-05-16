"use client";

import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

import {
  calculateDimensionGap,
  identifyMaturityQuadrant,
  type DimensionResult,
} from "@/lib/data/omdx-overview-analytics";
import { useChartThemeColors } from "@/components/omdx/use-chart-theme-colors";

type TooltipParam = {
  data?: {
    dimension: string;
    maturity: number;
    gap: number;
    quadrant: string;
    reading: string;
    value: [number, number];
  };
};

type MaturityMisalignmentChartProps = {
  data: DimensionResult[];
};

const fallbackColors: Record<string, string> = {
  "--background": "#FFFFFF",
  "--border": "#E2E2E5",
  "--foreground": "#111114",
  "--muted-foreground": "#4A4A52",
  "--popover": "#FFFFFF",
  "--popover-foreground": "#111114",
  "--omdx-layer-lideranca-60": "#0072C3",
  "--omdx-dimension-cool-gray-30": "#C1C7CD",
  "--omdx-dimension-cool-gray-70": "#4D5358",
};

const chartFontFamily = "var(--font-inter)";
const chartAxisFontSize = 16;
const chartUiFontSize = 14;
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

function makeTooltipFormatter() {
  return (params: unknown) => {
    const param = Array.isArray(params) ? params[0] : params;
    const item =
      param && typeof param === "object" && "data" in param
        ? (param as TooltipParam).data
        : undefined;

    if (!item) return "";

    return `
      <div style="min-width:260px;">
        <div style="margin-bottom:10px;font-weight:600;color:var(--foreground);">${escapeHtml(item.dimension)}</div>
        <div style="display:grid;gap:6px;">
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Maturidade média</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${scoreFormatter.format(item.maturity)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Gap</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${scoreFormatter.format(item.gap)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Quadrante</span>
            <span style="font-weight:500;color:var(--foreground);">${escapeHtml(item.quadrant)}</span>
          </div>
        </div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);color:var(--foreground);">${escapeHtml(item.reading)}</div>
      </div>
    `;
  };
}

export function MaturityMisalignmentChart({
  data,
}: MaturityMisalignmentChartProps) {
  const colors = useChartThemeColors(fallbackColors);
  const chartData = useMemo(
    () =>
      data.map((dimension) => {
        const gap = calculateDimensionGap(dimension);
        const quadrant = identifyMaturityQuadrant(dimension.maturity, gap);

        return {
          dimension: dimension.dimension,
          maturity: dimension.maturity,
          gap,
          quadrant: quadrant.name,
          reading: quadrant.reading,
          value: [dimension.maturity, gap] as [number, number],
        };
      }),
    [data],
  );

  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 500,
      aria: {
        enabled: true,
        label: {
          description:
            "Maturidade versus desalinhamento, posicionando dimensões do OMDx por maturidade média e gap entre grupos.",
        },
      },
      grid: {
        top: 34,
        right: 18,
        bottom: 44,
        left: 58,
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
        max: 5,
        interval: 1,
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
        name: "Gap",
        min: 0,
        max: 3,
        interval: 0.75,
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
          right: 24,
          top: 18,
          style: {
            text: "Maduro e alinhado",
            fill: colors["--muted-foreground"],
            font: `500 12px ${chartFontFamily}`,
          },
        },
        {
          type: "text",
          left: 68,
          top: 18,
          style: {
            text: "Imaturo e desalinhado",
            fill: colors["--muted-foreground"],
            font: `500 12px ${chartFontFamily}`,
          },
        },
      ],
      series: [
        {
          name: "Dimensão",
          type: "scatter",
          symbolSize: 13,
          data: chartData,
          itemStyle: {
            color: colors["--omdx-layer-lideranca-60"],
            borderColor: colors["--background"],
            borderWidth: 1,
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
            data: [{ xAxis: 3.5 }, { yAxis: 1.2 }],
          },
        },
      ],
    }),
    [chartData, colors],
  );

  if (data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Ainda não há dados consolidados para cruzar maturidade e desalinhamento.
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      style={{ height: 420, width: "100%" }}
      opts={{ renderer: "canvas" }}
      aria-label="Maturidade × Desalinhamento"
    />
  );
}
