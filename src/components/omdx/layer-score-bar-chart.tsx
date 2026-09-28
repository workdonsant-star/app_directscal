"use client";

import type { LayerScoreResult } from "@/lib/data/omdx-overview-analytics";

type LayerScoreBarChartProps = {
  data: LayerScoreResult[];
  historicalData?: LayerScoreResult[];
  referenceLabel?: string;
};

const displayLabelByLayer: Record<LayerScoreResult["id"], string> = {
  fundador: "Fundador",
  lideranca: "Liderança",
  operacao: "Tático",
};
const colorByLayer: Record<LayerScoreResult["id"], string> = {
  fundador: "var(--overview-chart-founder)",
  lideranca: "var(--overview-chart-leadership)",
  operacao: "var(--overview-chart-tactical)",
};
const rowCenters = [36.5, 166.5, 297.5];
const plotLeft = 72;
const plotRight = 460;
const plotWidth = plotRight - plotLeft;
const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function LayerScoreBarChart({
  data,
  historicalData = [],
  referenceLabel = "Média histórica",
}: LayerScoreBarChartProps) {
  const historicalByLayer = new Map(
    historicalData.map((layer) => [layer.id, layer.score]),
  );
  const availableScores = data.filter((layer) => layer.score !== null);

  if (availableScores.length === 0) {
    return (
      <div className="flex h-[342px] items-center justify-center text-sm text-muted-foreground">
        Ainda não há respostas suficientes para exibir a pontuação por camada.
      </div>
    );
  }

  return (
    <svg
      aria-label="Pontuação por camada"
      className="block h-[342px] w-full overflow-visible"
      preserveAspectRatio="none"
      role="img"
      viewBox="0 0 472 342"
    >
      <title>
        Pontuação de Fundador, Liderança e Tático, em escala de zero a cinco
      </title>

      {Array.from({ length: 6 }, (_, score) => {
        const x = plotLeft + (score / 5) * plotWidth;

        return (
          <g key={score}>
            <line
              stroke="var(--border)"
              strokeOpacity="0.65"
              x1={x}
              x2={x}
              y1="18"
              y2="314"
            />
            <text
              fill="var(--muted-foreground)"
              fontSize="10"
              textAnchor="middle"
              x={x}
              y="335"
            >
              {score}
            </text>
          </g>
        );
      })}

      {data.map((layer, index) => {
        const centerY = rowCenters[index] ?? rowCenters.at(-1) ?? 297.5;
        const score = layer.score;
        const historicalScore = historicalByLayer.get(layer.id);

        return (
          <g key={layer.id}>
            <text
              dominantBaseline="middle"
              fill="var(--muted-foreground)"
              fontSize="10"
              x="0"
              y={centerY}
            >
              {displayLabelByLayer[layer.id]}
            </text>
            {score === null ? (
              <text
                dominantBaseline="middle"
                fill="var(--muted-foreground)"
                fontSize="10"
                x={plotLeft}
                y={centerY}
              >
                Sem base
              </text>
            ) : (
              <>
                <rect
                  fill={colorByLayer[layer.id]}
                  height="33"
                  rx="5"
                  width={(Math.max(0, Math.min(5, score)) / 5) * plotWidth}
                  x={plotLeft}
                  y={centerY - 16.5}
                >
                  <title>{`${displayLabelByLayer[layer.id]}: ${scoreFormatter.format(score)}/5${
                    historicalScore === null || historicalScore === undefined
                      ? ""
                      : `; ${referenceLabel}: ${scoreFormatter.format(historicalScore)}/5`
                  }`}</title>
                </rect>
                <text
                  dominantBaseline="middle"
                  fill="var(--muted-foreground)"
                  fontSize="10"
                  x={plotLeft + (score / 5) * plotWidth + 6}
                  y={centerY}
                >
                  {scoreFormatter.format(score)}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
