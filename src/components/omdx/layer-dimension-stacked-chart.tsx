"use client";

import type { DimensionResult } from "@/lib/data/omdx-overview-analytics";

type LayerKey = "diretoria" | "lideranca" | "time";

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
const chartMax = 15;
const layers: Array<{
  color: string;
  key: LayerKey;
  label: string;
}> = [
  {
    color: "var(--overview-chart-leadership)",
    key: "lideranca",
    label: "Liderança",
  },
  {
    color: "var(--overview-chart-tactical)",
    key: "time",
    label: "Tático",
  },
  {
    color: "var(--overview-chart-founder)",
    key: "diretoria",
    label: "Fundador",
  },
];
const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function sortDimensions(data: DimensionResult[]) {
  return [...data]
    .filter((dimension) =>
      layers.some((layer) => dimension[layer.key] !== null),
    )
    .sort((first, second) => {
      const firstIndex = dimensionOrder.indexOf(
        first.shortDimension as (typeof dimensionOrder)[number],
      );
      const secondIndex = dimensionOrder.indexOf(
        second.shortDimension as (typeof dimensionOrder)[number],
      );

      return firstIndex - secondIndex;
    });
}

export function LayerDimensionStackedChart({
  data,
  historicalData = [],
  referenceLabel = "Média histórica",
}: {
  data: DimensionResult[];
  historicalData?: DimensionResult[];
  referenceLabel?: string;
}) {
  const chartData = sortDimensions(data);
  const historicalByDimension = new Map(
    historicalData.map((dimension) => [dimension.dimension, dimension]),
  );

  if (chartData.length === 0) {
    return (
      <div className="flex h-[342px] items-center justify-center text-sm text-muted-foreground">
        Ainda não há base por camada para exibir.
      </div>
    );
  }

  return (
    <svg
      aria-label="Pontuação das dimensões por camada"
      className="block h-[342px] w-full overflow-visible"
      preserveAspectRatio="none"
      role="img"
      viewBox="0 0 472 342"
    >
      <title>
        Composição das pontuações de Fundador, Liderança e Tático por dimensão
      </title>

      {Array.from({ length: 6 }, (_, index) => {
        const score = chartMax - index * 3;
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
              x="0"
              y={y}
            >
              {score}
            </text>
          </g>
        );
      })}

      {chartData.map((dimension, dimensionIndex) => {
        const center = centers[dimensionIndex] ?? centers.at(-1) ?? 440.5;
        const historicalDimension = historicalByDimension.get(
          dimension.dimension,
        );
        let cumulative = 0;

        return (
          <g key={dimension.dimension}>
            {layers.map((layer) => {
              const value = dimension[layer.key];

              if (value === null) return null;

              const height = (value / chartMax) * plotHeight;
              cumulative += value;
              const y = plotBottom - (cumulative / chartMax) * plotHeight;
              const historicalValue = historicalDimension?.[layer.key];

              return (
                <g key={layer.key}>
                  <rect
                    fill={layer.color}
                    height={height}
                    rx="5"
                    width="33"
                    x={center - 16.5}
                    y={y}
                  >
                    <title>{`${dimension.dimension} · ${layer.label}: ${scoreFormatter.format(value)}/5${
                      historicalValue === null || historicalValue === undefined
                        ? ""
                        : `; ${referenceLabel}: ${scoreFormatter.format(historicalValue)}/5`
                    }`}</title>
                  </rect>
                  {height >= 18 ? (
                    <text
                      dominantBaseline="middle"
                      fill="var(--overview-chart-label)"
                      fontSize="10"
                      textAnchor="middle"
                      x={center}
                      y={y + height / 2}
                    >
                      {scoreFormatter.format(value)}
                    </text>
                  ) : null}
                </g>
              );
            })}
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
