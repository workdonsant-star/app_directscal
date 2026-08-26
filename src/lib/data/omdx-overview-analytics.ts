import { classifyScore } from "@/lib/data/omdx-domain";
import type { Classification, DiagnosticReport } from "@/lib/types";

export type LikertDistribution = {
  stronglyDisagree: number;
  disagree: number;
  neutral: number;
  agree: number;
  stronglyAgree: number;
};

export type DimensionResult = {
  dimension: string;
  shortDimension: string;
  maturity: number;
  diretoria: number | null;
  lideranca: number | null;
  time: number | null;
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

export type LayerScoreResult = {
  id: "fundador" | "lideranca" | "operacao";
  label: "Fundador" | "Liderança" | "Time";
  score: number | null;
};

export type VulnerabilityMatrixCell = {
  classification: Classification;
  label: string;
  question: string;
  score: number;
};

export type VulnerabilityMatrixRow = {
  cells: VulnerabilityMatrixCell[];
  dimension: string;
  shortDimension: string;
};

export type LeverageLevel = "Baixa" | "Média" | "Alta" | "Crítica";

export type LeverageMatrixCell = {
  label: "Maturidade" | "Alinhamento" | "Consenso" | "Prioridade";
  level: LeverageLevel | "Sem dados";
  value: number | null;
};

export type LeverageMatrixRow = {
  cells: LeverageMatrixCell[];
  dimension: string;
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
  classification: ExecutiveMetricStatus | "Sem dados";
  description: string;
  technicalDetail: string;
};

export type LatestVsPreviousComparison = {
  latest: number;
  percentage: number;
  previousAverage: number;
};

export type MaturityQuadrant = {
  name: string;
  reading: string;
};

export type OverviewAnalytics = {
  dimensions: DimensionResult[];
  dimensionSummary: string;
  leverageRows: LeverageMatrixRow[];
  layerScores: LayerScoreResult[];
  layerSummary: string;
  questions: QuestionResult[];
  metrics: ExecutiveMetric[];
  vulnerabilityRows: VulnerabilityMatrixRow[];
};

export type OverviewHistoricalComparison = {
  currentDiagnosticId: string;
  currentDiagnosticName: string;
  currentDiagnosticDate: string;
  historicalAnalytics: OverviewAnalytics;
  historicalDiagnosticCount: number;
  referenceLabel: string;
};

export type OverviewComparisonResult = {
  analytics: OverviewAnalytics;
  comparison: OverviewHistoricalComparison | null;
  reportDiagnostic: DiagnosticReport["diagnostic"] | undefined;
};

type Report = DiagnosticReport;

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

function numericValues(values: Array<number | null>) {
  return values.filter((value): value is number => value !== null);
}

function averageOrNull(values: Array<number | null>) {
  const numbers = numericValues(values);

  return numbers.length > 0 ? average(numbers) : null;
}

function roundOrNull(value: number | null, precision = 0) {
  return value === null ? null : round(value, precision);
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

function inferCriticalPercentage(
  score: number,
  dispersion: number,
  gap: number | null,
) {
  return clamp(
    Math.round((5 - score) * 11 + dispersion * 9 + (gap ?? 0) * 6),
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
  const scores = numericValues([
    dimension.diretoria,
    dimension.lideranca,
    dimension.time,
  ]);

  if (scores.length < 2) return null;

  return Math.max(...scores) - Math.min(...scores);
}

export function calculateAverageGap(dimensions: DimensionResult[]) {
  const gaps = numericValues(dimensions.map(calculateDimensionGap));

  return gaps.length > 0 ? round(average(gaps), 1) : null;
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

export function calculateLatestVsPreviousComparison(
  points: Array<{ createdAt: string; value: number }>,
): LatestVsPreviousComparison | null {
  if (points.length < 2) return null;

  const orderedPoints = [...points].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
  const latest = orderedPoints.at(-1)?.value;
  const previousValues = orderedPoints.slice(0, -1).map((point) => point.value);
  const previousAverage = average(previousValues);

  if (latest === undefined || previousAverage === 0) return null;

  return {
    latest,
    previousAverage,
    percentage: round(((latest - previousAverage) / previousAverage) * 100, 1),
  };
}

export function formatIndex(value: number): string {
  return String(clamp(Math.round(value), 0, 100));
}

export function calculateDimensionCriticality(dimension: DimensionResult) {
  const gap = calculateDimensionGap(dimension);
  const criticalPercentageNormalized = dimension.criticalPercentage / 100;
  const rawCriticality =
    5 -
    dimension.maturity +
    (gap ?? 0) +
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
  const misalignmentIndex =
    averageGap === null ? null : normalizeGapToIndex(averageGap);
  const consensus = calculateConsensus(dimensions);
  const criticality =
    averageGap === null
      ? null
      : Math.round(average(dimensions.map(calculateDimensionCriticality)));

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
      value: criticality === null ? "—" : formatIndex(criticality),
      suffix: criticality === null ? undefined : "/100",
      classification:
        criticality === null ? "Sem dados" : classifyCriticalityIndex(criticality),
      description:
        "Índice composto de risco operacional com base em maturidade, desalinhamento, dispersão e respostas críticas.",
      technicalDetail:
        criticality === null
          ? "Depende de comparação entre pelo menos duas camadas com base de respostas."
          : "Combina baixa maturidade, gap entre grupos, dispersão e percentual de respostas críticas.",
    },
    {
      title: "Desalinhamento Organizacional",
      value: misalignmentIndex === null ? "—" : formatIndex(misalignmentIndex),
      suffix: misalignmentIndex === null ? undefined : "/100",
      classification:
        misalignmentIndex === null
          ? "Sem dados"
          : classifyMisalignmentIndex(misalignmentIndex),
      description:
        "Índice normalizado da diferença de percepção entre diretoria, liderança e time.",
      technicalDetail:
        averageGap === null
          ? "Depende de pelo menos duas camadas com respostas para comparar percepção."
          : `Baseado no gap médio original entre grupos. Valor original: ${numberFormatter.format(averageGap)}/5.`,
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
  const gap = dimension.misalignment?.value ?? null;
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
    shortDimension: dimension.shortName,
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
  const scores = numericValues([
    question.layerScores.fundador,
    question.layerScores.lideranca,
    question.layerScores.operacao,
  ]);
  const gap =
    scores.length < 2 ? null : Math.max(...scores) - Math.min(...scores);
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
      shortDimension: values[0]?.shortDimension ?? dimension,
      maturity: round(average(values.map((value) => value.maturity)), 1),
      diretoria: roundOrNull(
        averageOrNull(values.map((value) => value.diretoria)),
        1,
      ),
      lideranca: roundOrNull(
        averageOrNull(values.map((value) => value.lideranca)),
        1,
      ),
      time: roundOrNull(averageOrNull(values.map((value) => value.time)), 1),
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

function buildLayerScores(dimensions: DimensionResult[]): LayerScoreResult[] {
  return [
    {
      id: "fundador",
      label: "Fundador",
      score: roundOrNull(
        averageOrNull(dimensions.map((dimension) => dimension.diretoria)),
        1,
      ),
    },
    {
      id: "lideranca",
      label: "Liderança",
      score: roundOrNull(
        averageOrNull(dimensions.map((dimension) => dimension.lideranca)),
        1,
      ),
    },
    {
      id: "operacao",
      label: "Time",
      score: roundOrNull(
        averageOrNull(dimensions.map((dimension) => dimension.time)),
        1,
      ),
    },
  ];
}

function buildVulnerabilityRows(
  dimensions: DimensionResult[],
  questions: QuestionResult[],
): VulnerabilityMatrixRow[] {
  const questionsByDimension = new Map<string, Map<string, QuestionResult[]>>();

  questions.forEach((question) => {
    const groupedQuestions =
      questionsByDimension.get(question.dimension) ??
      new Map<string, QuestionResult[]>();
    groupedQuestions.set(question.questionTitle, [
      ...(groupedQuestions.get(question.questionTitle) ?? []),
      question,
    ]);
    questionsByDimension.set(question.dimension, groupedQuestions);
  });

  return [...dimensions]
    .sort(
      (first, second) =>
        calculateDimensionCriticality(second) -
        calculateDimensionCriticality(first),
    )
    .map((dimension) => {
      const groupedQuestions = questionsByDimension.get(dimension.dimension);
      const cells = Array.from(groupedQuestions?.entries() ?? [])
        .slice(0, 5)
        .map(([question, values], index) => {
          const score = round(
            average(values.map((value) => value.score)),
            1,
          );

          return {
            classification: classifyScore(score),
            label: `P${index + 1}`,
            question,
            score,
          };
        });

      return {
        cells,
        dimension: dimension.dimension,
        shortDimension: dimension.shortDimension,
      };
    });
}

function classifyLeverageLevel(value: number): LeverageLevel {
  if (value < 20) return "Baixa";
  if (value < 45) return "Média";
  if (value < 70) return "Alta";
  return "Crítica";
}

function buildLeverageRows(
  dimensions: DimensionResult[],
): LeverageMatrixRow[] {
  return [...dimensions]
    .sort(
      (first, second) =>
        calculateDimensionCriticality(second) -
        calculateDimensionCriticality(first),
    )
    .slice(0, 4)
    .map((dimension) => {
      const gap = calculateDimensionGap(dimension);
      const values: Array<{
        label: LeverageMatrixCell["label"];
        value: number | null;
      }> = [
        {
          label: "Maturidade",
          value: 100 - normalizeLikertToIndex(dimension.maturity),
        },
        {
          label: "Alinhamento",
          value: gap === null ? null : normalizeGapToIndex(gap),
        },
        {
          label: "Consenso",
          value: clamp(Math.round((dimension.dispersion / 5) * 100), 0, 100),
        },
        {
          label: "Prioridade",
          value: calculateDimensionCriticality(dimension),
        },
      ];

      return {
        cells: values.map(({ label, value }) => ({
          label,
          level: value === null ? "Sem dados" : classifyLeverageLevel(value),
          value,
        })),
        dimension: dimension.shortDimension,
      };
    });
}

export function buildDimensionScoreSummary(dimensions: DimensionResult[]) {
  if (dimensions.length === 0) {
    return "Ainda não há respostas suficientes para comparar as dimensões.";
  }

  const sortedDimensions = [...dimensions].sort(
    (first, second) => second.maturity - first.maturity,
  );
  const highest = sortedDimensions[0];
  const lowest = sortedDimensions.at(-1) ?? highest;
  const gap = round(highest.maturity - lowest.maturity, 1);

  if (gap === 0) {
    return `As dimensões apresentam a mesma pontuação de ${numberFormatter.format(highest.maturity)}/5.`;
  }

  return `${highest.shortDimension} registra a maior pontuação, ${numberFormatter.format(highest.maturity)}/5, enquanto ${lowest.shortDimension} apresenta ${numberFormatter.format(lowest.maturity)}/5. A diferença entre as dimensões é de ${numberFormatter.format(gap)} ponto.`;
}

export function buildLayerScoreSummary(layerScores: LayerScoreResult[]) {
  const availableScores = layerScores.filter(
    (layer): layer is LayerScoreResult & { score: number } =>
      layer.score !== null,
  );

  if (availableScores.length === 0) {
    return "Ainda não há respostas suficientes para comparar as camadas.";
  }

  if (availableScores.length === 1) {
    const [layer] = availableScores;

    return `A pontuação disponível é de ${numberFormatter.format(layer.score)}/5 para ${layer.label}; as demais camadas ainda não têm base.`;
  }

  const sortedScores = [...availableScores].sort(
    (first, second) => second.score - first.score,
  );
  const highest = sortedScores[0];
  const lowest = sortedScores.at(-1) ?? highest;
  const gap = round(highest.score - lowest.score, 1);

  if (gap === 0) {
    return `As camadas apresentam a mesma pontuação de ${numberFormatter.format(highest.score)}/5.`;
  }

  return `${highest.label} registra a maior pontuação, ${numberFormatter.format(highest.score)}/5, enquanto ${lowest.label} apresenta ${numberFormatter.format(lowest.score)}/5. A diferença entre as camadas é de ${numberFormatter.format(gap)} ponto.`;
}

export function buildOmdxOverviewAnalyticsFromReports(
  reports: Report[],
): OverviewAnalytics {
  if (reports.length === 0) {
    const layerScores = buildLayerScores([]);

    return {
      dimensions: [],
      dimensionSummary: buildDimensionScoreSummary([]),
      leverageRows: [],
      layerScores,
      layerSummary: buildLayerScoreSummary(layerScores),
      questions: [],
      metrics: [],
      vulnerabilityRows: [],
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
  const layerScores = buildLayerScores(dimensions);

  return {
    dimensions,
    dimensionSummary: buildDimensionScoreSummary(dimensions),
    leverageRows: buildLeverageRows(dimensions),
    layerScores,
    layerSummary: buildLayerScoreSummary(layerScores),
    questions,
    metrics: buildMetrics(dimensions),
    vulnerabilityRows: buildVulnerabilityRows(dimensions, questions),
  };
}

function getDiagnosticComparisonDate(report: Report) {
  return report.diagnostic.closedAt ?? report.diagnostic.createdAt;
}

function sortReportsByComparisonDate(reports: Report[]) {
  return [...reports].sort((left, right) => {
    const dateComparison = getDiagnosticComparisonDate(left).localeCompare(
      getDiagnosticComparisonDate(right),
    );

    if (dateComparison !== 0) return dateComparison;

    return left.diagnostic.id.localeCompare(right.diagnostic.id);
  });
}

export function buildOmdxOverviewComparisonFromReports(
  reports: Report[],
  selectedDiagnostic: "todos" | string = "todos",
): OverviewComparisonResult {
  const orderedReports = sortReportsByComparisonDate(reports);
  const selectedIndex =
    selectedDiagnostic === "todos"
      ? orderedReports.length - 1
      : orderedReports.findIndex(
          (report) => report.diagnostic.id === selectedDiagnostic,
        );
  const currentIndex =
    selectedIndex >= 0 ? selectedIndex : orderedReports.length - 1;
  const currentReport = orderedReports[currentIndex];

  if (!currentReport) {
    return {
      analytics: buildOmdxOverviewAnalyticsFromReports([]),
      comparison: null,
      reportDiagnostic: undefined,
    };
  }

  const historicalReports = orderedReports.slice(0, currentIndex);
  const historicalDiagnosticCount = historicalReports.length;

  return {
    analytics: buildOmdxOverviewAnalyticsFromReports([currentReport]),
    comparison:
      historicalDiagnosticCount > 0
        ? {
            currentDiagnosticId: currentReport.diagnostic.id,
            currentDiagnosticName: currentReport.diagnostic.name,
            currentDiagnosticDate: getDiagnosticComparisonDate(currentReport),
            historicalAnalytics:
              buildOmdxOverviewAnalyticsFromReports(historicalReports),
            historicalDiagnosticCount,
            referenceLabel: `Média de ${historicalDiagnosticCount} ${historicalDiagnosticCount === 1 ? "diagnóstico anterior" : "diagnósticos anteriores"}`,
          }
        : null,
    reportDiagnostic: currentReport.diagnostic,
  };
}
