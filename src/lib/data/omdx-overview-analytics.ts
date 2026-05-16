import {
  canGenerateDiagnosticReport,
  getDiagnostics,
  getDiagnosticReport,
  getLatestReportableDiagnostic,
} from "@/lib/data/omdx-data-source";
import type { Diagnostic } from "@/lib/types";

export type LikertDistribution = {
  stronglyDisagree: number;
  disagree: number;
  neutral: number;
  agree: number;
  stronglyAgree: number;
};

export type DimensionResult = {
  dimension: string;
  maturity: number;
  diretoria: number;
  lideranca: number;
  time: number;
  dispersion: number;
  criticalPercentage: number;
  positivePercentage: number;
  neutralPercentage: number;
  likertDistribution: LikertDistribution;
};

export type QuestionResult = {
  questionId: string;
  questionTitle: string;
  dimension: string;
  score: number;
  criticalPercentage: number;
  positivePercentage: number;
  neutralPercentage: number;
};

export type ExecutiveMetricStatus =
  | "Crítico"
  | "Atenção"
  | "Inconsistente"
  | "Consistente";

export type ExecutiveMetric = {
  title: string;
  value: string;
  suffix?: string;
  classification: ExecutiveMetricStatus;
  description: string;
  technicalDetail: string;
};

export type MaturityQuadrant = {
  name: string;
  reading: string;
};

export type OverviewAnalytics = {
  dimensions: DimensionResult[];
  questions: QuestionResult[];
  metrics: ExecutiveMetric[];
};

type Report = NonNullable<ReturnType<typeof getDiagnosticReport>>;

const maturityCutoff = 3.5;
const gapCutoff = 1.2;

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function round(value: number, precision = 0) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function distributePercentages(
  score: number,
  criticalPercentage: number,
  neutralPercentage: number,
): LikertDistribution {
  const positivePercentage = Math.max(
    0,
    100 - criticalPercentage - neutralPercentage,
  );
  const stronglyDisagree = Math.round(
    criticalPercentage * (score <= 2.7 ? 0.46 : 0.3),
  );
  const disagree = criticalPercentage - stronglyDisagree;
  const stronglyAgree = Math.round(
    positivePercentage * (score >= 4 ? 0.42 : 0.24),
  );
  const agree = positivePercentage - stronglyAgree;

  return {
    stronglyDisagree,
    disagree,
    neutral: neutralPercentage,
    agree,
    stronglyAgree,
  };
}

function inferCriticalPercentage(score: number, dispersion: number, gap: number) {
  return clamp(
    Math.round((5 - score) * 11 + dispersion * 9 + gap * 6),
    4,
    78,
  );
}

function inferNeutralPercentage(score: number, dispersion: number) {
  return clamp(Math.round(16 + dispersion * 7 - Math.abs(score - 3) * 3), 8, 34);
}

function toQuestionTitle(question: string) {
  return question
    .replace(/^A empresa\s+/i, "")
    .replace(/^Existe\s+/i, "")
    .replace(/^As pessoas\s+/i, "")
    .replace(/\.$/, "");
}

export function calculateDimensionGap(dimension: DimensionResult) {
  return Math.max(dimension.diretoria, dimension.lideranca, dimension.time) -
    Math.min(dimension.diretoria, dimension.lideranca, dimension.time);
}

export function calculateAverageGap(dimensions: DimensionResult[]) {
  return round(average(dimensions.map(calculateDimensionGap)), 1);
}

export function normalizeCriticality(rawCriticality: number) {
  return clamp(Math.round((rawCriticality / 16) * 100), 0, 100);
}

export function normalizeLikertToIndex(value: number): number {
  return clamp(Math.round((value / 5) * 100), 0, 100);
}

export function normalizeGapToIndex(gap: number): number {
  return clamp(Math.round((gap / 5) * 100), 0, 100);
}

export function formatIndex(value: number): string {
  return String(clamp(Math.round(value), 0, 100));
}

export function calculateDimensionCriticality(dimension: DimensionResult) {
  const criticalPercentageNormalized = dimension.criticalPercentage / 100;
  const rawCriticality =
    5 -
    dimension.maturity +
    calculateDimensionGap(dimension) +
    dimension.dispersion +
    criticalPercentageNormalized;

  return normalizeCriticality(rawCriticality);
}

export function classifyCriticality(criticality: number) {
  if (criticality <= 25) return "Baixa";
  if (criticality <= 50) return "Moderada";
  if (criticality <= 75) return "Alta";
  return "Crítica";
}

export function classifyMaturityIndex(value: number): ExecutiveMetricStatus {
  if (value <= 40) return "Crítico";
  if (value <= 60) return "Inconsistente";
  if (value <= 80) return "Atenção";
  return "Consistente";
}

export function classifyCriticalityIndex(value: number): ExecutiveMetricStatus {
  if (value <= 25) return "Consistente";
  if (value <= 50) return "Atenção";
  if (value <= 75) return "Inconsistente";
  return "Crítico";
}

export function classifyMisalignmentIndex(value: number): ExecutiveMetricStatus {
  if (value <= 10) return "Consistente";
  if (value <= 24) return "Atenção";
  if (value <= 50) return "Inconsistente";
  return "Crítico";
}

export function classifyConsensusIndex(value: number): ExecutiveMetricStatus {
  if (value >= 80) return "Consistente";
  if (value >= 60) return "Atenção";
  if (value >= 40) return "Inconsistente";
  return "Crítico";
}

export function getCriticalityReading(classification: string) {
  if (classification === "Baixa") {
    return "Baixa prioridade de intervenção no momento.";
  }
  if (classification === "Moderada") {
    return "Monitorar e corrigir pontos específicos.";
  }
  if (classification === "Alta") return "Requer intervenção estruturada.";
  return "Prioridade máxima de intervenção operacional.";
}

export function classifyMaturity(score: number) {
  if (score <= 2) return "Operação frágil";
  if (score <= 3) return "Operação instável";
  if (score <= 4) return "Operação em estruturação";
  return "Operação madura";
}

export function classifyAlignment(gap: number) {
  if (gap <= 0.5) return "Alto alinhamento";
  if (gap <= 1.2) return "Atenção";
  return "Baixo alinhamento";
}

export function calculateConsensus(dimensions: DimensionResult[]) {
  const averageDispersion = average(
    dimensions.map((dimension) => dimension.dispersion),
  );

  return clamp(Math.round(100 - (averageDispersion / 5) * 100), 0, 100);
}

export function classifyConsensus(consensus: number) {
  if (consensus >= 80) return "Consenso forte";
  if (consensus >= 60) return "Consenso moderado";
  if (consensus >= 40) return "Percepção fragmentada";
  return "Alta divergência interna";
}

export function identifyMaturityQuadrant(
  maturity: number,
  gap: number,
): MaturityQuadrant {
  if (maturity >= maturityCutoff && gap <= gapCutoff) {
    return {
      name: "Maduro e alinhado",
      reading: "Manter e proteger",
    };
  }
  if (maturity >= maturityCutoff && gap > gapCutoff) {
    return {
      name: "Maduro, mas desalinhado",
      reading: "Investigar diferenças de percepção",
    };
  }
  if (maturity < maturityCutoff && gap <= gapCutoff) {
    return {
      name: "Imaturo, mas alinhado",
      reading: "Fragilidade reconhecida",
    };
  }
  return {
    name: "Imaturo e desalinhado",
    reading: "Prioridade crítica",
  };
}

export function getBottleneckReading(question: QuestionResult) {
  if (question.criticalPercentage >= 60) {
    return "Há sinal forte de fricção operacional percebida pelo grupo.";
  }
  if (question.criticalPercentage >= 45) {
    return "O tema exige correção estruturada no próximo ciclo.";
  }
  return "O tema merece acompanhamento para não virar gargalo recorrente.";
}

export function getDistributionReading(dimension: DimensionResult) {
  if (dimension.positivePercentage >= 70) return "Consenso positivo";
  if (dimension.criticalPercentage >= 45) return "Consenso crítico";
  if (dimension.neutralPercentage >= 30) return "Alta neutralidade";

  const negative =
    dimension.likertDistribution.stronglyDisagree +
    dimension.likertDistribution.disagree;
  const positive =
    dimension.likertDistribution.agree +
    dimension.likertDistribution.stronglyAgree;

  if (Math.min(negative, positive) >= 28) return "Percepção polarizada";
  return "Distribuição equilibrada";
}

function buildMetrics(dimensions: DimensionResult[]): ExecutiveMetric[] {
  const maturity = round(average(dimensions.map((item) => item.maturity)), 1);
  const maturityIndex = normalizeLikertToIndex(maturity);
  const averageGap = calculateAverageGap(dimensions);
  const misalignmentIndex = normalizeGapToIndex(averageGap);
  const consensus = calculateConsensus(dimensions);
  const criticality = Math.round(
    average(dimensions.map(calculateDimensionCriticality)),
  );

  // Cards use normalized 0-100 executive indices for comparison.
  // Original Likert/gap values remain the calculation base.
  // Higher is better for maturity/consensus and worse for criticality/misalignment.
  return [
    {
      title: "Maturidade Geral",
      value: formatIndex(maturityIndex),
      suffix: "/100",
      classification: classifyMaturityIndex(maturityIndex),
      description: "Índice normalizado da maturidade média da operação.",
      technicalDetail: `Baseado em média Likert original de 0 a 5. Valor original: ${numberFormatter.format(maturity)}/5.`,
    },
    {
      title: "Criticidade Operacional",
      value: formatIndex(criticality),
      suffix: "/100",
      classification: classifyCriticalityIndex(criticality),
      description:
        "Índice composto de risco operacional com base em maturidade, desalinhamento, dispersão e respostas críticas.",
      technicalDetail:
        "Combina baixa maturidade, gap entre grupos, dispersão e percentual de respostas críticas.",
    },
    {
      title: "Desalinhamento Organizacional",
      value: formatIndex(misalignmentIndex),
      suffix: "/100",
      classification: classifyMisalignmentIndex(misalignmentIndex),
      description:
        "Índice normalizado da diferença de percepção entre diretoria, liderança e time.",
      technicalDetail: `Baseado no gap médio original entre grupos. Valor original: ${numberFormatter.format(averageGap)}/5.`,
    },
    {
      title: "Consenso Interno",
      value: formatIndex(consensus),
      suffix: "/100",
      classification: classifyConsensusIndex(consensus),
      description: "Percentual estimado de concentração das respostas na pesquisa.",
      technicalDetail:
        "Baseado na dispersão das respostas. Baixa dispersão indica maior consenso.",
    },
  ];
}

function buildDimensionResult(
  dimension: Report["dimensions"][number],
): DimensionResult {
    const gap = dimension.misalignment.value;
    const criticalPercentage = inferCriticalPercentage(
      dimension.score,
      dimension.variance,
      gap,
    );
    const neutralPercentage = inferNeutralPercentage(
      dimension.score,
      dimension.variance,
    );
    const likertDistribution = distributePercentages(
      dimension.score,
      criticalPercentage,
      neutralPercentage,
    );

    return {
      dimension: dimension.name,
      maturity: dimension.score,
      diretoria: dimension.layerScores.fundador,
      lideranca: dimension.layerScores.lideranca,
      time: dimension.layerScores.operacao,
      dispersion: dimension.variance,
      criticalPercentage,
      positivePercentage:
        likertDistribution.agree + likertDistribution.stronglyAgree,
      neutralPercentage: likertDistribution.neutral,
      likertDistribution,
    };
}

function buildQuestionResult(
  dimension: Report["dimensions"][number],
  question: Report["dimensions"][number]["questions"][number],
): QuestionResult {
  const gap =
    Math.max(
      question.layerScores.fundador,
      question.layerScores.lideranca,
      question.layerScores.operacao,
    ) -
    Math.min(
      question.layerScores.fundador,
      question.layerScores.lideranca,
      question.layerScores.operacao,
    );
  const criticalPercentage = inferCriticalPercentage(
    question.score,
    question.variance,
    gap,
  );
  const neutralPercentage = inferNeutralPercentage(
    question.score,
    question.variance,
  );

  return {
    questionId: question.id,
    questionTitle: toQuestionTitle(question.text),
    dimension: dimension.name,
    score: question.score,
    criticalPercentage,
    positivePercentage: 100 - criticalPercentage - neutralPercentage,
    neutralPercentage,
  };
}

function averageDistribution(distributions: LikertDistribution[]) {
  const result = {
    stronglyDisagree: Math.round(
      average(distributions.map((item) => item.stronglyDisagree)),
    ),
    disagree: Math.round(average(distributions.map((item) => item.disagree))),
    neutral: Math.round(average(distributions.map((item) => item.neutral))),
    agree: Math.round(average(distributions.map((item) => item.agree))),
    stronglyAgree: Math.round(
      average(distributions.map((item) => item.stronglyAgree)),
    ),
  };
  const total = Object.values(result).reduce((acc, value) => acc + value, 0);

  if (total !== 100) {
    result.agree += 100 - total;
  }

  return result;
}

function aggregateDimensions(dimensions: DimensionResult[]) {
  const grouped = new Map<string, DimensionResult[]>();

  dimensions.forEach((dimension) => {
    grouped.set(dimension.dimension, [
      ...(grouped.get(dimension.dimension) ?? []),
      dimension,
    ]);
  });

  return Array.from(grouped.entries()).map(([dimension, values]) => {
    const likertDistribution = averageDistribution(
      values.map((value) => value.likertDistribution),
    );

    return {
      dimension,
      maturity: round(average(values.map((value) => value.maturity)), 1),
      diretoria: round(average(values.map((value) => value.diretoria)), 1),
      lideranca: round(average(values.map((value) => value.lideranca)), 1),
      time: round(average(values.map((value) => value.time)), 1),
      dispersion: round(average(values.map((value) => value.dispersion)), 2),
      criticalPercentage: Math.round(
        average(values.map((value) => value.criticalPercentage)),
      ),
      positivePercentage:
        likertDistribution.agree + likertDistribution.stronglyAgree,
      neutralPercentage: likertDistribution.neutral,
      likertDistribution,
    };
  });
}

function buildAnalyticsFromReports(reports: Report[]): OverviewAnalytics {
  if (reports.length === 0) {
    return {
      dimensions: [],
      questions: [],
      metrics: [],
    };
  }

  const dimensions = aggregateDimensions(
    reports.flatMap((report) => report.dimensions.map(buildDimensionResult)),
  );
  const questions = reports.flatMap((report) =>
    report.dimensions.flatMap((dimension) =>
      dimension.questions.map((question) =>
        buildQuestionResult(dimension, question),
      ),
    ),
  );

  return {
    dimensions,
    questions,
    metrics: buildMetrics(dimensions),
  };
}

export function getOmdxOverviewDiagnosticOptions(): Diagnostic[] {
  return getDiagnostics().filter(canGenerateDiagnosticReport);
}

export function getOmdxOverviewAnalytics(
  selectedDiagnostic = "todos",
): OverviewAnalytics {
  const reportableDiagnostics = getOmdxOverviewDiagnosticOptions();

  if (selectedDiagnostic !== "todos") {
    const report = getDiagnosticReport(selectedDiagnostic);

    return buildAnalyticsFromReports(report ? [report] : []);
  }

  const reports = reportableDiagnostics
    .map((diagnostic) => getDiagnosticReport(diagnostic.id))
    .filter((report): report is Report => Boolean(report));

  if (reports.length > 0) return buildAnalyticsFromReports(reports);

  const latestDiagnostic = getLatestReportableDiagnostic();
  const latestReport = latestDiagnostic
    ? getDiagnosticReport(latestDiagnostic.id)
    : undefined;

  return buildAnalyticsFromReports(latestReport ? [latestReport] : []);
}
