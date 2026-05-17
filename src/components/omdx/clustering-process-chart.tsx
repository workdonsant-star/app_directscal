"use client";

import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

import {
  calculateDimensionCriticality,
  calculateDimensionGap,
  normalizeLikertToIndex,
  type DimensionResult,
} from "@/lib/data/omdx-overview-analytics";
import { useChartThemeColors } from "@/components/omdx/use-chart-theme-colors";

type ClusterPoint = {
  clusterIndex: number;
  criticalityIndex: number;
  dimension: string;
  gap: number | null;
  maturityIndex: number;
  value: [number, number];
};

type ClusterGroup = {
  centroid: [number, number];
  color: string;
  name: string;
  points: ClusterPoint[];
};

type TooltipParam = {
  data?: ClusterPoint;
  seriesName?: string;
};

type ClusteringProcessChartProps = {
  data?: DimensionResult[];
};

const fallbackColors: Record<string, string> = {
  "--background": "#FFFFFF",
  "--border": "#E2E2E5",
  "--foreground": "#111114",
  "--muted-foreground": "#4A4A52",
  "--popover": "#FFFFFF",
  "--popover-foreground": "#111114",
  "--omdx-layer-diretoria-60": "#0F62FE",
  "--omdx-layer-lideranca-50": "#1192E8",
  "--omdx-layer-time-50": "#009D9A",
};

const chartFontFamily = "var(--font-inter)";
const chartAxisFontSize = 14;
const chartUiFontSize = 14;
const clusterCount = 3;
const clusterNames = ["Estruturar", "Monitorar", "Preservar"];
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

function getShortDimensionName(name: string) {
  if (name.includes("Cultura")) return "Cultura";
  if (name.includes("Visão")) return "Visão";
  if (name.includes("Comunicação")) return "Comunicação";
  if (name.includes("Processos")) return "Processos";
  if (name.includes("Liderança")) return "Liderança";
  if (name.includes("Performance")) return "Performance";

  return name.split(" ")[0] ?? name;
}

function getDistance(point: [number, number], centroid: [number, number]) {
  return Math.hypot(point[0] - centroid[0], point[1] - centroid[1]);
}

function getMeanPoint(points: ClusterPoint[]): [number, number] {
  if (points.length === 0) return [50, 50];

  return [
    points.reduce((total, point) => total + point.maturityIndex, 0) /
      points.length,
    points.reduce((total, point) => total + point.criticalityIndex, 0) /
      points.length,
  ];
}

function buildBasePoints(data: DimensionResult[]): ClusterPoint[] {
  return data.map((dimension) => {
    const maturityIndex = normalizeLikertToIndex(dimension.maturity);
    const criticalityIndex = calculateDimensionCriticality(dimension);

    return {
      clusterIndex: 0,
      criticalityIndex,
      dimension: dimension.dimension,
      gap: calculateDimensionGap(dimension),
      maturityIndex,
      value: [maturityIndex, criticalityIndex],
    };
  });
}

function runKMeans(points: ClusterPoint[]) {
  if (points.length === 0) return [];

  let centroids = [...points]
    .sort((a, b) => a.maturityIndex - b.maturityIndex)
    .filter((_, index, list) =>
      list.length <= clusterCount
        ? true
        : index === 0 ||
          index === Math.floor((list.length - 1) / 2) ||
          index === list.length - 1,
    )
    .slice(0, clusterCount)
    .map((point) => point.value);

  while (centroids.length < clusterCount) {
    centroids.push(centroids.at(-1) ?? [50, 50]);
  }

  let assigned = points;

  for (let iteration = 0; iteration < 8; iteration += 1) {
    assigned = points.map((point) => {
      const clusterIndex = centroids.reduce(
        (bestIndex, centroid, index) =>
          getDistance(point.value, centroid) <
          getDistance(point.value, centroids[bestIndex])
            ? index
            : bestIndex,
        0,
      );

      return { ...point, clusterIndex };
    });

    centroids = centroids.map((centroid, index) => {
      const clusterPoints = assigned.filter(
        (point) => point.clusterIndex === index,
      );

      return clusterPoints.length > 0 ? getMeanPoint(clusterPoints) : centroid;
    });
  }

  return assigned;
}

function buildClusters(
  data: DimensionResult[],
  colors: Record<string, string>,
): ClusterGroup[] {
  const assigned = runKMeans(buildBasePoints(data));
  const palette = [
    colors["--omdx-layer-diretoria-60"],
    colors["--omdx-layer-lideranca-50"],
    colors["--omdx-layer-time-50"],
  ];

  return Array.from({ length: clusterCount }, (_, index) => {
    const points = assigned.filter((point) => point.clusterIndex === index);
    const centroid = getMeanPoint(points);

    return {
      centroid,
      color: palette[index],
      name: "",
      points,
    };
  })
    .filter((cluster) => cluster.points.length > 0)
    .sort((a, b) => a.centroid[0] - b.centroid[0])
    .map((cluster, index, list) => {
      const nameIndex =
        list.length === 1
          ? 1
          : Math.round((index / (list.length - 1)) * (clusterNames.length - 1));

      return {
        ...cluster,
        name: clusterNames[nameIndex],
      };
    });
}

function makeTooltipFormatter() {
  return (params: unknown) => {
    const param = Array.isArray(params) ? params[0] : params;
    const item =
      param && typeof param === "object" && "data" in param
        ? (param as TooltipParam).data
        : undefined;
    const seriesName =
      param && typeof param === "object" && "seriesName" in param
        ? (param as TooltipParam).seriesName
        : undefined;

    if (!item) return "";

    return `
      <div style="min-width:280px;">
        <div style="margin-bottom:10px;font-weight:600;color:var(--foreground);">${escapeHtml(item.dimension)}</div>
        <div style="display:grid;gap:6px;">
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Grupo</span>
            <span style="font-weight:500;color:var(--foreground);">${escapeHtml(seriesName ?? "")}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Maturidade</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${indexFormatter.format(item.maturityIndex)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Criticidade</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${indexFormatter.format(item.criticalityIndex)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;gap:24px;">
            <span style="color:var(--muted-foreground);">Gap entre camadas</span>
            <span style="font-variant-numeric:tabular-nums;color:var(--foreground);">${formatScoreOrNoBase(item.gap)}</span>
          </div>
        </div>
      </div>
    `;
  };
}

function makePointLabelFormatter() {
  return (params: unknown) => {
    const item =
      params && typeof params === "object" && "data" in params
        ? (params as TooltipParam).data
        : undefined;

    return item ? getShortDimensionName(item.dimension) : "";
  };
}

export function ClusteringProcessChart({
  data = [],
}: ClusteringProcessChartProps) {
  const colors = useChartThemeColors(fallbackColors);
  const clusters = useMemo(() => buildClusters(data, colors), [colors, data]);

  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 500,
      aria: {
        enabled: true,
        label: {
          description:
            "Agrupamento operacional de maturidade e criticidade, organizando dimensões do OMDx por proximidade.",
        },
      },
      grid: {
        top: 30,
        right: 28,
        bottom: 44,
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
      series: clusters.map((cluster) => ({
        name: cluster.name,
        type: "scatter",
        symbolSize: 34,
        data: cluster.points,
        itemStyle: {
          color: cluster.color,
          borderColor: colors["--background"],
          borderWidth: 1.5,
        },
        label: {
          show: true,
          formatter: makePointLabelFormatter(),
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
      })),
    }),
    [clusters, colors],
  );

  if (clusters.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Ainda não há dados consolidados para agrupar maturidade e criticidade.
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
      aria-label="Clustering process"
    />
  );
}
