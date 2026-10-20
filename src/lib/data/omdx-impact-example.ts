// Dados ilustrativos (frontend-only) do impacto das ações no Analytics.
// Determinístico, sem Math.random e sem leitura de dados reais.
//
// Partem das notas reais da coleta e acrescentam o que ainda não existe no
// backend: o vínculo alavanca ↔ ativo, a execução dos action points e a nota
// estimada pelo agente entre coletas, a partir das conversas no Slack. A
// execução reaproveita a demonstração da página Action Points para que as duas
// telas contem a mesma história. Ver docs/analytics-impacto.md.

import {
  buildActionPointsAdherenceExample,
  rollupHealth,
  type AdherenceHealth,
} from "@/lib/data/action-points-adherence-example";
import {
  calculateDimensionCriticality,
  type DimensionResult,
  type QuestionResult,
} from "@/lib/data/omdx-overview-analytics";

export type ImpactConfidence = "alta" | "media" | "baixa";

export type ImpactQuadrant = "funcionando" | "sem_efeito" | "sem_acao" | "parado";

export type LeverImpact = {
  rank: number;
  dimension: string;
  shortDimension: string;
  // Nota real da coleta.
  score: number;
  assetName: string;
  execution: {
    percent: number;
    health: AdherenceHealth;
  };
  // Percentual de uso do ativo vinculado; null quando ainda não há ativo publicado.
  assetUsage: number | null;
  // Ativos de gestão publicados para a alavanca.
  assetsCreated: number;
  // Avanço da nota pelas ações, ponderado pela aderência; null sem ativo ou sem sinal.
  progress: number | null;
  // Nota estimada pelo agente; null quando o sinal ainda é insuficiente.
  estimate: number | null;
  confidence: ImpactConfidence | null;
  conversations: number;
  quadrant: ImpactQuadrant;
};

export type ImpactTrendPoint = {
  label: string;
  kind: "coleta" | "estimativa";
  treated: number;
  untreated: number;
  // Faixa de confiança da estimativa das perguntas tratadas.
  treatedLow: number;
  treatedHigh: number;
};

export type ImpactMilestone = {
  label: string;
  // Posição contínua entre os pontos da série (0 = coleta).
  position: number;
};

export type OmdxImpactExample = {
  updatedLabel: string;
  levers: LeverImpact[];
  estimateByDimension: Map<string, number>;
  estimateByQuestion: Map<string, number>;
  general: { estimate: number; confidence: ImpactConfidence } | null;
  // Action points da demonstração: em dia (saúde consistente) sobre o total.
  actionPoints: { onTrack: number; total: number };
  // Avanço plotado da maturidade geral pelos action points, antes de ponderar a adoção.
  actionProgress: number;
  treatedDelta: number | null;
  untreatedDelta: number;
  trend: ImpactTrendPoint[];
  milestones: ImpactMilestone[];
};

const UNTREATED_DELTA = 0.1;

const ACTION_PROGRESS = 0.3;

// Ativo de gestão que sustenta cada dimensão, pelos ids da demonstração de Action Points.
const assetByDimension: Record<string, string> = {
  Comunicação: "ativo-rotina-comunicacao",
  Processos: "ativo-sops",
  Performance: "ativo-gerenciador-weekly",
  Liderança: "ativo-plano-desenvolvimento",
  Cultura: "ativo-papeis",
  Visão: "ativo-matriz-slas",
};

// Leitura plotada por posição na fila de prioridade: a primeira alavanca reage,
// a segunda executa sem efeito e a terceira ainda não tem sinal.
const plottedByRank = [
  { delta: 0.8, assetUsage: 71, assetsCreated: 4, confidence: "alta", conversations: 14 },
  { delta: 0.1, assetUsage: 64, assetsCreated: 2, confidence: "baixa", conversations: 4 },
  { delta: null, assetUsage: null, assetsCreated: 0, confidence: null, conversations: 2 },
] as const;

const TREATED_COUNT = plottedByRank.length;


function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function clampScore(value: number) {
  return Math.min(5, Math.max(1, value));
}

function average(values: number[]) {
  return values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;
}

// Execução em % pela saúde de cada action point: consistente conta inteiro,
// atenção conta parcial e os parados quase nada.
const executionWeight: Record<AdherenceHealth, number> = {
  consistente: 100,
  atencao: 60,
  aguardando: 20,
  risco: 10,
  parado: 0,
};

function executionPercent(healths: AdherenceHealth[]) {
  return healths.length === 0
    ? 0
    : Math.round(average(healths.map((health) => executionWeight[health])));
}

export function classifyQuadrant(executionScore: number, delta: number): ImpactQuadrant {
  const executed = executionScore >= 50;
  const improved = delta >= 0.3;

  if (executed && improved) return "funcionando";
  if (executed) return "sem_efeito";
  if (improved) return "sem_acao";
  return "parado";
}

export function buildOmdxImpactExample(
  dimensions: DimensionResult[],
  questions: QuestionResult[],
): OmdxImpactExample {
  const board = buildActionPointsAdherenceExample();
  const categoriesById = new Map(board.categories.map((category) => [category.id, category]));
  const ranked = [...dimensions].sort(
    (first, second) =>
      calculateDimensionCriticality(second) - calculateDimensionCriticality(first),
  );

  const levers: LeverImpact[] = ranked.slice(0, TREATED_COUNT).map((dimension, index) => {
    const plotted = plottedByRank[index];
    const category = categoriesById.get(assetByDimension[dimension.shortDimension] ?? "");
    const actionPoints = category?.actionPoints ?? [];
    const percent = executionPercent(actionPoints.map((actionPoint) => actionPoint.health));
    const health = rollupHealth(actionPoints);
    const estimate =
      plotted.delta === null ? null : round(clampScore(dimension.maturity + plotted.delta));
    const executionScore = (percent + (plotted.assetUsage ?? 0)) / 2;

    return {
      rank: index + 1,
      dimension: dimension.dimension,
      shortDimension: dimension.shortDimension,
      score: dimension.maturity,
      // Sem uso plotado, a alavanca só tem action points: o ativo ainda não foi publicado.
      assetName:
        plotted.assetUsage === null
          ? "Sem ativo publicado"
          : (category?.name ?? "Sem ativo publicado"),
      execution: { percent, health },
      assetUsage: plotted.assetUsage,
      assetsCreated: plotted.assetsCreated,
      // Mesma regra do veredito: a aderência condiciona o avanço das ações.
      progress:
        plotted.delta === null || plotted.assetUsage === null
          ? null
          : round(Math.min(5 - dimension.maturity, plotted.delta * (plotted.assetUsage / 100))),
      estimate,
      confidence: plotted.confidence,
      conversations: plotted.conversations,
      quadrant: classifyQuadrant(executionScore, plotted.delta ?? 0),
    };
  });

  const deltaByDimension = new Map<string, number>();
  ranked.forEach((dimension, index) => {
    if (index < TREATED_COUNT) {
      const delta: number | null = plottedByRank[index].delta;
      if (delta !== null) deltaByDimension.set(dimension.dimension, delta);
      return;
    }
    deltaByDimension.set(dimension.dimension, UNTREATED_DELTA);
  });

  const estimateByDimension = new Map<string, number>();
  deltaByDimension.forEach((delta, dimension) => {
    const result = dimensions.find((item) => item.dimension === dimension);
    if (result) estimateByDimension.set(dimension, round(clampScore(result.maturity + delta)));
  });

  const treatedNames = new Set(levers.map((lever) => lever.dimension));
  const estimateByQuestion = new Map<string, number>();
  questions.forEach((question) => {
    const delta = deltaByDimension.get(question.dimension);
    // Perguntas tratadas reagem um pouco mais que a média da dimensão.
    if (delta === undefined || !treatedNames.has(question.dimension)) return;
    estimateByQuestion.set(question.questionId, round(clampScore(question.score + delta * 1.2)));
  });

  const treatedDeltas = levers.flatMap((lever, index) => {
    const delta: number | null = plottedByRank[index].delta;
    return lever.estimate === null || delta === null ? [] : [delta];
  });
  const treatedDelta = treatedDeltas.length > 0 ? round(average(treatedDeltas)) : null;

  const general =
    dimensions.length === 0
      ? null
      : {
          estimate: round(
            average(
              dimensions.map(
                (dimension) =>
                  estimateByDimension.get(dimension.dimension) ?? dimension.maturity,
              ),
            ),
          ),
          confidence: "media" as const,
        };

  const treatedBase = average(
    levers.filter((lever) => lever.estimate !== null).map((lever) => lever.score),
  );
  const untreatedBase = average(
    ranked.slice(TREATED_COUNT).map((dimension) => dimension.maturity),
  );
  const steps = [
    { label: "Coleta", share: 0, untreatedShare: 0, band: 0 },
    { label: "30 dias", share: 0.15, untreatedShare: 0.3, band: 0.35 },
    { label: "60 dias", share: 0.55, untreatedShare: 0.6, band: 0.3 },
    { label: "90 dias", share: 1, untreatedShare: 1, band: 0.25 },
  ];
  const trend: ImpactTrendPoint[] =
    dimensions.length === 0 || treatedDelta === null
      ? []
      : steps.map((step, index) => {
          const treated = round(clampScore(treatedBase + treatedDelta * step.share), 2);

          return {
            label: step.label,
            kind: index === 0 ? "coleta" : "estimativa",
            treated,
            untreated: round(clampScore(untreatedBase + UNTREATED_DELTA * step.untreatedShare), 2),
            treatedLow: round(clampScore(treated - step.band), 2),
            treatedHigh: round(clampScore(treated + step.band), 2),
          };
        });

  const allActionPoints = board.categories.flatMap((category) => category.actionPoints);

  return {
    updatedLabel: "estimativa de 13/10",
    levers,
    estimateByDimension,
    estimateByQuestion,
    general,
    actionPoints: {
      onTrack: allActionPoints.filter((actionPoint) => actionPoint.health === "consistente").length,
      total: allActionPoints.length,
    },
    actionProgress: ACTION_PROGRESS,
    treatedDelta,
    untreatedDelta: UNTREATED_DELTA,
    trend,
    milestones: [
      { label: "SOP publicado", position: 1.5 },
      { label: "Action point concluído", position: 2.6 },
    ],
  };
}
