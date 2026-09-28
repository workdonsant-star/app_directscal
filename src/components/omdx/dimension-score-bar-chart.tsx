"use client";

import type { DimensionResult } from "@/lib/data/omdx-overview-analytics";

type DimensionScoreBarChartProps = {
  data: DimensionResult[];
  historicalData?: DimensionResult[];
  referenceLabel?: string;
};

const dimensionOrder = [
  "Comunicação",
  "Processos",
  "Cultura",
  "Liderança",
  "Performance",
  "Visão",
] as const;
const centers = [50.5, 128.5, 206.5, 284.5, 362.5, 440.5];
const plotTop = 18;
const plotBottom = 318;
const plotHeight = plotBottom - plotTop;
const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function sortDimensions(data: DimensionResult[]) {
  return [...data].sort((first, second) => {
    const firstIndex = dimensionOrder.indexOf(
      first.shortDimension as (typeof dimensionOrder)[number],
    );
    const secondIndex = dimensionOrder.indexOf(
      second.shortDimension as (typeof dimensionOrder)[number],
    );

    return firstIndex - secondIndex;
  });
}

export function DimensionScoreBarChart({
  data,
  historicalData = [],
  referenceLabel = "Média histórica",
}: DimensionScoreBarChartProps) {
  const chartData = sortDimensions(data);
  const historicalByDimension = new Map(
    historicalData.map((dimension) => [
      dimension.dimension,
      dimension.maturity,
    ]),
  );

  if (chartData.length === 0) {
    return (
      <div className="flex h-[342px] items-center justify-center text-sm text-muted-foreground">
        Ainda não há respostas suficientes para exibir a pontuação por dimensão.
      </div>
    );
  }

  return (
    <svg
      aria-label="Pontuação por dimensão"
      className="block h-[342px] w-full overflow-visible"
      preserveAspectRatio="none"
      role="img"
      viewBox="0 0 472 342"
    >
      <title>
        Pontuação consolidada das seis dimensões, em escala de zero a cinco
      </title>

      {Array.from({ length: 6 }, (_, index) => {
        const score = 5 - index;
        const y = plotTop + index * (plotHeight / 5);

        return (
          <g key={score}>
            <line
              stroke="var(--border)"
              strokeOpacity="0.65"
              x1="15"
              x2="457"
              y1={y}
              y2={y}
            />
            <text
              dominantBaseline="middle"
              fill="var(--muted-foreground)"
              fontSize="10"
              textAnchor="start"
              x="0"
              y={y}
            >
              {score}
            </text>
          </g>
        );
      })}

      {chartData.map((dimension, index) => {
        const center = centers[index] ?? centers.at(-1) ?? 440.5;
        const score = Math.max(0, Math.min(5, dimension.maturity));
        const barHeight = (score / 5) * plotHeight;
        const y = plotBottom - barHeight;
        const historicalScore = historicalByDimension.get(dimension.dimension);

        return (
          <g key={dimension.dimension}>
            <rect
              fill="var(--overview-chart-dimensions)"
              height={barHeight}
              rx="5"
              width="33"
              x={center - 16.5}
              y={y}
            >
              <title>{`${dimension.dimension}: ${scoreFormatter.format(score)}/5${
                historicalScore === undefined
                  ? ""
                  : `; ${referenceLabel}: ${scoreFormatter.format(historicalScore)}/5`
              }`}</title>
            </rect>
            <text
              fill="var(--muted-foreground)"
              fontSize="10"
              textAnchor="middle"
              x={center}
              y={Math.max(11, y - 6)}
            >
              {scoreFormatter.format(score)}
            </text>
            <text
              fill="var(--muted-foreground)"
              fontSize="10"
              textAnchor="middle"
              x={center}
              y="335"
            >
              {dimension.shortDimension}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
