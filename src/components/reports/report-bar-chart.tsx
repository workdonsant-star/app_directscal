"use client";

import type { EChartsOption } from "echarts";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useReducedMotion } from "motion/react";
import { useMemo } from "react";

import { chartBarBorderRadius, chartHistoricalMarkerSymbol } from "@/components/omdx/chart-colors";
import { echarts } from "@/components/omdx/echarts-core";
import { useChartThemeColors } from "@/components/omdx/use-chart-theme-colors";
import styles from "@/components/reports/omdx-report-view.module.css";

export type ReportBarDatum = {
  color: string;
  label: string;
  referenceValue?: number;
  value: number | null;
};

type TooltipParam = { dataIndex?: number };

const fallbackColors: Record<string, string> = {
  "--background": "#FFFFFF",
  "--border": "#E2E2E5",
  "--chart-1": "#0F62FE",
  "--chart-2": "#0072C3",
  "--chart-3": "#007D79",
  "--foreground": "#111114",
  "--muted-foreground": "#4A4A52",
  "--omdx-layer-diretoria-70": "#0043CE",
  "--omdx-layer-lideranca-60": "#0072C3",
  "--omdx-layer-time-50": "#009D9A",
  "--popover": "#FFFFFF",
  "--popover-foreground": "#111114",
};
const chartFontFamily = "var(--font-funnel-sans)";
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

function makeTooltipFormatter(data: ReportBarDatum[]) {
  return (params: unknown) => {
    const dataIndex =
      params && typeof params === "object" && "dataIndex" in params
        ? (params as TooltipParam).dataIndex
        : undefined;
    const item = typeof dataIndex === "number" ? data[dataIndex] : undefined;

    if (!item) return "";

    const score = item.value === null
      ? "Sem dados"
      : `${scoreFormatter.format(item.value)}/5`;
    const reference = item.referenceValue === undefined
      ? ""
      : `
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Mínimo recomendado</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${scoreFormatter.format(item.referenceValue)}/5</span>
          </div>
        `;

    return `
      <div style="min-width:220px;">
        <div style="margin-bottom:10px;font-weight:600;color:var(--foreground);">${escapeHtml(item.label)}</div>
        <div style="display:grid;gap:6px;">
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Pontuação</span>
            <span style="font-variant-numeric:tabular-nums;font-weight:600;color:var(--foreground);">${score}</span>
          </div>
          ${reference}
        </div>
      </div>
    `;
  };
}

export function ReportBarChart({ data, label }: { data: ReportBarDatum[]; label: string }) {
  const colors = useChartThemeColors(fallbackColors);
  const shouldReduceMotion = useReducedMotion();
  const option = useMemo<EChartsOption>(
    () => ({
      animation: !shouldReduceMotion,
      animationDuration: 180,
      aria: { enabled: true, label: { description: label } },
      grid: { bottom: 38, containLabel: true, left: 0, right: 0, top: 28 },
      tooltip: {
        trigger: "item",
        backgroundColor: colors["--popover"],
        borderColor: colors["--border"],
        borderWidth: 1,
        className: "omdx-echarts-tooltip",
        confine: true,
        extraCssText: "box-shadow:0 14px 40px rgba(0,0,0,.12);padding:12px;",
        formatter: makeTooltipFormatter(data),
        renderMode: "html",
        textStyle: {
          color: colors["--popover-foreground"],
          fontFamily: chartFontFamily,
          fontSize: 13,
        },
      },
      xAxis: {
        type: "category",
        data: data.map((datum) => datum.label),
        axisLabel: {
          color: colors["--muted-foreground"],
          fontFamily: chartFontFamily,
          fontSize: 11,
          interval: 0,
          margin: 12,
        },
        axisLine: { lineStyle: { color: colors["--border"] } },
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
          fontSize: 11,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: colors["--border"], opacity: 0.72 } },
      },
      series: [
        {
          name: "Pontuação",
          type: "bar",
          barMaxWidth: 44,
          data: data.map((datum) => ({
            missing: datum.value === null,
            value: datum.value ?? 0,
            itemStyle: {
              borderRadius: [chartBarBorderRadius, chartBarBorderRadius, 0, 0],
              color: colors[datum.color],
              opacity: datum.value === null ? 0 : 0.9,
            },
          })),
          emphasis: { focus: "self", itemStyle: { opacity: 1 } },
          label: {
            show: true,
            position: "top",
            color: colors["--foreground"],
            fontFamily: chartFontFamily,
            fontSize: 12,
            fontWeight: 600,
            formatter: (params: unknown) => {
              if (!params || typeof params !== "object") return "—";

              const value = "value" in params ? params.value : undefined;
              const datum = "data" in params ? params.data : undefined;
              const missing =
                datum !== null &&
                typeof datum === "object" &&
                "missing" in datum &&
                datum.missing === true;

              return missing || typeof value !== "number"
                ? "—"
                : scoreFormatter.format(value);
            },
          },
        },
        {
          name: "Mínimo recomendado",
          type: "scatter",
          symbol: chartHistoricalMarkerSymbol,
          symbolSize: [28, 3],
          data: data.map((datum) => [datum.label, datum.referenceValue ?? null]),
          itemStyle: { color: colors["--foreground"], opacity: 0.62 },
          emphasis: { disabled: true },
          silent: true,
          z: 5,
        },
      ],
    }),
    [colors, data, label, shouldReduceMotion],
  );

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      notMerge
      lazyUpdate
      className={styles.chartCanvas}
      opts={{ renderer: "canvas" }}
      aria-label={label}
    />
  );
}
