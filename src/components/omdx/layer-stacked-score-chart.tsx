"use client";

import type { EChartsOption } from "echarts";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { useMemo } from "react";

import { echarts } from "@/components/omdx/echarts-core";
import { useChartThemeColors } from "@/components/omdx/use-chart-theme-colors";
import type { DimensionResult } from "@/lib/data/omdx-overview-analytics";

type LayerKey = "diretoria" | "lideranca" | "time";

type LayerDefinition = {
  colorToken: string;
  key: LayerKey;
  labelColorToken: string;
  name: string;
};

type ChartDimension = {
  dimension: string;
  diretoria: number | null;
  lideranca: number | null;
  shortName: string;
  time: number | null;
  total: number;
};

type TooltipParam = {
  dataIndex?: number;
  marker?: string;
  seriesName?: string;
};

type FormatterParam = {
  value?: unknown;
};

type LayerStackedScoreChartProps = {
  data: DimensionResult[];
};

const fallbackColors: Record<string, string> = {
  "--background": "#FFFFFF",
  "--border": "#E2E2E5",
  "--foreground": "#111114",
  "--muted-foreground": "#4A4A52",
  "--popover": "#FFFFFF",
  "--popover-foreground": "#111114",
  "--primary-foreground": "#FFFFFF",
  "--omdx-layer-diretoria-70": "#0043CE",
  "--omdx-layer-lideranca-60": "#0072C3",
  "--omdx-layer-time-50": "#009D9A",
};

const chartFontFamily = "var(--font-inter)";
const chartAxisFontSize = 12;
const chartUiFontSize = 13;
const chartHeight = 460;
const layerDefinitions: LayerDefinition[] = [
  {
    key: "diretoria",
    name: "Fundador",
    colorToken: "--omdx-layer-diretoria-70",
    labelColorToken: "--primary-foreground",
  },
  {
    key: "lideranca",
    name: "Liderança",
    colorToken: "--omdx-layer-lideranca-60",
    labelColorToken: "--primary-foreground",
  },
  {
    key: "time",
    name: "Operação",
    colorToken: "--omdx-layer-time-50",
    labelColorToken: "--foreground",
  },
];
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getShortDimensionName(name: string) {
  if (shortDimensionNameByFullName[name]) {
    return shortDimensionNameByFullName[name];
  }
  if (name.includes("Cultura")) return "Cultura";
  if (name.includes("Visão")) return "Visão";
  if (name.includes("Comunicação")) return "Comunicação";
  if (name.includes("Processos")) return "Processos";
  if (name.includes("Liderança")) return "Liderança";
  if (name.includes("Performance")) return "Performance";

  return name;
}

function getNumericValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatScore(value: number) {
  return scoreFormatter.format(value);
}

function formatScoreOrNoBase(value: number | null) {
  return value === null ? "Sem base" : formatScore(value);
}

function buildChartData(data: DimensionResult[]): ChartDimension[] {
  return data
    .map((dimension) => {
      const layers = {
        diretoria: dimension.diretoria,
        lideranca: dimension.lideranca,
        time: dimension.time,
      };
      const total = Object.values(layers).reduce<number>(
        (sum, score) => sum + (score ?? 0),
        0,
      );

      return {
        ...layers,
        dimension: dimension.dimension,
        shortName: getShortDimensionName(dimension.dimension),
        total,
      };
    })
    .filter((dimension) =>
      layerDefinitions.some((layer) => dimension[layer.key] !== null),
    );
}

function getYAxisMax(data: ChartDimension[]) {
  const maxTotal = Math.max(...data.map((dimension) => dimension.total), 5);

  return Math.ceil(maxTotal / 2) * 2;
}

function makeSegmentLabelFormatter() {
  return (params: FormatterParam) => {
    const value = getNumericValue(params.value);

    return value === null ? "" : formatScore(value);
  };
}

function makeTotalLabelFormatter() {
  return (params: FormatterParam) => {
    const value = getNumericValue(params.value);

    return value === null || value <= 0 ? "" : formatScore(value);
  };
}

function makeTooltipFormatter(data: ChartDimension[]) {
  return (params: unknown) => {
    const items = Array.isArray(params) ? (params as TooltipParam[]) : [];
    const firstItem = items[0];

    if (!firstItem || typeof firstItem.dataIndex !== "number") return "";

    const dimension = data[firstItem.dataIndex];

    if (!dimension) return "";

    const layerRows = layerDefinitions
      .map((layer) => {
        const value = dimension[layer.key];
        const item = items.find((param) => param.seriesName === layer.name);
        const marker = item?.marker ?? "";

        return `
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">${marker}${escapeHtml(layer.name)}</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${formatScoreOrNoBase(value)}</span>
          </div>
        `;
      })
      .join("");

    return `
      <div style="min-width:260px;">
        <div style="margin-bottom:10px;font-weight:600;color:var(--foreground);">${escapeHtml(dimension.dimension)}</div>
        <div style="display:grid;gap:6px;">
          ${layerRows}
          <div style="display:flex;justify-content:space-between;gap:24px;border-top:1px solid var(--border);margin-top:4px;padding-top:8px;">
            <span style="color:var(--muted-foreground);">Total acumulado</span>
            <span style="font-variant-numeric:tabular-nums;font-weight:600;color:var(--foreground);">${formatScore(dimension.total)}</span>
          </div>
        </div>
      </div>
    `;
  };
}

export function LayerStackedScoreChart({ data }: LayerStackedScoreChartProps) {
  const colors = useChartThemeColors(fallbackColors);
  const chartData = useMemo(() => buildChartData(data), [data]);
  const yAxisMax = useMemo(() => getYAxisMax(chartData), [chartData]);

  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 500,
      aria: {
        enabled: true,
        label: {
          description:
            "Barras empilhadas com as médias de Fundador, Liderança e Operação por dimensão de Maturidade.",
        },
      },
      grid: {
        top: 54,
        right: 20,
        bottom: 88,
        left: 44,
        containLabel: true,
      },
      legend: {
        top: 0,
        left: "center",
        icon: "circle",
        itemGap: 20,
        itemHeight: 8,
        itemWidth: 8,
        data: layerDefinitions.map((layer) => layer.name),
        textStyle: {
          color: colors["--foreground"],
          fontFamily: chartFontFamily,
          fontSize: chartAxisFontSize,
        },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
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
        type: "category",
        data: chartData.map((dimension) => dimension.shortName),
        axisLabel: {
          color: colors["--foreground"],
          fontFamily: chartFontFamily,
          fontSize: chartAxisFontSize,
          fontWeight: 500,
          interval: 0,
          margin: 16,
          rotate: 45,
        },
        axisLine: { show: false },
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
          fontSize: chartAxisFontSize,
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: {
            color: colors["--border"],
            opacity: 0.5,
          },
        },
      },
      series: [
        ...layerDefinitions.map((layer) => ({
          name: layer.name,
          type: "bar" as const,
          stack: "score",
          barWidth: 34,
          data: chartData.map((dimension) => dimension[layer.key]),
          itemStyle: {
            color: colors[layer.colorToken],
            borderColor: colors["--background"],
            borderWidth: 1,
          },
          label: {
            show: true,
            position: "inside" as const,
            color: colors[layer.labelColorToken],
            fontFamily: chartFontFamily,
            fontSize: chartAxisFontSize,
            fontWeight: 600,
            formatter: makeSegmentLabelFormatter(),
          },
          emphasis: {
            focus: "series" as const,
          },
        })),
        {
          name: "Total",
          type: "bar" as const,
          barGap: "-100%",
          barWidth: 34,
          data: chartData.map((dimension) => dimension.total),
          silent: true,
          itemStyle: {
            color: "transparent",
            borderColor: "transparent",
          },
          label: {
            show: true,
            position: "top" as const,
            color: colors["--foreground"],
            distance: 8,
            fontFamily: chartFontFamily,
            fontSize: chartAxisFontSize,
            fontWeight: 600,
            formatter: makeTotalLabelFormatter(),
          },
          tooltip: {
            show: false,
          },
        },
      ],
    }),
    [chartData, colors, yAxisMax],
  );

  if (data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Ainda não há dimensões consolidadas para comparar por camada.
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
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
      style={{ height: chartHeight, width: "100%" }}
      opts={{ renderer: "canvas" }}
      aria-label="Composição por camada"
    />
  );
}
