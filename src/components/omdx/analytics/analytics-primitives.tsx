import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatScore(value: number) {
  return scoreFormatter.format(value);
}

export function formatDelta(value: number) {
  const formatted = scoreFormatter.format(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}

function scalePosition(value: number) {
  return `${((Math.min(5, Math.max(1, value)) - 1) / 4) * 100}%`;
}

// Barra 1–5: roxo para a nota da pesquisa e verde para o progresso pelas ações.
// Progresso negativo recua sobre o roxo e fica marcado pelo contorno.
export function ScoreProgressBar({
  score,
  progress,
  minimum,
  className,
}: {
  score: number;
  progress: number | null;
  minimum?: number;
  className?: string;
}) {
  const points = progress ?? 0;
  const reached = Math.min(5, Math.max(1, score + points));
  const surveyEnd = Math.min(score, reached);

  return (
    <div aria-hidden="true" className={cn("relative h-2 rounded-full bg-muted", className)}>
      <span
        className={cn("absolute inset-y-0 left-0", points === 0 ? "rounded-full" : "rounded-l-full")}
        style={{ backgroundColor: "var(--overview-chart-dimensions)", width: scalePosition(surveyEnd) }}
      />
      {points !== 0 ? (
        <span
          className="absolute inset-y-0 rounded-r-full"
          style={{
            left: scalePosition(surveyEnd),
            width: `calc(${scalePosition(Math.max(score, reached))} - ${scalePosition(surveyEnd)})`,
            ...(points > 0
              ? { backgroundColor: "var(--overview-chart-progress)" }
              : { boxShadow: "inset 0 0 0 1.5px var(--overview-chart-dimensions)" }),
          }}
        />
      ) : null}
      {minimum !== undefined ? (
        <span
          className="absolute -top-1.5 h-5 w-0.5 rounded-full bg-foreground"
          style={{ left: scalePosition(minimum) }}
        />
      ) : null}
    </div>
  );
}

export const analyticsLayers = [
  { key: "diretoria", label: "Fundador", color: "var(--overview-chart-founder)" },
  { key: "lideranca", label: "Liderança", color: "var(--overview-chart-leadership)" },
  { key: "time", label: "Time", color: "var(--overview-chart-tactical)" },
] as const;

// Nível de leitura do Analytics. O título fica só para leitores de tela: a
// ordem dos blocos já comunica a hierarquia.
export function AnalyticsLevel({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="flex scroll-mt-20 flex-col gap-3" id={id}>
      <h2 className="sr-only" id={`${id}-title`}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function AnalyticsCard({
  title,
  description,
  aside,
  className,
  children,
}: {
  title?: string;
  description?: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-4 rounded-[10px] bg-sidebar p-5 dark:bg-card", className)}>
      {title ? (
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="text-ui-title text-card-foreground">{title}</h3>
            {description ? <p className="text-xs text-balance text-muted-foreground">{description}</p> : null}
          </div>
          {aside}
        </div>
      ) : null}
      {children}
    </div>
  );
}

// Identifica leituras ainda sem dado real: impacto e estimativa do agente.
export function IllustrativeTag() {
  return (
    <span
      className="shrink-0 rounded-[5px] border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground"
      title="Dados plotados até o acompanhamento pelo agente entrar em produção."
    >
      Ilustrativo
    </span>
  );
}

export function AnalyticsMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-label text-ui-label text-muted-foreground">{label}</p>
      <p className="text-ui-section text-foreground tabular-nums">{value}</p>
      {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

export function ChartLegend({
  items,
}: {
  items: Array<{ label: string; marker: ReactNode }>;
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((item) => (
        <li className="flex items-center gap-1.5" key={item.label}>
          {item.marker}
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function SwatchMarker({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("size-2.5 rounded-[2px]", className)}
      style={{ backgroundColor: color }}
    />
  );
}

export function DotMarker({ color, hollow = false }: { color: string; hollow?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="size-2.5 rounded-full border-2"
      style={{ borderColor: color, backgroundColor: hollow ? "transparent" : color }}
    />
  );
}

export function ConfidenceDots({ level }: { level: "alta" | "media" | "baixa" | null }) {
  const filled = level === "alta" ? 3 : level === "media" ? 2 : level === "baixa" ? 1 : 0;
  const label = level === "alta" ? "alta" : level === "media" ? "média" : "baixa";

  return (
    <span className="inline-flex items-center gap-0.5" title={`Confiança ${label}`}>
      <span className="sr-only">{`Confiança ${label}`}</span>
      {[0, 1, 2].map((index) => (
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            index < filled ? "bg-[var(--overview-chart-estimate)]" : "bg-muted",
          )}
          key={index}
        />
      ))}
    </span>
  );
}
