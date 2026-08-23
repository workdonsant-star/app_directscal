import type {
  LeverageLevel,
  LeverageMatrixRow,
} from "@/lib/data/omdx-overview-analytics";
import { cn } from "@/lib/utils";

const levelStyles: Record<LeverageLevel | "Sem dados", string> = {
  Baixa: "bg-muted text-foreground",
  Média: "bg-[var(--omdx-chart-lime-soft)] text-[#07141c]",
  Alta: "bg-[var(--omdx-chart-lime)] text-[#07141c]",
  Crítica: "bg-[var(--omdx-chart-purple)] text-white",
  "Sem dados": "bg-muted text-muted-foreground",
};

export function LeverageMatrix({ rows }: { rows: LeverageMatrixRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex h-[316px] items-center justify-center text-sm text-muted-foreground">
        Ainda não há dimensões consolidadas para priorizar.
      </div>
    );
  }

  const labels = rows[0]?.cells.map((cell) => cell.label) ?? [];

  return (
    <div className="overflow-x-auto pb-1">
      <div
        className="grid min-w-[680px] gap-1.5"
        style={{
          gridTemplateColumns: `8rem repeat(${labels.length}, minmax(6.25rem, 1fr))`,
        }}
        role="table"
        aria-label="Matriz de alavancas por dimensão"
      >
        <div aria-hidden="true" />
        {labels.map((label) => (
          <div
            className="pb-1 text-center text-[10px] text-muted-foreground"
            key={label}
            role="columnheader"
          >
            {label}
          </div>
        ))}

        {rows.flatMap((row) => [
          <div
            className="flex min-h-[4.5rem] items-center text-[10px] font-medium text-muted-foreground"
            key={`${row.dimension}-label`}
            role="rowheader"
          >
            {row.dimension}
          </div>,
          ...row.cells.map((cell) => (
            <div
              aria-label={`${row.dimension}, ${cell.label}: ${cell.level}${cell.value === null ? "" : `, índice ${cell.value} de 100`}`}
              className={cn(
                "flex min-h-[4.5rem] flex-col items-center justify-center gap-1 px-2 text-center",
                levelStyles[cell.level],
              )}
              key={`${row.dimension}-${cell.label}`}
              role="cell"
              title={
                cell.value === null
                  ? `${cell.label}: sem dados`
                  : `${cell.label}: ${cell.level} (${cell.value}/100)`
              }
            >
              <span className="text-[10px] font-medium">{cell.level}</span>
              {cell.value !== null ? (
                <span className="text-[9px] opacity-70 tabular-nums">
                  {cell.value}/100
                </span>
              ) : null}
            </div>
          )),
        ])}
      </div>
    </div>
  );
}
