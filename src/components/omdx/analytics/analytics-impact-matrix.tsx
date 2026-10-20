import {
  AnalyticsCard,
  formatDelta,
  IllustrativeTag,
} from "@/components/omdx/analytics/analytics-primitives";
import type { AnalyticsLeverPoint } from "@/lib/data/omdx-analytics-overview";
import type { ImpactQuadrant } from "@/lib/data/omdx-impact-example";
import { cn } from "@/lib/utils";

// A situação é lida pela posição no quadrante; o ponto distingue pela forma
// alavanca com ativo publicado e sinal (cheio) de alavanca sem base (vazado).
const quadrants: Record<ImpactQuadrant, { label: string; reading: string }> = {
  funcionando: { label: "Funcionando", reading: "padronizar e replicar" },
  sem_efeito: { label: "Executa sem efeito", reading: "rever a ação ou o ativo" },
  sem_acao: { label: "Melhora sem ação", reading: "fator externo" },
  parado: { label: "Parado", reading: "escalar ao responsável" },
};

function LeverDot({ hollow, size = "size-3.5" }: { hollow: boolean; size?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(size, "rounded-full border-2")}
      style={{
        borderColor: "var(--overview-chart-progress)",
        backgroundColor: hollow ? "transparent" : "var(--overview-chart-progress)",
      }}
    />
  );
}

const PROGRESS_MIN = -0.2;
const PROGRESS_MAX = 1;
const PROGRESS_CUTOFF = 0.3;

function bottom(progress: number) {
  const clamped = Math.min(PROGRESS_MAX, Math.max(PROGRESS_MIN, progress));
  return `${((clamped - PROGRESS_MIN) / (PROGRESS_MAX - PROGRESS_MIN)) * 100}%`;
}

export function AnalyticsImpactMatrix({ points }: { points: AnalyticsLeverPoint[] }) {
  return (
    <AnalyticsCard
      className="h-full"
      aside={<IllustrativeTag />}
      description="Cada ponto é uma alavanca: quanto mais à direita, mais action points em dia; quanto mais alto, mais a nota avançou pelas ações."
      title="Onde as ações estão dando resultado"
    >
      <div aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <LeverDot hollow={false} size="size-2.5" />
          Ativo publicado, com sinal
        </span>
        <span className="flex items-center gap-1.5">
          <LeverDot hollow size="size-2.5" />
          Sem ativo publicado ou sinal insuficiente
        </span>
      </div>

      <div className="grid grid-cols-[16px_minmax(0,1fr)] gap-x-2">
        <span className="flex items-center justify-center">
          <span className="-rotate-90 text-xs whitespace-nowrap text-muted-foreground">Progresso pelas ações</span>
        </span>
        <div className="flex flex-col gap-2">
          <div className="relative h-72 rounded-[5px] border border-border">
            <span aria-hidden="true" className="absolute inset-y-0 left-1/2 border-l border-border" />
            <span
              aria-hidden="true"
              className="absolute inset-x-0 border-t border-border"
              style={{ bottom: bottom(PROGRESS_CUTOFF) }}
            />
            <span className="absolute top-2 right-2 text-xs text-muted-foreground">{quadrants.funcionando.label}</span>
            <span className="absolute top-2 left-2 text-xs text-muted-foreground">{quadrants.sem_acao.label}</span>
            <span className="absolute right-2 bottom-2 text-xs text-muted-foreground">{quadrants.sem_efeito.label}</span>
            <span className="absolute bottom-2 left-2 text-xs text-muted-foreground">{quadrants.parado.label}</span>

            {points.map((point) => {
              const quadrant = quadrants[point.quadrant];

              return (
                <div
                  className="absolute flex -translate-x-1/2 translate-y-1/2 flex-col items-center gap-1"
                  key={point.dimension}
                  style={{ left: `${Math.min(92, Math.max(8, point.execution))}%`, bottom: bottom(point.progress) }}
                  title={`${point.shortDimension}: ${quadrant.label.toLowerCase()}, ${quadrant.reading}. ${point.execution}% dos action points em dia, ${
                    point.hasSignal ? `progresso ${formatDelta(point.progress)}` : "sem ativo publicado ou sinal insuficiente"
                  }.`}
                >
                  <LeverDot hollow={!point.hasSignal} />
                  <span className="text-xs whitespace-nowrap text-foreground">{point.shortDimension}</span>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-muted-foreground">Action points em dia →</p>
        </div>
      </div>


    </AnalyticsCard>
  );
}
