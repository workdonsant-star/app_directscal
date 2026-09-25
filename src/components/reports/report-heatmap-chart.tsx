"use client";

import type { EChartsOption } from "echarts";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useReducedMotion } from "motion/react";
import { useMemo } from "react";

import { echarts } from "@/components/omdx/echarts-core";
import { useChartThemeColors } from "@/components/omdx/use-chart-theme-colors";
import styles from "@/components/reports/omdx-report-view.module.css";
import type { NativeReportMatrixStatus } from "@/lib/data/omdx-native-report-charts";

type MatrixRow = {
  cells: Array<{ label: string; status: NativeReportMatrixStatus }>;
  label: string;
};

type HeatmapDatum = {
  column: string;
  label: { color: string };
  row: string;
  status: NativeReportMatrixStatus;
  value: [number, number, number];
};

type TooltipParam = { data?: HeatmapDatum };

const statusLabels: Record<NativeReportMatrixStatus, string> = {
  attention: "Atenção",
  consistent: "Consistente",
  critical: "Crítico",
  high: "Alto",
  inconsistent: "Inconsistente",
  low: "Baixo",
  medium: "Médio",
};
const statusColorTokens: Record<NativeReportMatrixStatus, string> = {
  attention: "--omdx-layer-diretoria-30",
  consistent: "--omdx-layer-time-30",
  critical: "--omdx-layer-lideranca-purple-60",
  high: "--omdx-layer-lideranca-purple-60",
  inconsistent: "--omdx-layer-lideranca-purple-30",
  low: "--omdx-layer-time-30",
  medium: "--omdx-layer-diretoria-30",
};
const statusValues: Record<NativeReportMatrixStatus, number> = {
  attention: 0,
  consistent: 1,
  critical: 2,
  high: 3,
  inconsistent: 4,
  low: 5,
  medium: 6,
};
const fallbackColors: Record<string, string> = {
  "--background": "#FFFFFF",
  "--border": "#E2E2E5",
  "--foreground": "#111114",
  "--muted-foreground": "#4A4A52",
  "--omdx-layer-diretoria-30": "#A6C8FF",
  "--omdx-layer-lideranca-purple-30": "#D4BBFF",
  "--omdx-layer-lideranca-purple-60": "#8A3FFC",
  "--omdx-layer-time-30": "#9EF0F0",
  "--popover": "#FFFFFF",
  "--popover-foreground": "#111114",
  "--primary-foreground": "#FFFFFF",
};
const chartFontFamily = "var(--font-funnel-sans)";

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
    const datum =
      params && typeof params === "object" && "data" in params
        ? (params as TooltipParam).data
        : undefined;

    if (!datum) return "";

    return `
      <div style="min-width:220px;">
        <div style="margin-bottom:10px;font-weight:600;color:var(--foreground);">${escapeHtml(datum.row)}</div>
        <div style="display:flex;justify-content:space-between;gap:24px;">
          <span style="color:var(--muted-foreground);">${escapeHtml(datum.column)}</span>
          <span style="font-weight:600;color:var(--foreground);">${statusLabels[datum.status]}</span>
        </div>
      </div>
    `;
  };
}

export function ReportHeatmapChart({
  columns,
  label,
  rows,
}: {
  columns: string[];
  label: string;
  rows: MatrixRow[];
}) {
  const colors = useChartThemeColors(fallbackColors);
  const shouldReduceMotion = useReducedMotion();
  const chartData = useMemo<HeatmapDatum[]>(
    () =>
      rows.flatMap((row, rowIndex) =>
        row.cells.map((cell, columnIndex) => ({
          column: cell.label,
          label: {
            color:
              cell.status === "critical" || cell.status === "high"
                ? colors["--primary-foreground"]
                : colors["--foreground"],
          },
          row: row.label,
          status: cell.status,
          value: [columnIndex, rowIndex, statusValues[cell.status]],
        })),
      ),
    [colors, rows],
  );
  const option = useMemo<EChartsOption>(
    () => ({
      animation: !shouldReduceMotion,
      animationDuration: 180,
      aria: { enabled: true, label: { description: label } },
      grid: { bottom: 8, containLabel: true, left: 0, right: 8, top: 8 },
      tooltip: {
        trigger: "item",
        backgroundColor: colors["--popover"],
        borderColor: colors["--border"],
        borderWidth: 1,
        className: "omdx-echarts-tooltip",
        confine: true,
        extraCssText: "box-shadow:0 14px 40px rgba(0,0,0,.12);padding:12px;",
        formatter: makeTooltipFormatter(),
        renderMode: "html",
        textStyle: {
          color: colors["--popover-foreground"],
          fontFamily: chartFontFamily,
          fontSize: 13,
        },
      },
      xAxis: {
        type: "category",
        data: columns,
        position: "top",
        axisLabel: {
          color: colors["--muted-foreground"],
          fontFamily: chartFontFamily,
          fontSize: 11,
          interval: 0,
          margin: 12,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitArea: { show: false },
      },
      yAxis: {
        type: "category",
        data: rows.map((row) => row.label),
        inverse: true,
        axisLabel: {
          color: colors["--foreground"],
          fontFamily: chartFontFamily,
          fontSize: 11,
          margin: 12,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitArea: { show: false },
      },
      visualMap: {
        type: "piecewise",
        dimension: 2,
        show: false,
        pieces: Object.entries(statusValues).map(([status, value]) => ({
          value,
          color: colors[statusColorTokens[status as NativeReportMatrixStatus]],
        })),
      },
      series: [
        {
          type: "heatmap",
          data: chartData,
          emphasis: {
            focus: "self",
            itemStyle: {
              borderColor: colors["--foreground"],
              borderWidth: 2,
            },
          },
          itemStyle: {
            borderColor: colors["--background"],
            borderRadius: 2,
            borderWidth: 4,
          },
          label: {
            show: true,
            color: colors["--foreground"],
            fontFamily: chartFontFamily,
            fontSize: 10,
            fontWeight: 500,
            formatter: (params: unknown) => {
              if (!params || typeof params !== "object" || !("data" in params)) {
                return "";
              }

              const datum = params.data;

              return datum && typeof datum === "object" && "status" in datum
                ? statusLabels[datum.status as NativeReportMatrixStatus]
                : "";
            },
          },
        },
      ],
    }),
    [chartData, colors, columns, label, rows, shouldReduceMotion],
  );

  return (
    <div className={styles.heatmapChartWrap}>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        notMerge
        lazyUpdate
        className={styles.heatmapCanvas}
        opts={{ renderer: "canvas" }}
        aria-label={label}
      />
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Dimensão</th>
            {columns.map((column) => <th scope="col" key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {row.cells.map((cell) => (
                <td key={`${row.label}-${cell.label}`}>{statusLabels[cell.status]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
