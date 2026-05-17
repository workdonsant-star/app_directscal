"use client";

import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

import {
  calculateDimensionCriticality,
  calculateDimensionGap,
  classifyCriticality,
  getCriticalityReading,
  type DimensionResult,
} from "@/lib/data/omdx-overview-analytics";
import { useChartThemeColors } from "@/components/omdx/use-chart-theme-colors";

type TooltipParam = {
  dataIndex?: number;
  marker?: string;
  value?: number | string | Array<number | string>;
};

type InterventionPriorityRow = DimensionResult & {
  gap: number | null;
  criticality: number;
  classification: string;
  reading: string;
};

type InterventionPriorityChartProps = {
  data?: DimensionResult[];
};

const fallbackColors: Record<string, string> = {
  "--border": "#E2E2E5",
  "--foreground": "#111114",
  "--muted-foreground": "#4A4A52",
  "--popover": "#FFFFFF",
  "--popover-foreground": "#111114",
  "--omdx-dimension-cool-gray-30": "#C1C7CD",
  "--omdx-dimension-cool-gray-50": "#878D96",
  "--omdx-dimension-cool-gray-70": "#4D5358",
  "--omdx-dimension-cool-gray-90": "#21272A",
};

const chartFontFamily = "var(--font-inter)";
const chartAxisFontSize = 16;
const chartUiFontSize = 14;
const chartYAxisLabelWidth = 232;
const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function wrapAxisLabel(label: string, maxCharsPerLine: number, maxLines: number) {
  const words = label.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  let index = 0;

  while (index < words.length) {
    const word = words[index];
    const nextLine = line ? `${line} ${word}` : word;

    if (nextLine.length <= maxCharsPerLine || line.length === 0) {
      line = nextLine;
      index += 1;
      continue;
    }

    lines.push(line);
    line = "";

    if (lines.length === maxLines - 1) break;
  }

  const remainingLine = [line, ...words.slice(index)]
    .filter(Boolean)
    .join(" ");

  if (remainingLine) lines.push(remainingLine);

  return lines.slice(0, maxLines).join("\n");
}

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

function getCriticalityColor(criticality: number, colors: Record<string, string>) {
  if (criticality <= 25) return colors["--omdx-dimension-cool-gray-30"];
  if (criticality <= 50) return colors["--omdx-dimension-cool-gray-50"];
  if (criticality <= 75) return colors["--omdx-dimension-cool-gray-70"];
  return colors["--omdx-dimension-cool-gray-90"];
}

function getTooltipParams(params: unknown): TooltipParam[] {
  if (!Array.isArray(params)) return [];

  return params.filter(
    (param): param is TooltipParam =>
      Boolean(param) && typeof param === "object",
  );
}

function getParamValue(param: TooltipParam) {
  if (Array.isArray(param.value)) {
    const value = param.value[0];
    return typeof value === "number" ? value : Number(value);
  }

  return typeof param.value === "number" ? param.value : Number(param.value);
}

function toChartData(data: DimensionResult[]): InterventionPriorityRow[] {
  return data
    .map((dimension) => {
      const criticality = calculateDimensionCriticality(dimension);
      const classification = classifyCriticality(criticality);

      return {
        ...dimension,
        gap: calculateDimensionGap(dimension),
        criticality,
        classification,
        reading: getCriticalityReading(classification),
      };
    })
    .sort((a, b) => b.criticality - a.criticality);
}

function makeTooltipFormatter(data: InterventionPriorityRow[]) {
  return (params: unknown) => {
    const tooltipParams = getTooltipParams(params);
    const dataIndex = tooltipParams[0]?.dataIndex;
    const item = typeof dataIndex === "number" ? data[dataIndex] : undefined;
    const criticality = tooltipParams[0]
      ? getParamValue(tooltipParams[0])
      : undefined;

    if (!item || typeof criticality !== "number") return "";

    return `
      <div style="min-width:286px;">
        <div style="margin-bottom:10px;font-weight:600;color:var(--foreground);">${escapeHtml(item.dimension)}</div>
        <div style="display:grid;gap:6px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;">
            <span style="display:flex;align-items:center;gap:8px;color:var(--muted-foreground);">${tooltipParams[0]?.marker ?? ""}Criticidade</span>
            <span style="font-family:var(--font-inter);font-variant-numeric:tabular-nums;color:var(--foreground);">${criticality}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Maturidade média</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${scoreFormatter.format(item.maturity)}</span>
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
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${item.criticalPercentage}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Classificação</span>
            <span style="font-weight:500;color:var(--foreground);">${escapeHtml(item.classification)}</span>
          </div>
        </div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);color:var(--foreground);">${escapeHtml(item.reading)}</div>
      </div>
    `;
  };
}

export function InterventionPriorityChart({
  data,
}: InterventionPriorityChartProps) {
  const colors = useChartThemeColors(fallbackColors);
  const sourceData = useMemo(() => data ?? [], [data]);
  const chartData = useMemo(() => toChartData(sourceData), [sourceData]);
  const chartHeight = Math.max(420, chartData.length * 70 + 92);

  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 500,
      aria: {
        enabled: true,
        label: {
          description:
            "Prioridade de Intervenção, barras horizontais ordenadas por criticidade operacional.",
        },
      },
      grid: {
        top: 8,
        right: 46,
        bottom: 36,
        left: 260,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
          shadowStyle: {
            color: "rgba(105, 112, 119, 0.08)",
          },
        },
        backgroundColor: colors["--popover"],
        borderColor: colors["--border"],
        borderWidth: 1,
        className: "omdx-echarts-tooltip",
        confine: true,
        extraCssText:
          "box-shadow:0 14px 40px rgba(0,0,0,.12);padding:12px;",
        formatter: makeTooltipFormatter(chartData),
        renderMode: "html",
        textStyle: {
          color: colors["--popover-foreground"],
          fontFamily: chartFontFamily,
          fontSize: chartUiFontSize,
        },
      },
      xAxis: {
        type: "value",
        min: 0,
        max: 100,
        interval: 25,
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
        type: "category",
        data: chartData.map((item) => item.dimension),
        inverse: true,
        axisLabel: {
          color: colors["--foreground"],
          fontFamily: chartFontFamily,
          fontSize: chartAxisFontSize,
          fontWeight: 500,
          formatter: (value: string) => wrapAxisLabel(value, 24, 2),
          lineHeight: 22,
          margin: 12,
          width: chartYAxisLabelWidth,
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          name: "Criticidade",
          type: "bar",
          barWidth: 18,
          data: chartData.map((item) => ({
            value: item.criticality,
            itemStyle: {
              color: getCriticalityColor(item.criticality, colors),
            },
            label: {
              formatter: `${item.criticality} · ${item.classification}`,
            },
          })),
          label: {
            show: true,
            position: "right",
            color: colors["--muted-foreground"],
            fontFamily: chartFontFamily,
            fontSize: chartUiFontSize,
          },
        },
      ],
    }),
    [chartData, colors],
  );

  if (chartData.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Ainda não há dados consolidados para priorizar intervenções.
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
      aria-label="Prioridade de Intervenção"
    />
  );
}
