"use client";

import type { LeverageMatrixRow } from "@/lib/data/omdx-overview-analytics";

const dimensionOrder = [
  "Comunicação",
  "Processos",
  "Cultura",
  "Liderança",
  "Performance",
  "Visão",
] as const;
const cellX = [76, 175, 273, 377];
const rowY = [45, 97, 149, 201, 253, 305];
const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function getColor(value: number, min: number, max: number) {
  const ratio = max === min ? 0.5 : (value - min) / (max - min);

  if (ratio <= 0.25) return "var(--overview-matrix-leverage-low)";
  if (ratio <= 0.5) return "var(--overview-matrix-leverage-soft)";
  if (ratio <= 0.75) return "var(--overview-matrix-leverage-mid)";
  return "var(--overview-matrix-leverage-high)";
}

export function LeverageMatrix({
  rows,
  height = 342,
}: {
  rows: LeverageMatrixRow[];
  height?: number;
}) {
  const chartRows = [...rows].sort((first, second) => {
    const firstIndex = dimensionOrder.indexOf(
      first.dimension as (typeof dimensionOrder)[number],
    );
    const secondIndex = dimensionOrder.indexOf(
      second.dimension as (typeof dimensionOrder)[number],
    );

    return firstIndex - secondIndex;
  });
  const values = chartRows.flatMap((row) =>
    row.cells.flatMap((cell) => (cell.value === null ? [] : [cell.value])),
  );
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 1;
  const labels = chartRows[0]?.cells.slice(0, 4).map((cell) => cell.label) ?? [];

  if (chartRows.length === 0 || values.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}>
        Ainda não há dimensões consolidadas para priorizar.
      </div>
    );
  }

  return (
    <svg
      aria-label="Matriz de alavancas por dimensão"
      className="block w-full overflow-visible"
      style={{ height }}
      preserveAspectRatio="none"
      role="img"
      viewBox="0 0 472 342"
    >
      <title>
        Alavancas prioritárias por maturidade, alinhamento, consenso e prioridade
      </title>

      {labels.map((label, index) => (
        <text
          fill="var(--muted-foreground)"
          fontSize="10"
          key={label}
          textAnchor="middle"
          x={(cellX[index] ?? 76) + 40}
          y="37"
        >
          {label}
        </text>
      ))}

      {chartRows.slice(0, 6).map((row, rowIndex) => {
        const y = rowY[rowIndex] ?? rowY.at(-1) ?? 305;

        return (
          <g key={row.dimension}>
            <text
              dominantBaseline="middle"
              fill="var(--muted-foreground)"
              fontSize="10"
              x="0"
              y={y + 16.5}
            >
              {row.dimension}
            </text>

            {row.cells.slice(0, 4).map((cell, cellIndex) => {
              const x = cellX[cellIndex] ?? 76;
              const formattedValue =
                cell.value === null
                  ? "—"
                  : scoreFormatter.format(cell.value / 20);

              return (
                <g key={cell.label}>
                  <rect
                    fill={
                      cell.value === null
                        ? "var(--muted)"
                        : getColor(cell.value, min, max)
                    }
                    height="33"
                    rx="5"
                    width="80"
                    x={x}
                    y={y}
                  >
                    <title>{`${row.dimension} · ${cell.label}: ${cell.level} · ${formattedValue}/5`}</title>
                  </rect>
                  <text
                    dominantBaseline="middle"
                    fill="var(--overview-matrix-leverage-text)"
                    fontSize="10"
                    textAnchor="middle"
                    x={x + 40}
                    y={y + 16.5}
                  >
                    {cell.level} - {formattedValue}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
