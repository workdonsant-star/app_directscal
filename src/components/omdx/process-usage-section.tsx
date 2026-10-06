import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ProcessUsageAnalytics,
  ProcessUsageMetric,
  ProcessUsageWeek,
} from "@/lib/data/process-usage-analytics";
import { cn } from "@/lib/utils";

const resolvedColor = "var(--overview-chart-usage-resolved)";
const gapColor = "var(--overview-chart-usage-gap)";

function MetricCard({
  title,
  metric,
  periodDays,
  hint,
}: {
  title: string;
  metric: ProcessUsageMetric;
  periodDays: number;
  hint: string;
}) {
  const delta = metric.deltaPoints;
  const DirectionIcon =
    delta === null || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  const color =
    delta === null || delta === 0
      ? "var(--muted-foreground)"
      : delta > 0
        ? "var(--omdx-status-consistente)"
        : "var(--omdx-status-atencao)";

  return (
    <Card
      size="sm"
      title={hint}
      className="min-h-[109px] gap-2 rounded-[5px] border-0 bg-sidebar px-5 py-2.5 shadow-none ring-0"
    >
      <CardHeader className="px-0 pb-0">
        <CardTitle className="text-[10px] leading-[13px] font-normal text-muted-foreground group-data-[size=sm]/card:text-[10px]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-0">
        <p className="text-[40px] leading-9 font-light tracking-[-0.75px] text-foreground tabular-nums">
          {metric.value === null ? "—" : `${metric.value}%`}
        </p>
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] leading-[13px] text-muted-foreground">
          {delta !== null ? (
            <span
              className="flex items-center gap-0.5 text-xs leading-4 font-medium tabular-nums"
              style={{ color }}
            >
              <DirectionIcon aria-hidden="true" className="size-3.5" />
              {Math.abs(delta)} p.p.
            </span>
          ) : null}
          <span>
            {delta !== null
              ? `vs. ${periodDays} dias anteriores · ${metric.detail}`
              : metric.detail}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="min-h-[490px] min-w-0 gap-3 rounded-[10px] border-0 bg-sidebar p-5 shadow-none ring-0 xl:h-[490px]">
      <CardHeader className="gap-1 px-0 pb-0">
        <CardTitle className="text-sm leading-5 font-semibold text-card-foreground">
          {title}
        </CardTitle>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="px-0">{children}</CardContent>
    </Card>
  );
}

function Legend({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-[2px]"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function niceMax(value: number) {
  if (value <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / step;
  const nice = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * step;
}

// Retângulo com cantos arredondados só no topo: a base fica ancorada no eixo.
function topRoundedRect(x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height);
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`;
}

function WeeklyQuestionsChart({ weeks }: { weeks: ProcessUsageWeek[] }) {
  const width = 744;
  const plotLeft = 40;
  const plotRight = 732;
  const plotTop = 18;
  const plotBottom = 321;
  const plotHeight = plotBottom - plotTop;
  const maxValue = niceMax(Math.max(0, ...weeks.map((week) => week.answered + week.gaps)) * 1.2);
  const band = (plotRight - plotLeft) / weeks.length;
  const barWidth = Math.min(43, band * 0.5);
  const scale = (value: number) => (value / maxValue) * plotHeight;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => Math.round(maxValue * fraction));

  return (
    <div className="flex flex-col gap-3">
      <Legend
        items={[
          { label: "Respondidas com fonte", color: resolvedColor },
          { label: "Sem resposta publicada", color: gapColor },
        ]}
      />
      <svg
        aria-hidden="true"
        className="block h-[360px] w-full overflow-visible"
        preserveAspectRatio="none"
        viewBox={`0 0 ${width} 360`}
      >
        {ticks.map((tick) => {
          const y = plotBottom - scale(tick);

          return (
            <g key={tick}>
              <line
                stroke="var(--border)"
                strokeOpacity="0.65"
                x1={plotLeft}
                x2={plotRight}
                y1={y}
                y2={y}
              />
              <text
                dominantBaseline="middle"
                fill="var(--muted-foreground)"
                fontSize="12"
                x="0"
                y={y}
              >
                {tick}
              </text>
            </g>
          );
        })}

        {weeks.map((week, index) => {
          const center = plotLeft + band * index + band / 2;
          const x = center - barWidth / 2;
          const answeredHeight = scale(week.answered);
          const gapHeight = scale(week.gaps);
          const answeredTop = plotBottom - answeredHeight;
          // 2 px de superfície separam os segmentos empilhados.
          const gapBottom = answeredTop - (week.answered > 0 ? 2 : 0);
          const gapTop = gapBottom - gapHeight;
          const total = week.answered + week.gaps;

          return (
            <g key={week.start}>
              {week.answered > 0 ? (
                week.gaps > 0 ? (
                  <rect
                    fill={resolvedColor}
                    height={answeredHeight}
                    width={barWidth}
                    x={x}
                    y={answeredTop}
                  />
                ) : (
                  <path
                    d={topRoundedRect(x, answeredTop, barWidth, answeredHeight, 4)}
                    fill={resolvedColor}
                  />
                )
              ) : null}
              {week.gaps > 0 ? (
                <path
                  d={topRoundedRect(x, gapTop, barWidth, gapHeight, 4)}
                  fill={gapColor}
                />
              ) : null}
              {total > 0 ? (
                <text
                  fill="var(--muted-foreground)"
                  fontSize="12"
                  textAnchor="middle"
                  x={center}
                  y={(week.gaps > 0 ? gapTop : answeredTop) - 6}
                >
                  {total}
                </text>
              ) : null}
              <text
                fill="var(--muted-foreground)"
                fontSize="12"
                textAnchor="middle"
                x={center}
                y="343"
              >
                {week.label}
              </text>
              {/* Alvo de hover maior que a barra, com o resumo da semana. */}
              <rect
                fill="transparent"
                height={plotHeight + 20}
                width={band}
                x={plotLeft + band * index}
                y={plotTop - 10}
              >
                <title>{`Semana de ${week.label}: ${week.answered} respondidas com fonte, ${week.gaps} sem resposta publicada`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>Perguntas por semana</caption>
        <thead>
          <tr>
            <th scope="col">Semana</th>
            <th scope="col">Respondidas com fonte</th>
            <th scope="col">Sem resposta publicada</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.start}>
              <th scope="row">{week.label}</th>
              <td>{week.answered}</td>
              <td>{week.gaps}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProcessRanking({
  processes,
  periodDays,
}: {
  processes: ProcessUsageAnalytics["processes"];
  periodDays: number;
}) {
  if (processes.length === 0) {
    return (
      <p className="flex h-[388px] items-center justify-center text-center text-sm text-muted-foreground">
        Nenhuma resposta citou um processo nos últimos {periodDays} dias.
      </p>
    );
  }

  const max = Math.max(...processes.map((process) => process.questions));

  return (
    <div className="flex flex-col gap-3">
      <Legend
        items={[
          { label: "Consultas", color: resolvedColor },
          { label: "Avaliadas como não úteis", color: gapColor },
        ]}
      />
      <ol className="flex max-h-[360px] flex-col gap-3.5 overflow-y-auto">
        {processes.map((process) => {
          const share = (process.questions / max) * 100;
          const notUsefulShare =
            process.questions > 0 ? (process.notUseful / process.questions) * 100 : 0;

          return (
            <li
              key={process.assetId}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5"
              title={`${process.title}: ${process.questions} consultas, ${process.notUseful} avaliadas como não úteis`}
            >
              {process.href ? (
                <Link
                  href={process.href}
                  className="truncate rounded-sm text-sm text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {process.title}
                </Link>
              ) : (
                <span className="truncate text-sm text-foreground">{process.title}</span>
              )}
              <span className="text-xs text-muted-foreground tabular-nums">
                {process.questions}
                {process.notUseful > 0 ? ` · ${process.notUseful} não úteis` : ""}
              </span>
              <div className="col-span-2 h-2.5" aria-hidden="true">
                <div className="flex h-full gap-[2px]" style={{ width: `${share}%` }}>
                  <div
                    className={cn(
                      "h-full",
                      process.notUseful > 0 ? "rounded-l-[2px]" : "rounded-[2px]",
                    )}
                    style={{
                      backgroundColor: resolvedColor,
                      width: `${100 - notUsefulShare}%`,
                    }}
                  />
                  {process.notUseful > 0 ? (
                    <div
                      className="h-full rounded-r-[2px]"
                      style={{ backgroundColor: gapColor, width: `${notUsefulShare}%` }}
                    />
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ProcessUsageSection({ analytics }: { analytics: ProcessUsageAnalytics }) {
  const { totals, periodDays } = analytics;
  const hasHistory = analytics.weekly.some((week) => week.answered + week.gaps > 0);

  return (
    <section aria-labelledby="process-usage-title" className="flex flex-col gap-4">
      <header className="max-w-3xl">
        <h2 id="process-usage-title" className="text-[17px] leading-6 font-bold tracking-[-0.5px] text-foreground">
          Aderência dos ativos de gestão
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Como o time consulta SOPs, playbooks e governança no WorkFlow e no Slack, nos
          últimos {periodDays} dias. Mostra adoção e clareza dos ativos publicados; a
          execução dos processos é medida à parte.
        </p>
      </header>

      {hasHistory ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              title="Adoção"
              metric={analytics.adoption}
              periodDays={periodDays}
              hint="Pessoas distintas que perguntaram no período sobre lideranças ativas e time aprovado. Quem usa app e Slack conta duas vezes."
            />
            <MetricCard
              title="Cobertura"
              metric={analytics.coverage}
              periodDays={periodDays}
              hint="Perguntas respondidas com fonte publicada sobre o total de perguntas, sem contar falhas técnicas."
            />
            <MetricCard
              title="Utilidade"
              metric={analytics.usefulness}
              periodDays={periodDays}
              hint="Respostas avaliadas como úteis sobre o total de respostas avaliadas."
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title="Perguntas por semana"
              description={`${totals.questions} perguntas nos últimos ${periodDays} dias, ${totals.gaps} sem resposta publicada.`}
            >
              <WeeklyQuestionsChart weeks={analytics.weekly} />
            </ChartCard>
            <ChartCard
              title="Processos mais consultados"
              description={`Ativos citados nas respostas dos últimos ${periodDays} dias. Muitas avaliações negativas indicam um processo a revisar.`}
            >
              <ProcessRanking processes={analytics.processes} periodDays={periodDays} />
            </ChartCard>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="font-heading text-base font-medium">Nenhuma pergunta registrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Os indicadores aparecem quando o time começa a perguntar no WorkFlow ou no
            Slack.
          </p>
        </div>
      )}
    </section>
  );
}
