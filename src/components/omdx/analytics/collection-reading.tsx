import { formatScore } from "@/components/omdx/analytics/analytics-primitives";
import type { Diagnostic } from "@/lib/types";

const responseLayers = [
  { key: "fundador", label: "Fundador", color: "var(--overview-chart-founder)" },
  { key: "lideranca", label: "Liderança", color: "var(--overview-chart-leadership)" },
  { key: "operacao", label: "Time", color: "var(--overview-chart-tactical)" },
] as const;

const countFormatter = new Intl.NumberFormat("pt-BR");

export function CollectionReading({ score, responses }: {
  score: number | null;
  responses: Diagnostic["responses"] | null;
}) {
  const scorePosition = score === null ? null : `${((Math.min(5, Math.max(1, score)) - 1) / 4) * 100}%`;
  const largestCount = Math.max(1, ...responseLayers.map(({ key }) => responses?.[key] ?? 0));

  return (
    <div className="grid gap-6 rounded-[10px] bg-sidebar p-5 dark:bg-card md:grid-cols-2 md:gap-10">
      <div className="flex min-w-0 flex-col gap-4">
        <h3 className="text-ui-title">Média das percepções</h3>
        <p className="text-ui-kpi tabular-nums">
          {score === null ? <span className="text-ui-section text-muted-foreground">Sem dados</span> : <>{formatScore(score)}<span className="ml-1 text-sm text-muted-foreground">/ 5</span></>}
        </p>
        <div
          aria-label="Média das percepções"
          aria-valuemax={score === null ? undefined : 5}
          aria-valuemin={score === null ? undefined : 1}
          aria-valuenow={score ?? undefined}
          aria-valuetext={score === null ? undefined : `${formatScore(score)} de 5`}
          role={score === null ? undefined : "meter"}
          className="mt-auto px-1.5"
        >
          <div aria-hidden="true" className="relative h-2 rounded-[2px] bg-border">
            {scorePosition !== null ? <>
              <span className="absolute inset-y-0 left-0 rounded-[2px] bg-[var(--overview-chart-dimensions)]" style={{ width: scorePosition }} />
              <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground bg-[var(--overview-chart-dimensions)]" style={{ left: scorePosition }} />
            </> : null}
          </div>
          <div aria-hidden="true" className="mt-2 flex justify-between text-xs text-muted-foreground tabular-nums">
            {[1, 2, 3, 4, 5].map(value => <span key={value}>{value}</span>)}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4 border-t border-border pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-ui-title">Respostas por nível</h3>
          {responses ? <p className="text-xs text-muted-foreground tabular-nums">{countFormatter.format(responses.total)} {responses.total === 1 ? "resposta" : "respostas"} no total</p> : null}
        </div>
        {responses ? <dl className="flex flex-col gap-3">
          {responseLayers.map(({ key, label, color }) => (
            <div className="grid grid-cols-[5rem_minmax(0,1fr)_max-content] items-center gap-3" key={key}>
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="col-span-2 grid grid-cols-subgrid items-center">
                <span aria-hidden="true" className="block h-3 rounded-[2px] bg-border/50">
                  <span className="block h-full rounded-[2px]" style={{ backgroundColor: color, width: `${(responses[key] / largestCount) * 100}%` }} />
                </span>
                <span className="min-w-6 text-right text-sm tabular-nums">{countFormatter.format(responses[key])}</span>
              </dd>
            </div>
          ))}
        </dl> : <p className="text-sm text-muted-foreground">Nenhuma coleta disponível.</p>}
      </div>
    </div>
  );
}
