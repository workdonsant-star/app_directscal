import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import {
  formatDelta,
  formatScore,
  ScoreProgressBar,
} from "@/components/omdx/analytics/analytics-primitives";
import type {
  AnalyticsVerdict as AnalyticsVerdictData,
  AnalyticsVerdictProgress,
} from "@/lib/data/omdx-analytics-overview";

function scalePosition(value: number) {
  return `${((Math.min(5, Math.max(1, value)) - 1) / 4) * 100}%`;
}

function SignalRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <li className="flex items-baseline justify-between gap-3 border-t border-border py-2.5 first:border-t-0">
      <span className="font-label text-ui-label text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-2 text-sm font-medium text-foreground tabular-nums">
        {value}
        {href ? (
          <a
            className="rounded-sm text-xs font-normal text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            href={href}
          >
            Ver
          </a>
        ) : null}
      </span>
    </li>
  );
}

const stateLabel: Record<AnalyticsVerdictData["classification"], string> = {
  Crítico: "Estado crítico",
  Inconsistente: "Estado inconsistente",
  Atenção: "Estado de atenção",
  Consistente: "Estado consistente",
};

function ProgressSource({ progress }: { progress: AnalyticsVerdictProgress }) {
  if (progress.status === "sem_base") {
    return (
      <p className="text-sm text-muted-foreground">
        O progresso pelas ações aparece quando houver action points em andamento e ativos publicados.
      </p>
    );
  }

  return null;
}

export function AnalyticsVerdict({ verdict }: { verdict: AnalyticsVerdictData | null }) {
  if (!verdict) {
    return (
      <div className="rounded-[10px] bg-sidebar px-6 py-10 text-center dark:bg-card">
        <p className="text-ui-title text-foreground">Nenhuma coleta consolidada</p>
        <p className="mt-1 text-sm text-muted-foreground">
          O veredito aparece quando um diagnóstico reúne respostas de Fundador.
        </p>
      </div>
    );
  }

  const delta = verdict.deltaPoints;
  const DeltaIcon = delta === null || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="grid gap-6 rounded-[10px] bg-sidebar p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-10 dark:bg-card">
      <div className="flex flex-col gap-4">
        <p className="font-label text-ui-label text-muted-foreground">Maturidade geral</p>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">{stateLabel[verdict.classification]}</p>
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-ui-kpi text-foreground tabular-nums">
              {formatScore(verdict.maturity)}
              <span className="text-sm text-muted-foreground"> /5</span>
            </span>
            {delta !== null ? (
              <span
                className="flex items-center gap-0.5 text-xs font-medium text-foreground tabular-nums"
                title={verdict.referenceLabel ?? undefined}
              >
                <DeltaIcon aria-hidden="true" className="size-3.5" />
                {formatDelta(delta)} vs. anterior
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {verdict.progress.status === "calculado" ? (
            <div aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3.5 rounded-full" style={{ backgroundColor: "var(--overview-chart-dimensions)" }} />
                Nota da pesquisa
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3.5 rounded-full" style={{ backgroundColor: "var(--overview-chart-progress)" }} />
                Progresso pelas ações
                <span className="font-medium text-foreground tabular-nums">
                  {formatDelta(verdict.progress.points)}
                </span>
              </span>
            </div>
          ) : null}
          <ScoreProgressBar
            minimum={verdict.minimum}
            progress={verdict.progress.status === "calculado" ? verdict.progress.points : null}
            score={verdict.maturity}
          />
          <div aria-hidden="true" className="relative h-4 text-xs text-muted-foreground tabular-nums">
            <span className="absolute left-0">1</span>
            <span
              className="absolute -translate-x-1/2 font-medium text-foreground"
              style={{ left: scalePosition(verdict.minimum) }}
            >
              mínimo {formatScore(verdict.minimum)}
            </span>
            <span className="absolute right-0">5</span>
          </div>
          <ProgressSource progress={verdict.progress} />
        </div>
      </div>

      <div className="flex flex-col justify-center">
        <ul className="flex flex-col">
          <SignalRow
            href="#nivel-camadas"
            label="Desalinhamento"
            value={verdict.misalignment === null ? "Sem base" : `${formatScore(verdict.misalignment)} pt`}
          />
          <SignalRow
            href="#nivel-gap"
            label="Dimensões críticas"
            value={`${verdict.criticalDimensions} de ${verdict.dimensionCount}`}
          />
          <SignalRow label="Consenso interno" value={`${verdict.consensus}%`} />
          <SignalRow
            href="#aderencia-ativos"
            label="Adoção dos ativos"
            value={verdict.adoption === null ? "Sem base" : `${verdict.adoption}%`}
          />
        </ul>
      </div>
    </div>
  );
}
