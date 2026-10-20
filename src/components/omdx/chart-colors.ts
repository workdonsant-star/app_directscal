import type { RespondentGroup } from "@/lib/types";

export const chartBarBorderRadius = 0;
export const overviewChartBarBorderRadius = 5;
export const chartHistoricalMarkerSymbol =
  "path://M0 0H6V3H0ZM11 0H17V3H11ZM22 0H28V3H22Z";

// Camadas usam a mesma rampa ordinal teal em todos os charts (SVG e ECharts).
export const layerColorTokenByGroup: Record<RespondentGroup, string> = {
  fundador: "--overview-chart-founder",
  lideranca: "--overview-chart-leadership",
  operacao: "--overview-chart-tactical",
};

export const layerLabelTokenByGroup: Record<RespondentGroup, string> = {
  fundador: "--overview-chart-founder-label",
  lideranca: "--overview-chart-leadership-label",
  operacao: "--overview-chart-tactical-label",
};

// Fallbacks do tema claro, usados só antes da leitura das variáveis CSS.
export const layerColorFallbacks: Record<string, string> = {
  "--overview-chart-founder": "#0A5F4F",
  "--overview-chart-leadership": "#347A6D",
  "--overview-chart-tactical": "#71A299",
  "--overview-chart-founder-label": "#F7F7F8",
  "--overview-chart-leadership-label": "#F7F7F8",
  "--overview-chart-tactical-label": "#151515",
};

const layerScaleByGroup: Record<RespondentGroup, Record<number, string>> = {
  fundador: {
    30: "var(--omdx-layer-diretoria-30)",
    40: "var(--omdx-layer-diretoria-40)",
    50: "var(--omdx-layer-diretoria-50)",
    60: "var(--omdx-layer-diretoria-60)",
    70: "var(--omdx-layer-diretoria-70)",
    80: "var(--omdx-layer-diretoria-80)",
    90: "var(--omdx-layer-diretoria-90)",
  },
  lideranca: {
    30: "var(--omdx-layer-lideranca-30)",
    40: "var(--omdx-layer-lideranca-40)",
    50: "var(--omdx-layer-lideranca-50)",
    60: "var(--omdx-layer-lideranca-60)",
    70: "var(--omdx-layer-lideranca-70)",
    80: "var(--omdx-layer-lideranca-80)",
    90: "var(--omdx-layer-lideranca-90)",
  },
  operacao: {
    30: "var(--omdx-layer-time-30)",
    40: "var(--omdx-layer-time-40)",
    50: "var(--omdx-layer-time-50)",
    60: "var(--omdx-layer-time-60)",
    70: "var(--omdx-layer-time-70)",
    80: "var(--omdx-layer-time-80)",
    90: "var(--omdx-layer-time-90)",
  },
};

export function getLayerColor(group: RespondentGroup) {
  return `var(${layerColorTokenByGroup[group]})`;
}

export function getLayerScoreColor(group: RespondentGroup, score: number) {
  const weight = score >= 4.5
    ? 30
    : score >= 4
      ? 40
      : score >= 3.5
        ? 50
        : score >= 3
          ? 60
          : score >= 2.5
            ? 70
            : score >= 2
              ? 80
              : 90;

  return layerScaleByGroup[group][weight];
}

export function getNeutralScoreColor() {
  return "var(--overview-chart-dimensions)";
}
