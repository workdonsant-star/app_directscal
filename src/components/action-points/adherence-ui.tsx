import {
  CircleCheck,
  CircleDashed,
  CircleOff,
  CircleAlert,
  MessagesSquare,
  Minus,
  ShieldCheck,
  TriangleAlert,
  TrendingDown,
  TrendingUp,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initialsOf } from "@/components/gantt/action-point-badges";
import {
  adherenceHealthLabels,
  type AdherenceActionPoint,
  type AdherenceCategoryKey,
  type AdherenceDistribution,
  type AdherenceHealth,
  type AdherenceLeader,
  type AdherenceTrend,
} from "@/lib/data/action-points-adherence-example";
import { cn } from "@/lib/utils";

// Cada categoria tem um ícone e uma cor própria (token por tema), aplicada só no
// ícone — nunca como fundo de bloco, para preservar a densidade da marca.
export const categoryMeta: Record<
  AdherenceCategoryKey,
  { icon: LucideIcon; tone: string; soft: string; solid: string; border: string }
> = {
  comunicacao: {
    icon: MessagesSquare,
    tone: "text-ap-comunicacao",
    soft: "bg-ap-comunicacao/10",
    solid: "bg-ap-comunicacao",
    border: "border-ap-comunicacao",
  },
  pessoas: {
    icon: Users,
    tone: "text-ap-pessoas",
    soft: "bg-ap-pessoas/10",
    solid: "bg-ap-pessoas",
    border: "border-ap-pessoas",
  },
  processos: {
    icon: Workflow,
    tone: "text-ap-processos",
    soft: "bg-ap-processos/10",
    solid: "bg-ap-processos",
    border: "border-ap-processos",
  },
  governanca: {
    icon: ShieldCheck,
    tone: "text-ap-governanca",
    soft: "bg-ap-governanca/10",
    solid: "bg-ap-governanca",
    border: "border-ap-governanca",
  },
};

export function CategoryIcon({
  category,
  className,
}: {
  category: AdherenceCategoryKey;
  className?: string;
}) {
  const meta = categoryMeta[category];
  const Icon = meta.icon;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md",
        meta.soft,
        meta.tone,
        className,
      )}
    >
      <Icon className="size-3.5" />
    </span>
  );
}

// Mesma régua de status da Maturidade (CHART_COLOR_SYSTEM.md): a cor fica no
// ícone, no ponto e na barra; o texto usa `text` (neutro) e carrega o significado.
type HealthMeta = { icon: LucideIcon; tone: string; text: string; dot: string; bar: string; border: string };

export const healthMeta: Record<AdherenceHealth, HealthMeta> = {
  consistente: {
    icon: CircleCheck,
    tone: "text-[var(--omdx-status-consistente)]",
    text: "text-foreground",
    dot: "bg-[var(--omdx-status-consistente)]",
    bar: "bg-[var(--omdx-status-consistente)]",
    border: "border-[var(--omdx-status-consistente)]",
  },
  atencao: {
    icon: TriangleAlert,
    tone: "text-[var(--omdx-status-atencao)]",
    text: "text-foreground",
    dot: "bg-[var(--omdx-status-atencao)]",
    bar: "bg-[var(--omdx-status-atencao)]",
    border: "border-[var(--omdx-status-atencao)]",
  },
  risco: {
    icon: CircleAlert,
    tone: "text-[var(--omdx-status-critico)]",
    text: "text-foreground",
    dot: "bg-[var(--omdx-status-critico)]",
    bar: "bg-[var(--omdx-status-critico)]",
    border: "border-[var(--omdx-status-critico)]",
  },
  aguardando: {
    icon: CircleDashed,
    tone: "text-muted-foreground",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    bar: "bg-muted-foreground",
    border: "border-muted-foreground",
  },
  parado: {
    icon: CircleOff,
    tone: "text-muted-foreground",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    bar: "bg-muted-foreground",
    border: "border-muted-foreground",
  },
};

const trendIcons: Record<AdherenceTrend, LucideIcon> = {
  subindo: TrendingUp,
  estavel: Minus,
  caindo: TrendingDown,
};

const trendLabels: Record<AdherenceTrend, string> = {
  subindo: "tendência de alta",
  estavel: "tendência estável",
  caindo: "tendência de queda",
};

// Faixa de aderência: o ícone reforça, o texto carrega o significado.
export function HealthBadge({
  health,
  trend,
}: {
  health: AdherenceHealth;
  trend?: AdherenceTrend;
}) {
  const meta = healthMeta[health];
  const Icon = meta.icon;
  const Trend = trend ? trendIcons[trend] : null;

  return (
    <span className="inline-flex items-center gap-2">
      <Icon className={cn("size-4 shrink-0", meta.tone)} aria-hidden="true" />
      <span className={cn("font-medium", meta.text)}>{adherenceHealthLabels[health]}</span>
      {Trend && (
        <Trend
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-label={trend ? trendLabels[trend] : undefined}
        />
      )}
    </span>
  );
}

export function LeaderCell({ leader }: { leader: AdherenceLeader | null }) {
  if (!leader) {
    return (
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-xs text-muted-foreground"
        >
          ?
        </span>
        A definir
      </span>
    );
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Avatar size="sm" aria-hidden="true">
        <AvatarFallback>{initialsOf(leader.name)}</AvatarFallback>
      </Avatar>
      <span className="truncate">{leader.name}</span>
    </span>
  );
}

// Pontinhos de distribuição no estilo da lista de iniciativas do Linear.
export function DistributionDots({ dist }: { dist: AdherenceDistribution }) {
  const entries: { count: number; dot: string; tone: string }[] = [
    { count: dist.consistente, dot: healthMeta.consistente.dot, tone: healthMeta.consistente.text },
    { count: dist.atencao, dot: healthMeta.atencao.dot, tone: healthMeta.atencao.text },
    { count: dist.risco, dot: healthMeta.risco.dot, tone: healthMeta.risco.text },
    { count: dist.aguardando, dot: healthMeta.aguardando.dot, tone: healthMeta.aguardando.text },
    { count: dist.parado, dot: healthMeta.parado.dot, tone: healthMeta.parado.text },
  ].filter((entry) => entry.count > 0);

  return (
    <span className="inline-flex items-center gap-2.5 text-muted-foreground tabular-nums">
      {entries.map((entry, index) => (
        <span key={index} className={cn("inline-flex items-center gap-1.5", entry.tone)}>
          <span className={cn("size-2 shrink-0 rounded-full", entry.dot)} />
          {entry.count}
        </span>
      ))}
    </span>
  );
}

// Evidência do ciclo: barra feito/total para ritual periódico; rótulo livre
// para action point por evento; sem barra falsa quando não há denominador.
export function EvidenceCell({ ap }: { ap: AdherenceActionPoint }) {
  if (ap.mode === "periodica" && typeof ap.cycleTotal === "number") {
    const done = ap.cycleDone ?? 0;
    const pct = ap.cycleTotal ? Math.round((done / ap.cycleTotal) * 100) : 0;

    return (
      <span className={cn("inline-flex items-center gap-2", healthMeta[ap.health].text)}>
        <span className="h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-border">
          <span
            className={cn("block h-full rounded-full", healthMeta[ap.health].bar)}
            style={{ width: `${pct}%` }}
          />
        </span>
        <span className="tabular-nums">
          {done}/{ap.cycleTotal}
        </span>
      </span>
    );
  }

  return (
    <span className={healthMeta[ap.health].text}>{ap.eventLabel ?? "—"}</span>
  );
}

export function LastCheckInCell({ ap }: { ap: AdherenceActionPoint }) {
  if (ap.health === "aguardando") {
    return <span className="text-muted-foreground">Aguardando resposta</span>;
  }
  if (ap.health === "parado") {
    return <span className="text-muted-foreground">Sem responsável</span>;
  }

  return (
    <span className="inline-flex flex-col">
      <span>{ap.lastCheckIn}</span>
      <span className="text-xs text-muted-foreground">relato do líder</span>
    </span>
  );
}
