// Leitura do Analytics em níveis de valor: veredito, alavancas, gap, camadas,
// perguntas e execução. Junta o resultado real das coletas e da aderência dos
// ativos com o impacto ilustrativo de `omdx-impact-example.ts`. Componentes só
// aplicam apresentação.

import { classifyScore } from "@/lib/data/omdx-domain";
import {
  buildOmdxImpactExample,
  classifyQuadrant,
  type ImpactQuadrant,
  type LeverImpact,
  type OmdxImpactExample,
} from "@/lib/data/omdx-impact-example";
import {
  calculateAverageGap,
  calculateConsensus,
  calculateDimensionCriticality,
  gapCutoff,
  maturityCutoff,
  type DimensionResult,
  type LeverageMatrixCell,
  type OverviewAnalytics,
  type OverviewHistoricalComparison,
  type QuestionResult,
} from "@/lib/data/omdx-overview-analytics";
import type { ProcessUsageAnalytics } from "@/lib/data/process-usage-analytics";
import type { Classification } from "@/lib/types";

export const ANALYTICS_TOP_QUESTIONS = 5;

export type AnalyticsLayerKey = "diretoria" | "lideranca" | "time";

// Progresso calculado pelo agente desde a última pesquisa. Ilustrativo até o agente
// cruzar action points e vulnerabilidades em produção. Sem action points ou sem
// medição de adoção não há base: o card não mostra número.
export type AnalyticsVerdictProgress =
  | { status: "calculado"; points: number; onTrack: number; total: number; adoption: number }
  | { status: "sem_base" };

export type AnalyticsVerdict = {
  maturity: number;
  classification: Classification;
  // Variação em pontos contra a média dos diagnósticos anteriores; null sem referência.
  deltaPoints: number | null;
  referenceLabel: string | null;
  minimum: number;
  misalignment: number | null;
  criticalDimensions: number;
  dimensionCount: number;
  consensus: number;
  adoption: number | null;
  progress: AnalyticsVerdictProgress;
};

export type AnalyticsDimensionGap = {
  dimension: string;
  shortDimension: string;
  score: number;
  previous: number | null;
  // Progresso pelas ações, igual ao da alavanca; null fora das alavancas ou sem ativo.
  progress: number | null;
  treated: boolean;
};

export type AnalyticsLayerPerception = {
  dimension: string;
  shortDimension: string;
  scores: Record<AnalyticsLayerKey, number | null>;
  gap: number | null;
  diverges: boolean;
};

export type AnalyticsQuestionRow = {
  questionId: string;
  question: string;
  dimension: string;
  score: number;
  // Progresso pelas ações da dimensão da pergunta; null fora das alavancas ou sem ativo.
  progress: number | null;
  layerGap: number | null;
};

export type AnalyticsLever = LeverImpact & {
  measured: boolean;
  // Nível real de prioridade da matriz de alavancas.
  priority: LeverageMatrixCell["level"];
};

// Ponto da matriz de resultado: uma alavanca (dimensão) posicionada pelos action
// points em dia e pelo progresso pelas ações.
export type AnalyticsLeverPoint = {
  dimension: string;
  shortDimension: string;
  execution: number;
  progress: number;
  hasSignal: boolean;
  quadrant: ImpactQuadrant;
};

export type AnalyticsOverview = {
  verdict: AnalyticsVerdict | null;
  impact: OmdxImpactExample;
  levers: AnalyticsLever[];
  leverPoints: AnalyticsLeverPoint[];
  dimensions: AnalyticsDimensionGap[];
  layers: AnalyticsLayerPerception[];
  questions: AnalyticsQuestionRow[];
  questionTotal: number;
};

function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function average(values: number[]) {
  return values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;
}

function layerGap(dimension: DimensionResult) {
  const scores = [dimension.diretoria, dimension.lideranca, dimension.time].filter(
    (value): value is number => value !== null,
  );

  return scores.length < 2 ? null : round(Math.max(...scores) - Math.min(...scores));
}

// A adoção é condição para o avanço contar: ação executada sobre ativo que ninguém
// usa não move a maturidade.
function buildVerdictProgress(
  maturity: number,
  impact: OmdxImpactExample,
  adoption: number | null,
): AnalyticsVerdictProgress {
  const { onTrack, total } = impact.actionPoints;
  if (adoption === null || total === 0) return { status: "sem_base" };

  return {
    status: "calculado",
    points: round(Math.min(5 - maturity, impact.actionProgress * (adoption / 100))),
    onTrack,
    total,
    adoption,
  };
}

function buildVerdict(
  analytics: OverviewAnalytics,
  comparison: OverviewHistoricalComparison | null,
  processUsage: ProcessUsageAnalytics | null,
  impact: OmdxImpactExample,
): AnalyticsVerdict | null {
  if (analytics.dimensions.length === 0) return null;

  const maturity = round(average(analytics.dimensions.map((item) => item.maturity)));
  const historical = comparison?.historicalAnalytics.dimensions ?? [];
  const previous =
    historical.length > 0 ? round(average(historical.map((item) => item.maturity))) : null;

  return {
    maturity,
    classification: classifyScore(maturity),
    deltaPoints: previous === null ? null : round(maturity - previous),
    referenceLabel: comparison?.referenceLabel ?? null,
    minimum: maturityCutoff,
    misalignment: calculateAverageGap(analytics.dimensions),
    criticalDimensions: analytics.dimensions.filter((item) => item.maturity <= 3).length,
    dimensionCount: analytics.dimensions.length,
    consensus: calculateConsensus(analytics.dimensions),
    adoption: processUsage?.adoption.value ?? null,
    progress: buildVerdictProgress(maturity, impact, processUsage?.adoption.value ?? null),
  };
}

function buildQuestionRows(
  questions: QuestionResult[],
  impact: OmdxImpactExample,
): AnalyticsQuestionRow[] {
  // Em "todos", a mesma pergunta aparece uma vez por diagnóstico: agrega por dimensão + texto.
  const grouped = new Map<string, QuestionResult[]>();

  questions.forEach((question) => {
    const key = `${question.dimension}::${question.questionTitle}`;
    grouped.set(key, [...(grouped.get(key) ?? []), question]);
  });

  return Array.from(grouped.values())
    .map((items) => {
      const first = items[0];
      const gaps = items
        .map((item) => item.layerGap)
        .filter((value): value is number => value !== null);

      return {
        questionId: first.questionId,
        question: first.questionTitle,
        dimension: first.dimension,
        score: round(average(items.map((item) => item.score))),
        progress:
          impact.levers.find((lever) => lever.dimension === first.dimension)?.progress ?? null,
        layerGap: gaps.length > 0 ? round(average(gaps)) : null,
      };
    })
    .sort(
      (first, second) =>
        first.score - second.score || (second.layerGap ?? 0) - (first.layerGap ?? 0),
    );
}

export function buildAnalyticsOverview({
  analytics,
  comparison,
  processUsage,
  illustrativeImpact = false,
}: {
  illustrativeImpact?: boolean;
  analytics: OverviewAnalytics;
  comparison: OverviewHistoricalComparison | null;
  processUsage: ProcessUsageAnalytics | null;
}): AnalyticsOverview {
  const impact: OmdxImpactExample = illustrativeImpact
    ? buildOmdxImpactExample(analytics.dimensions, analytics.questions)
    : { updatedLabel: "Sem medição de impacto", levers: [], estimateByDimension: new Map(), estimateByQuestion: new Map(), general: null,
        actionPoints: { onTrack: 0, total: 0 }, actionProgress: 0, treatedDelta: null, untreatedDelta: 0, trend: [], milestones: [] };
  const realPriorities: LeverImpact[] = [...analytics.dimensions]
    .sort((a, b) => calculateDimensionCriticality(b) - calculateDimensionCriticality(a))
    .slice(0, 3).map((dimension, index) => ({
      rank: index + 1, dimension: dimension.dimension, shortDimension: dimension.shortDimension, score: dimension.maturity,
      assetName: "Vínculo ainda não aferido", execution: { percent: 0, health: "aguardando" }, assetUsage: null,
      assetsCreated: 0, progress: null, estimate: null, confidence: null, conversations: 0, quadrant: "sem_acao",
    }));
  const treated = new Set(impact.levers.map((lever) => lever.dimension));
  const previousByDimension = new Map(
    (comparison?.historicalAnalytics.dimensions ?? []).map((item) => [item.dimension, item.maturity]),
  );
  const questionRows = buildQuestionRows(analytics.questions, impact);

  const priorityByDimension = new Map(
    analytics.leverageRows.map((row) => [
      row.dimension,
      row.cells.find((cell) => cell.label === "Prioridade")?.level ?? "Sem dados",
    ]),
  );

  const leverPoints: AnalyticsLeverPoint[] = impact.levers.map((lever) => {
    const progress = lever.progress ?? 0;
    return {
      dimension: lever.dimension,
      shortDimension: lever.shortDimension,
      execution: lever.execution.percent,
      progress,
      hasSignal: lever.progress !== null,
      quadrant: classifyQuadrant(lever.execution.percent, progress),
    };
  });

  return {
    verdict: buildVerdict(analytics, comparison, processUsage, impact),
    leverPoints,
    impact,
    levers: (illustrativeImpact ? impact.levers : realPriorities).map((lever) => ({
      ...lever,
      measured: illustrativeImpact,
      priority: priorityByDimension.get(lever.shortDimension) ?? "Sem dados",
    })),
    dimensions: [...analytics.dimensions]
      .sort((first, second) => first.maturity - second.maturity)
      .map((dimension) => ({
        dimension: dimension.dimension,
        shortDimension: dimension.shortDimension,
        score: dimension.maturity,
        previous: previousByDimension.get(dimension.dimension) ?? null,
        progress: impact.levers.find((lever) => lever.dimension === dimension.dimension)?.progress ?? null,
        treated: treated.has(dimension.dimension),
      })),
    layers: [...analytics.dimensions]
      .sort(
        (first, second) =>
          calculateDimensionCriticality(second) - calculateDimensionCriticality(first),
      )
      .map((dimension) => {
        const gap = layerGap(dimension);

        return {
          dimension: dimension.dimension,
          shortDimension: dimension.shortDimension,
          scores: {
            diretoria: dimension.diretoria,
            lideranca: dimension.lideranca,
            time: dimension.time,
          },
          gap,
          diverges: gap !== null && gap >= gapCutoff,
        };
      }),
    questions: questionRows.slice(0, ANALYTICS_TOP_QUESTIONS),
    questionTotal: questionRows.length,
  };
}
