import {
  AnalyticsCard,
  ChartLegend,
  DotMarker,
  formatScore,
  IllustrativeTag,
  SwatchMarker,
} from "@/components/omdx/analytics/analytics-primitives";
import type { ImpactMilestone, ImpactTrendPoint } from "@/lib/data/omdx-impact-example";

const treatedColor = "var(--overview-chart-estimate)";
const untreatedColor = "var(--muted-foreground)";

export function AnalyticsImpactTrendChart({
  trend,
  milestones,
  target,
}: {
  trend: ImpactTrendPoint[];
  milestones: ImpactMilestone[];
  target: number;
}) {
  if (trend.length < 2) {
    return (
      <AnalyticsCard title="Evolução das perguntas tratadas" aside={<IllustrativeTag />}>
        <p className="py-16 text-center text-sm text-muted-foreground">
          A evolução aparece quando houver alavancas com estimativa.
        </p>
      </AnalyticsCard>
    );
  }

  const values = trend.flatMap((point) => [point.treatedLow, point.treatedHigh, point.untreated]);
  const yMin = Math.max(0, Math.floor((Math.min(...values) - 0.1) * 2) / 2);
  const yMax = Math.min(5, Math.ceil((Math.max(...values, target) + 0.1) * 2) / 2);
  const yTicks = Array.from({ length: Math.round((yMax - yMin) / 0.5) + 1 }, (_, index) => yMin + index * 0.5);
  const last = trend.length - 1;
  const x = (index: number) => (index / last) * 100;
  const y = (value: number) => ((yMax - value) / (yMax - yMin)) * 100;
  const line = (key: "treated" | "untreated") =>
    trend.map((point, index) => `${x(index)},${y(point[key])}`).join(" ");
  const band = [
    ...trend.slice(1).map((point, index) => `${x(index + 1)},${y(point.treatedHigh)}`),
    ...trend
      .slice(1)
      .reverse()
      .map((point, index) => `${x(last - index)},${y(point.treatedLow)}`),
  ];
  const bandWithOrigin = [`${x(0)},${y(trend[0].treated)}`, ...band].join(" ");

  return (
    <AnalyticsCard
      className="h-full"
      aside={<IllustrativeTag />}
      description="Nota das perguntas ligadas às alavancas desde a coleta. A coleta é o marco; depois, a estimativa do agente com faixa de confiança."
      title="Evolução das perguntas tratadas"
    >
      <ChartLegend
        items={[
          { label: "Perguntas tratadas", marker: <DotMarker color={treatedColor} hollow /> },
          { label: "Demais perguntas", marker: <DotMarker color={untreatedColor} hollow /> },
          { label: "Faixa de confiança", marker: <SwatchMarker className="opacity-30" color={treatedColor} /> },
        ]}
      />

      <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-2">
        <div aria-hidden="true" className="relative h-56 text-xs text-muted-foreground tabular-nums">
          {yTicks.map((tick) => (
            <span className="absolute right-0 -translate-y-1/2" key={tick} style={{ top: `${y(tick)}%` }}>
              {formatScore(tick)}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="relative mr-12 ml-3 h-56">
            <svg
              aria-hidden="true"
              className="absolute inset-0 size-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              {yTicks.map((tick) => (
                <line
                  key={tick}
                  stroke="var(--border)"
                  vectorEffect="non-scaling-stroke"
                  x1="0"
                  x2="100"
                  y1={y(tick)}
                  y2={y(tick)}
                />
              ))}
              {target <= yMax ? (
                <line
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                  x1="0"
                  x2="100"
                  y1={y(target)}
                  y2={y(target)}
                />
              ) : null}
              {milestones.map((milestone) => (
                <line
                  key={milestone.label}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="2 4"
                  vectorEffect="non-scaling-stroke"
                  x1={x(milestone.position)}
                  x2={x(milestone.position)}
                  y1="0"
                  y2="100"
                />
              ))}
              <polygon fill={treatedColor} fillOpacity="0.15" points={bandWithOrigin} />
              <polyline
                fill="none"
                points={line("untreated")}
                stroke={untreatedColor}
                strokeDasharray="6 4"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                fill="none"
                points={line("treated")}
                stroke={treatedColor}
                strokeDasharray="6 4"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {target <= yMax ? (
              <span
                className="absolute right-0 -translate-y-full pb-0.5 text-xs text-muted-foreground"
                style={{ top: `${y(target)}%` }}
              >
                meta {formatScore(target)}
              </span>
            ) : null}

            {trend.map((point, index) =>
              (["untreated", "treated"] as const).map((key) => {
                const color = key === "treated" ? treatedColor : untreatedColor;
                const isCollection = point.kind === "coleta";

                return (
                  <span
                    aria-hidden="true"
                    className={
                      isCollection
                        ? "absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-[3px]"
                        : "absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-sidebar dark:bg-card"
                    }
                    key={`${point.label}-${key}`}
                    style={{
                      left: `${x(index)}%`,
                      top: `${y(point[key])}%`,
                      ...(isCollection ? { backgroundColor: color } : { borderColor: color }),
                    }}
                    title={`${point.label}: ${formatScore(point[key])}`}
                  />
                );
              }),
            )}

            {(() => {
              const end = trend[last];
              return (
                <span
                  className="absolute translate-x-2 -translate-y-1/2 text-xs font-medium whitespace-nowrap tabular-nums"
                  style={{ color: treatedColor, left: "100%", top: `${y(end.treated)}%` }}
                >
                  ~{formatScore(end.treated)}
                </span>
              );
            })()}
          </div>

          <div aria-hidden="true" className="relative mr-12 ml-3 h-4 text-xs text-muted-foreground">
            {trend.map((point, index) => (
              <span
                className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
                key={point.label}
                style={{ left: `${x(index)}%` }}
              >
                {point.label}
              </span>
            ))}
          </div>
          <ul className="ml-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {milestones.map((milestone) => (
              <li className="flex items-center gap-1.5" key={milestone.label}>
                <span aria-hidden="true" className="h-3 border-l border-dashed border-muted-foreground" />
                {milestone.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <table className="sr-only">
        <caption>Evolução das perguntas tratadas e das demais perguntas</caption>
        <thead>
          <tr>
            <th scope="col">Momento</th>
            <th scope="col">Perguntas tratadas</th>
            <th scope="col">Demais perguntas</th>
          </tr>
        </thead>
        <tbody>
          {trend.map((point) => (
            <tr key={point.label}>
              <th scope="row">{point.label}</th>
              <td>{formatScore(point.treated)}</td>
              <td>{formatScore(point.untreated)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AnalyticsCard>
  );
}
