import { classifyScore } from "@/lib/data/omdx-data-source";
import type { DimensionInsightTrendPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

type DimensionScoreTrendProps = {
  points: DimensionInsightTrendPoint[];
};

export function DimensionScoreTrend({ points }: DimensionScoreTrendProps) {
  if (points.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        Nenhum diagnóstico com dados para esta dimensão.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {points.map((point) => {
        const widthPct = (point.score / 5) * 100;
        const isLow = point.score < 3;

        return (
          <div
            key={point.diagnosticId}
            className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1"
          >
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {point.diagnosticName}
              </span>
              <span className="text-xs text-muted-foreground">
                {point.company} / {point.responses} respostas
              </span>
            </div>
            <span className="row-span-2 self-center text-base font-semibold tabular-nums text-foreground">
              {point.score.toFixed(1)}
            </span>
            <div className="relative h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full",
                  isLow ? "bg-[var(--chart-negative)]" : "bg-primary",
                )}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {classifyScore(point.score)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
