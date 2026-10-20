import {
  AnalyticsCard,
  analyticsLayers,
  ChartLegend,
  DotMarker,
  formatScore,
} from "@/components/omdx/analytics/analytics-primitives";
import type { AnalyticsLayerPerception } from "@/lib/data/omdx-analytics-overview";
import { cn } from "@/lib/utils";

const ticks = [1, 2, 3, 4, 5];

// Escala de 1 a 5: as camadas raramente ficam abaixo de 1, e o ganho de resolução separa os pontos.
function position(value: number) {
  return `${((Math.min(5, Math.max(1, value)) - 1) / 4) * 100}%`;
}

export function AnalyticsLayerPerceptionChart({
  rows,
  gapCutoff,
}: {
  rows: AnalyticsLayerPerception[];
  gapCutoff: number;
}) {
  const hasLayers = rows.some((row) => row.gap !== null);

  return (
    <AnalyticsCard
      className="flex-1"
      description={`Distância entre Fundador, Liderança e Time em cada dimensão. Acima de ${formatScore(gapCutoff)} ponto, a percepção diverge.`}
      title="Percepção por camada"
    >
      {!hasLayers ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          A comparação aparece quando ao menos duas camadas responderem.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <ChartLegend
            items={analyticsLayers.map((layer) => ({
              label: layer.label,
              marker: <DotMarker color={layer.color} />,
            }))}
          />

          <div className="grid grid-cols-[88px_minmax(0,1fr)_40px] gap-x-3">
            <span />
            <span />
            <span className="pb-1 text-right text-xs text-muted-foreground">Gap</span>
            {rows.map((row) => {
              const values = analyticsLayers
                .map((layer) => row.scores[layer.key])
                .filter((value): value is number => value !== null);
              const min = values.length > 0 ? Math.min(...values) : null;
              const max = values.length > 0 ? Math.max(...values) : null;
              const label = analyticsLayers
                .map((layer) => {
                  const score = row.scores[layer.key];
                  return `${layer.label}: ${score === null ? "sem base" : `${formatScore(score)}/5`}`;
                })
                .join("; ");

              return (
                <div className="contents" key={row.dimension}>
                  <span className="flex h-10 items-center truncate text-xs text-muted-foreground">
                    {row.shortDimension}
                  </span>
                  <div className="relative mx-1.5 h-10" title={`${row.dimension}: ${label}`}>
                    <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-border" />
                    {min !== null && max !== null && max > min ? (
                      <span
                        aria-hidden="true"
                        className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-muted-foreground/50"
                        style={{ left: position(min), width: `calc(${position(max)} - ${position(min)})` }}
                      />
                    ) : null}
                    {analyticsLayers.map((layer) => {
                      const score = row.scores[layer.key];
                      if (score === null) return null;

                      return (
                        <span
                          aria-hidden="true"
                          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-sidebar dark:ring-card"
                          key={layer.key}
                          style={{ backgroundColor: layer.color, left: position(score) }}
                        />
                      );
                    })}
                    <span className="sr-only">{label}</span>
                  </div>
                  <span
                    className={cn(
                      "flex h-10 items-center justify-end text-xs tabular-nums",
                      row.diverges ? "font-medium text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {row.gap === null ? "—" : formatScore(row.gap)}
                  </span>
                </div>
              );
            })}
            <span />
            <div aria-hidden="true" className="relative mx-1.5 mt-2 h-4 text-xs text-muted-foreground tabular-nums">
              {ticks.map((tick) => (
                <span className="absolute -translate-x-1/2" key={tick} style={{ left: position(tick) }}>
                  {tick}
                </span>
              ))}
            </div>
            <span />
          </div>
        </div>
      )}
    </AnalyticsCard>
  );
}
