"use client";

import type { EChartsOption } from "echarts";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useMemo } from "react";

import { echarts } from "@/components/omdx/echarts-core";
import { useChartThemeColors } from "@/components/omdx/use-chart-theme-colors";
import type { LeverageMatrixRow } from "@/lib/data/omdx-overview-analytics";

type HeatmapDatum = [number, number, number];

type TooltipParam = {
  data?: HeatmapDatum;
};

const fallbackColors: Record<string, string> = {
  "--background": "#FFFFFF",
  "--border": "#E2E2E5",
  "--foreground": "#111114",
  "--muted-foreground": "#4A4A52",
  "--omdx-layer-time-30": "#3DDBD9",
  "--omdx-layer-time-40": "#08BDBA",
  "--omdx-layer-time-50": "#009D9A",
  "--omdx-layer-time-60": "#007D79",
  "--omdx-layer-time-70": "#005D5D",
  "--omdx-score-text-on-dark": "#FFFFFF",
  "--omdx-score-text-on-light": "#161616",
  "--popover": "#FFFFFF",
  "--popover-foreground": "#111114",
};

const chartFontFamily = "var(--font-funnel-sans)";
const chartHeight = 316;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

export function LeverageMatrix({ rows }: { rows: LeverageMatrixRow[] }) {
  const colors = useChartThemeColors(fallbackColors);
  const labels = useMemo(
    () => rows[0]?.cells.map((cell) => cell.label) ?? [],
    [rows],
  );
  const heatmapData = useMemo<HeatmapDatum[]>(
    () =>
      rows.flatMap((row, rowIndex) =>
        row.cells.flatMap((cell, columnIndex) =>
          cell.value === null
            ? []
            : ([[columnIndex, rowIndex, cell.value]] as HeatmapDatum[]),
        ),
      ),
    [rows],
  );
  const heatmapMax = useMemo(
    () => Math.max(...heatmapData.map((datum) => datum[2]), 1),
    [heatmapData],
  );

  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 400,
      aria: {
        enabled: true,
        label: {
          description:
            "Heatmap cartesiano dos índices de alavancagem por dimensão, em escala de 0 a 100.",
        },
      },
      grid: { top: 34, right: 8, bottom: 8, left: 108 },
      tooltip: {
        trigger: "item",
        backgroundColor: colors["--popover"],
        borderColor: colors["--border"],
        borderWidth: 1,
        className: "omdx-echarts-tooltip",
        confine: true,
        extraCssText:
          "box-shadow:0 14px 40px rgba(0,0,0,.12);padding:12px;",
        formatter: (params: unknown) => {
          const datum = getHeatmapDatum(
            params && typeof params === "object" && "data" in params
              ? (params as TooltipParam).data
              : undefined,
          );

          if (!datum) return "";

          const [columnIndex, rowIndex, value] = datum;
          const row = rows[rowIndex];
          const cell = row?.cells[columnIndex];

          if (!row || !cell) return "";

          return `
            <div style="min-width:220px;">
              <div style="margin-bottom:10px;font-weight:600;color:var(--foreground);">${escapeHtml(row.dimension)} · ${escapeHtml(cell.label)}</div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;">
                <span style="color:var(--muted-foreground);">${escapeHtml(cell.level)}</span>
                <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${value}/100</span>
              </div>
            </div>
          `;
        },
        renderMode: "html",
        textStyle: {
          color: colors["--popover-foreground"],
          fontFamily: chartFontFamily,
          fontSize: 12,
        },
      },
      xAxis: {
        type: "category",
        data: labels,
        position: "top",
        axisLabel: {
          color: colors["--muted-foreground"],
          fontFamily: chartFontFamily,
          fontSize: 11,
          fontWeight: 500,
          interval: 0,
          margin: 10,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitArea: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: "category",
        data: rows.map((row) => row.dimension),
        inverse: true,
        axisLabel: {
          color: colors["--muted-foreground"],
          fontFamily: chartFontFamily,
          fontSize: 11,
          fontWeight: 500,
          margin: 14,
          overflow: "truncate",
          width: 88,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitArea: { show: false },
        splitLine: { show: false },
      },
      visualMap: {
        show: false,
        min: 0,
        max: heatmapMax,
        calculable: false,
        inRange: {
          color: [
            colors["--omdx-layer-time-30"],
            colors["--omdx-layer-time-40"],
            colors["--omdx-layer-time-50"],
            colors["--omdx-layer-time-60"],
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
            fontFamily: chartFontFamily,
            fontSize: 10,
            fontWeight: 600,
            formatter: (params: { value?: unknown }) => {
              const datum = getHeatmapDatum(params.value);

              if (!datum) return "";

              const [columnIndex, rowIndex, value] = datum;
              const level = rows[rowIndex]?.cells[columnIndex]?.level;
              const style = value / heatmapMax >= 0.48 ? "light" : "dark";

              return level
                ? `{${style}|${level}}\n{${style}Value|${value}/100}`
                : "";
            },
            rich: {
              dark: {
                color: colors["--omdx-score-text-on-light"],
                lineHeight: 16,
              },
              darkValue: {
                color: colors["--omdx-score-text-on-light"],
                fontSize: 9,
                fontWeight: 400,
                lineHeight: 14,
                opacity: 0.72,
              },
              light: {
                color: colors["--omdx-score-text-on-dark"],
                lineHeight: 16,
              },
              lightValue: {
                color: colors["--omdx-score-text-on-dark"],
                fontSize: 9,
                fontWeight: 400,
                lineHeight: 14,
                opacity: 0.78,
              },
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
            borderWidth: 4,
          },
        },
      ],
    }),
    [colors, heatmapData, heatmapMax, labels, rows],
  );

  if (rows.length === 0 || heatmapData.length === 0) {
    return (
      <div className="flex h-[316px] items-center justify-center text-sm text-muted-foreground">
        Ainda não há dimensões consolidadas para priorizar.
      </div>
    );
  }

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      notMerge
      lazyUpdate
      style={{ height: chartHeight, width: "100%" }}
      opts={{ renderer: "canvas" }}
      aria-label="Heatmap de alavancas por dimensão"
    />
  );
}
