import {
  AnalyticsCard,
  ChartLegend,
  DotMarker,
  formatDelta,
  formatScore,
  SwatchMarker,
} from "@/components/omdx/analytics/analytics-primitives";
import type { AnalyticsDimensionGap } from "@/lib/data/omdx-analytics-overview";

const ticks = [0, 1, 2, 3, 4, 5];

function position(value: number) {
  return `${(Math.min(5, Math.max(0, value)) / 5) * 100}%`;
}

export function AnalyticsDimensionGapChart({
  dimensions,
  target,
  referenceLabel,
}: {
  dimensions: AnalyticsDimensionGap[];
  target: number | null;
  referenceLabel: string | null;
}) {
  const hasHistory = dimensions.some((item) => item.previous !== null);
  const hasProgress = dimensions.some(item => item.progress !== null && item.progress !== 0);

  return (
    <AnalyticsCard
      className="flex-1"
      description="Percepções por dimensão, da menor para a maior nota. As respostas usam a escala de 1 a 5; a barra começa em zero para comparação visual."
      title="Dimensões gerenciais"
    >
      {dimensions.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Ainda não há respostas suficientes para comparar as dimensões.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <ChartLegend
            items={[
              { label: "Nota da pesquisa", marker: <SwatchMarker color="var(--overview-chart-dimensions)" /> },
              ...(hasProgress ? [{ label: "Progresso ilustrativo", marker: <DotMarker color="var(--overview-chart-progress)" hollow /> }] : []),
              ...(hasHistory
                ? [{ label: referenceLabel ?? "Média anterior", marker: <span aria-hidden="true" className="h-3 border-l-2 border-dotted border-muted-foreground" /> }]
                : []),
              ...(target !== null ? [{ label: `Referência ilustrativa ${formatScore(target)}`, marker: <span aria-hidden="true" className="h-3 border-l border-dashed border-muted-foreground" /> }] : []),
            ]}
          />

          <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-3">
            <ul className="flex flex-col gap-3">
              {dimensions.map((item) => (
                <li className="flex h-7 items-center truncate text-xs text-muted-foreground" key={item.dimension}>
                  {item.shortDimension}
                </li>
              ))}
            </ul>

            {/* A margem direita reserva espaço para o valor e o progresso após a barra. */}
            <div className="relative mr-24">
              {target !== null ? <span
                aria-hidden="true"
                className="absolute inset-y-0 border-l border-dashed border-muted-foreground"
                style={{ left: position(target) }}
              /> : null}
              <ul className="relative flex flex-col gap-3">
                {dimensions.map((item) => {
                  const progress = item.treated && item.progress ? item.progress : null;
                  const reached = progress === null ? null : Math.min(5, Math.max(1, item.score + progress));

                  return (
                    <li
                      className="relative h-7"
                      key={item.dimension}
                      title={`${item.dimension}: ${formatScore(item.score)}/5${
                        item.previous === null ? "" : `; ${referenceLabel ?? "média anterior"}: ${formatScore(item.previous)}/5`
                      }${progress === null ? "" : `; progresso pelas ações: ${formatDelta(progress)}`}`}
                    >
                      <span
                        className="absolute inset-y-1 left-0 rounded-[5px]"
                        style={{ backgroundColor: "var(--overview-chart-dimensions)", width: position(item.score) }}
                      />
                      {item.previous !== null ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-0 border-l-2 border-dotted border-muted-foreground"
                          style={{ left: position(item.previous) }}
                        />
                      ) : null}
                      {reached !== null && reached > item.score ? (
                        <>
                          <span
                            aria-hidden="true"
                            className="absolute top-1/2 border-t border-dashed"
                            style={{
                              borderColor: "var(--overview-chart-progress)",
                              left: position(item.score),
                              width: `calc(${position(reached)} - ${position(item.score)})`,
                            }}
                          />
                          <span
                            aria-hidden="true"
                            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-sidebar dark:bg-card"
                            style={{ borderColor: "var(--overview-chart-progress)", left: position(reached) }}
                          />
                        </>
                      ) : null}
                      <span
                        className="absolute top-1/2 -translate-y-1/2 pl-2 text-xs whitespace-nowrap text-foreground tabular-nums"
                        style={{ left: position(Math.max(item.score, reached ?? 0)) }}
                      >
                        {formatScore(item.score)}
                        {progress !== null ? (
                          <span className="font-medium" style={{ color: progress > 0 ? "var(--overview-chart-progress)" : undefined }}>
                            {" "}
                            {formatDelta(progress)}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div aria-hidden="true" className="relative mt-2 h-4 text-xs text-muted-foreground tabular-nums">
                {ticks.map((tick) => (
                  <span
                    className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
                    key={tick}
                    style={{ left: position(tick) }}
                  >
                    {tick}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AnalyticsCard>
  );
}
