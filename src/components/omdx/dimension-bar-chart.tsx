import { dimensions, lastDiagnosticDimensionScores, classifyScore } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/**
 * Maturidade por dimensão — barras horizontais simples, com escala 1-5.
 * Mantém o tom consultivo: sem cores excessivas, foco em legibilidade.
 */
export function DimensionBarChart() {
  const max = 5;

  return (
    <div className="flex flex-col gap-4">
      {dimensions.map((dim) => {
        const score = lastDiagnosticDimensionScores[dim.id];
        const widthPct = (score / max) * 100;
        const classification = classifyScore(score);
        const isLow = score < 3;

        return (
          <div key={dim.id} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-foreground font-medium">
                {dim.number}. {dim.shortName}
              </span>
              <span className="text-muted-foreground text-xs">
                {classification}
              </span>
            </div>
            <span className="text-foreground row-span-2 self-center text-base font-semibold tabular-nums">
              {score.toFixed(1)}
            </span>
            <div className="bg-muted relative h-2 overflow-hidden rounded-full">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full",
                  isLow ? "bg-[var(--chart-negative)]" : "bg-primary",
                )}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
      <div className="text-muted-foreground mt-2 flex justify-between text-xs">
        <span>1 — Crítico</span>
        <span>3 — Em estruturação</span>
        <span>5 — Referência</span>
      </div>
    </div>
  );
}
