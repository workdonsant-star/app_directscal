import {
  dashboardKpis,
  diagnosticReportQuestions,
  diagnosticTemplates,
  diagnostics,
  dimensions,
  dimensionInsightRecords,
  lastDiagnosticDimensionScores,
  mockUserProfile,
  respondentGroups,
} from "@/lib/mock-data";
import {
  dashboardSummarySchema,
  diagnosticActionPlanSchema,
  diagnosticReportSchema,
  diagnosticShareLinkSchema,
  diagnosticShareWorkspaceSchema,
  diagnosticSchema,
  diagnosticTemplateSchema,
  dimensionInsightRecordSchema,
  dimensionInsightSummarySchema,
  dimensionSchema,
  profileSettingsDataSchema,
  respondentGroupMetaSchema,
  type DashboardSummary,
  type Diagnostic,
  type DiagnosticActionPlan,
  type DiagnosticActionPoint,
  type DiagnosticActionPointOwner,
  type DiagnosticActionPointPriority,
  type DiagnosticReport,
  type DiagnosticReportDimension,
  type DiagnosticReportMisalignment,
  type DiagnosticReportQuestion,
  type DiagnosticShareLink,
  type DiagnosticShareWorkspace,
  type DiagnosticTemplate,
  type Dimension,
  type DimensionId,
  type DimensionInsightRecord,
  type DimensionInsightSummary,
  type ProfileSettingsData,
  type RespondentGroup,
  type RespondentGroupMeta,
  type Classification,
} from "@/lib/contracts";

const publicBaseUrl = "https://omdx.directscal.com/r";

const suggestedMessages: Record<RespondentGroup, string> = {
  fundador:
    "Olá. Estamos rodando o OMDx para medir a maturidade operacional da empresa a partir da leitura de fundadores. Responda pelo link abaixo. A análise será consolidada de forma agregada.",
  lideranca:
    "Olá. Estamos rodando o OMDx para entender como a liderança percebe a maturidade operacional da empresa. Use o link abaixo para responder. A análise será consolidada de forma agregada.",
  operacao:
    "Olá. Estamos rodando o OMDx para entender como a operação percebe clareza, processos, liderança e foco no dia a dia. Responda pelo link abaixo. A análise será consolidada de forma agregada.",
};

export function classifyScore(score: number): Classification {
  if (score <= 2.0) return "Crítico";
  if (score <= 3.0) return "Em desenvolvimento";
  if (score < 4.0) return "Em estruturação";
  if (score <= 4.5) return "Maduro";
  return "Referência";
}

export function getProfileSettingsData(): ProfileSettingsData {
  return profileSettingsDataSchema.parse(mockUserProfile);
}

export function getRespondentGroups(): RespondentGroupMeta[] {
  return respondentGroups.map((group) => respondentGroupMetaSchema.parse(group));
}

export function getDimensions(): Dimension[] {
  return dimensions.map((dimension) => dimensionSchema.parse(dimension));
}

export function isDimensionId(value: string): value is DimensionId {
  return dimensions.some((dimension) => dimension.id === value);
}

export function getDimensionById(id: DimensionId): Dimension {
  const dimension = dimensions.find((item) => item.id === id);
  if (!dimension) throw new Error(`Dimension not found: ${id}`);
  return dimensionSchema.parse(dimension);
}

export function getDiagnostics(): Diagnostic[] {
  return diagnostics.map((diagnostic) => diagnosticSchema.parse(diagnostic));
}

export function getDiagnosticById(id: string): Diagnostic | undefined {
  const diagnostic = diagnostics.find((item) => item.id === id);
  return diagnostic ? diagnosticSchema.parse(diagnostic) : undefined;
}

export function getDefaultDiagnosticTemplate(): DiagnosticTemplate {
  return diagnosticTemplateSchema.parse(diagnosticTemplates[0]);
}

export function getDiagnosticTemplates(): DiagnosticTemplate[] {
  return diagnosticTemplates.map((template) => diagnosticTemplateSchema.parse(template));
}

export function getLatestDimensionScores(): Record<DimensionId, number> {
  return { ...lastDiagnosticDimensionScores };
}

export function getDashboardSummary(): DashboardSummary {
  return dashboardSummarySchema.parse(dashboardKpis);
}

export function getDimensionInsightRecords(): DimensionInsightRecord[] {
  return dimensionInsightRecords.map((record) =>
    dimensionInsightRecordSchema.parse(record),
  );
}

export function getDimensionInsightDiagnosticOptions(): Diagnostic[] {
  return getDimensionInsightRecords()
    .map((record) => getDiagnosticById(record.diagnosticId))
    .filter((diagnostic): diagnostic is Diagnostic => Boolean(diagnostic));
}

export function getDimensionInsightSummary(
  dimensionId: DimensionId,
  filter: "todos" | string = "todos",
): DimensionInsightSummary {
  const records =
    filter === "todos"
      ? getDimensionInsightRecords()
      : getDimensionInsightRecords().filter((record) => record.diagnosticId === filter);

  const trend = records
    .map((record) => {
      const diagnostic = getDiagnosticById(record.diagnosticId);
      if (!diagnostic) return null;
      return {
        diagnosticId: diagnostic.id,
        diagnosticName: diagnostic.name,
        company: diagnostic.company,
        responses: diagnostic.responses.total,
        score: record.scores[dimensionId],
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const scores = trend.map((item) => item.score);
  const totalResponses = trend.reduce((acc, item) => acc + item.responses, 0);
  const averageScore =
    scores.length > 0
      ? scores.reduce((acc, score) => acc + score, 0) / scores.length
      : null;

  const layerScores = getRespondentGroups().reduce(
    (acc, group) => {
      const values = records.map((record) => record.layers[dimensionId][group.id]);
      acc[group.id] =
        values.length > 0
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : null;
      return acc;
    },
    { fundador: null, lideranca: null, operacao: null } as Record<
      RespondentGroup,
      number | null
    >,
  );

  return dimensionInsightSummarySchema.parse({
    dimensionId,
    filter,
    totalResponses,
    averageScore,
    diagnosticsWithData: trend.length,
    variation: scores.length > 1 ? Math.max(...scores) - Math.min(...scores) : null,
    layerScores,
    trend,
  });
}

const reportThreshold = 3;
const highGapThreshold = 1;
const mediumScoreThreshold = 3.5;
const varianceThreshold = 0.6;

function roundReportScore(value: number) {
  return Number(value.toFixed(1));
}

function roundReportNumber(value: number) {
  return Number(value.toFixed(2));
}

function average(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function calculateMisalignment(
  scores: Record<RespondentGroup, number>,
): DiagnosticReportMisalignment {
  const entries = (Object.entries(scores) as [RespondentGroup, number][]).sort(
    ([, a], [, b]) => b - a,
  );
  const highest = entries[0];
  const lowest = entries[entries.length - 1];

  return {
    highestGroup: highest[0],
    lowestGroup: lowest[0],
    value: roundReportScore(highest[1] - lowest[1]),
  };
}

function getGroupLabel(group: RespondentGroup) {
  return getRespondentGroups().find((item) => item.id === group)?.label ?? group;
}

function getLayerMainConcern(dimension: DiagnosticReportDimension) {
  const lowest = (Object.entries(dimension.layerScores) as [
    RespondentGroup,
    number,
  ][]).sort(([, a], [, b]) => a - b)[0];

  return lowest[0];
}

function getActionPriority(
  dimension: DiagnosticReportDimension,
): DiagnosticActionPointPriority {
  if (dimension.score < reportThreshold || dimension.misalignment.value >= highGapThreshold) {
    return "Alta";
  }

  if (
    dimension.score <= mediumScoreThreshold ||
    dimension.questions.some((question) => question.variance >= varianceThreshold)
  ) {
    return "Média";
  }

  return "Baixa";
}

function getActionOwner(
  dimensionId: DimensionId,
): DiagnosticActionPointOwner {
  return dimensionId === "cultura" || dimensionId === "visao"
    ? "Fundador"
    : "Liderança";
}

function getSuggestedDeadline(priority: DiagnosticActionPointPriority) {
  if (priority === "Alta") return "30 dias";
  if (priority === "Média") return "60 dias";
  return "90 dias";
}

function getDimensionActionText(dimension: DiagnosticReportDimension) {
  const lowestGroup = getGroupLabel(getLayerMainConcern(dimension));

  const copy: Record<
    DimensionId,
    {
      problem: string;
      action: string;
      impact: string;
      indicator: string;
    }
  > = {
    cultura: {
      problem: `A dimensão Cultura mostra baixa segurança para levantar problemas e aprender com falhas, com maior sensibilidade em ${lowestGroup}.`,
      action:
        "Implantar um ritual quinzenal de identificação de bloqueios, decisões travadas e aprendizados operacionais, com registro simples de encaminhamentos.",
      impact:
        "Reduzir custo político de apontar problemas e acelerar correções antes que virem urgência.",
      indicator:
        "Percentual de bloqueios registrados com responsável e encaminhamento definido no mesmo ciclo.",
    },
    visao: {
      problem: `A dimensão Visão indica perda de clareza entre direção e execução, com maior sensibilidade em ${lowestGroup}.`,
      action:
        "Traduzir prioridades estratégicas em três objetivos operacionais do ciclo, conectando cada área a decisões e tradeoffs explícitos.",
      impact:
        "Aumentar autonomia decisória e reduzir realinhamentos causados por prioridade ambígua.",
      indicator:
        "Percentual de áreas com objetivos do ciclo, dono definido e decisão de prioridade registrada.",
    },
    comunicacao: {
      problem: `A dimensão Comunicação indica fricção no fluxo de informação e nos rituais de gestão, com maior sensibilidade em ${lowestGroup}.`,
      action:
        "Padronizar reuniões críticas com pauta, decisões, donos e próximos passos em um registro único de acompanhamento.",
      impact:
        "Diminuir retrabalho e aumentar previsibilidade entre decisão, comunicação e execução.",
      indicator:
        "Percentual de reuniões críticas com decisão registrada e próximo passo acompanhado.",
    },
    processos: {
      problem: `A dimensão Processos mostra dependência de improviso e pessoas-chave, com maior sensibilidade em ${lowestGroup}.`,
      action:
        "Mapear os cinco processos críticos da operação, definir padrão mínimo de execução e criar checklist de qualidade por entrega.",
      impact:
        "Aumentar repetibilidade operacional e reduzir variação de entrega entre pessoas e áreas.",
      indicator:
        "Percentual de processos críticos com dono, padrão documentado e checklist em uso.",
    },
    lideranca: {
      problem: `A dimensão Liderança indica oportunidade de melhorar delegação, autonomia e accountability, com maior sensibilidade em ${lowestGroup}.`,
      action:
        "Definir matriz simples de responsabilidades por frente crítica, com decisões delegadas, limites de autonomia e cadência de acompanhamento.",
      impact:
        "Reduzir concentração de decisão e dar mais clareza para execução sem microgestão.",
      indicator:
        "Percentual de frentes críticas com responsável, autonomia definida e cadência ativa.",
    },
    performance: {
      problem: `A dimensão Performance indica necessidade de proteger foco e cadência de resultado, com maior sensibilidade em ${lowestGroup}.`,
      action:
        "Revisar indicadores do ciclo e reduzir a gestão a poucos sinais operacionais com dono, frequência e decisão esperada.",
      impact:
        "Melhorar foco operacional e transformar indicador em decisão de gestão, não apenas acompanhamento.",
      indicator:
        "Percentual de indicadores críticos revisados dentro da cadência e vinculados a decisões.",
    },
  };

  return copy[dimension.id];
}

function getCriticalQuestions(dimension: DiagnosticReportDimension) {
  return [...dimension.questions]
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return b.variance - a.variance;
    })
    .slice(0, 3);
}

function buildActionPoint(
  dimension: DiagnosticReportDimension,
): DiagnosticActionPoint {
  const priority = getActionPriority(dimension);
  const owner = getActionOwner(dimension.id);
  const lowestGroup = getLayerMainConcern(dimension);
  const text = getDimensionActionText(dimension);
  const involved = Array.from(
    new Set([
      owner,
      "Liderança",
      getGroupLabel(lowestGroup),
    ]),
  );

  return {
    id: `action_${dimension.id}`,
    dimensionId: dimension.id,
    dimensionName: dimension.name,
    problem: text.problem,
    recommendedAction: text.action,
    owner,
    involved,
    suggestedDeadline: getSuggestedDeadline(priority),
    expectedImpact: text.impact,
    successIndicator: text.indicator,
    priority,
    score: dimension.score,
    gap: dimension.misalignment.value,
  };
}

export function canGenerateDiagnosticReport(diagnostic: Diagnostic): boolean {
  return (
    diagnostic.generalScore !== null &&
    dimensionInsightRecords.some(
      (record) => record.diagnosticId === diagnostic.id,
    ) &&
    diagnosticReportQuestions.some(
      (question) => question.diagnosticId === diagnostic.id,
    )
  );
}

export function canGenerateDiagnosticActionPlan(diagnostic: Diagnostic): boolean {
  return canGenerateDiagnosticReport(diagnostic);
}

export function getLatestReportableDiagnostic(): Diagnostic | undefined {
  return getDiagnostics()
    .filter(canGenerateDiagnosticReport)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];
}

export function getDiagnosticReport(
  diagnosticId: string,
  generatedAt = new Date().toISOString(),
): DiagnosticReport | undefined {
  const diagnostic = getDiagnosticById(diagnosticId);

  if (!diagnostic || diagnostic.generalScore === null) {
    return undefined;
  }

  const insight = getDimensionInsightRecords().find(
    (record) => record.diagnosticId === diagnostic.id,
  );

  if (!insight) {
    return undefined;
  }

  const reportQuestions = diagnosticReportQuestions.filter(
    (question) => question.diagnosticId === diagnostic.id,
  );

  if (reportQuestions.length === 0) {
    return undefined;
  }

  const reportDimensions = getDimensions()
    .map((dimension) => {
      const questions = reportQuestions.filter(
        (question): question is DiagnosticReportQuestion =>
          question.dimensionId === dimension.id,
      );

      if (questions.length === 0) {
        return null;
      }

      const score = insight.scores[dimension.id];
      const layerScores = insight.layers[dimension.id];
      const classification = classifyScore(score);

      return {
        ...dimension,
        score,
        classification,
        variance: roundReportNumber(
          average(questions.map((question) => question.variance)),
        ),
        responses: diagnostic.responses.total,
        layerScores,
        misalignment: calculateMisalignment(layerScores),
        questions,
      };
    })
    .filter((dimension): dimension is NonNullable<typeof dimension> =>
      Boolean(dimension),
    );

  if (reportDimensions.length !== dimensions.length) {
    return undefined;
  }

  const respondentGroupOptions = getRespondentGroups();
  const layerAverages = respondentGroupOptions.reduce(
    (acc, group) => {
      acc[group.id] = roundReportScore(
        average(
          reportDimensions.map((dimension) => dimension.layerScores[group.id]),
        ),
      );
      return acc;
    },
    {} as Record<RespondentGroup, number>,
  );

  const weakestDimension = [...reportDimensions].sort(
    (a, b) => a.score - b.score,
  )[0];
  const highestMisalignmentDimension = [...reportDimensions].sort(
    (a, b) => b.misalignment.value - a.misalignment.value,
  )[0];

  return diagnosticReportSchema.parse({
    diagnostic,
    generatedAt,
    threshold: reportThreshold,
    generalScore: diagnostic.generalScore,
    classification: classifyScore(diagnostic.generalScore),
    responses: diagnostic.responses,
    layerAverages,
    weakestDimension: {
      id: weakestDimension.id,
      name: weakestDimension.name,
      shortName: weakestDimension.shortName,
      score: weakestDimension.score,
      classification: weakestDimension.classification,
    },
    highestMisalignment: {
      dimensionId: highestMisalignmentDimension.id,
      dimensionName: highestMisalignmentDimension.name,
      ...highestMisalignmentDimension.misalignment,
    },
    dimensions: reportDimensions,
  });
}

export function getDiagnosticActionPlan(
  diagnosticId: string,
  generatedAt = new Date().toISOString(),
): DiagnosticActionPlan | undefined {
  const report = getDiagnosticReport(diagnosticId, generatedAt);

  if (!report) {
    return undefined;
  }

  const actionDimensions = report.dimensions.map((dimension) => ({
    id: dimension.id,
    name: dimension.name,
    shortName: dimension.shortName,
    score: dimension.score,
    classification: dimension.classification,
    gap: dimension.misalignment.value,
    layerScores: dimension.layerScores,
    criticalQuestions: getCriticalQuestions(dimension),
  }));

  const actionPoints = report.dimensions
    .map(buildActionPoint)
    .sort((a, b) => {
      const priorityWeight: Record<DiagnosticActionPointPriority, number> = {
        Alta: 3,
        Média: 2,
        Baixa: 1,
      };

      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }

      if (a.score !== b.score) return a.score - b.score;
      return b.gap - a.gap;
    });

  return diagnosticActionPlanSchema.parse({
    diagnostic: report.diagnostic,
    generatedAt: report.generatedAt,
    generalScore: report.generalScore,
    classification: report.classification,
    responses: report.responses,
    weakestDimension: report.weakestDimension,
    highestMisalignment: report.highestMisalignment,
    layerAverages: report.layerAverages,
    dimensions: actionDimensions,
    actionPoints,
  });
}

export function getResponseToken(
  diagnosticId: string,
  group: RespondentGroup,
): string {
  return `${diagnosticId}-${group}`;
}

export function getDiagnosticShareLinks(
  diagnostic: Diagnostic,
): DiagnosticShareLink[] {
  return getRespondentGroups().map((group) => {
    const token = getResponseToken(diagnostic.id, group.id);

    return diagnosticShareLinkSchema.parse({
      diagnosticId: diagnostic.id,
      group: group.id,
      token,
      publicUrl: `${publicBaseUrl}/${token}`,
      previewPath: `/r/${token}`,
      suggestedMessage: suggestedMessages[group.id],
    });
  });
}

export function getDiagnosticShareWorkspace(
  diagnosticId: string,
): DiagnosticShareWorkspace | undefined {
  const diagnostic = getDiagnosticById(diagnosticId);
  if (!diagnostic) return undefined;

  return diagnosticShareWorkspaceSchema.parse({
    diagnostic,
    links: getDiagnosticShareLinks(diagnostic),
    responses: diagnostic.responses,
  });
}

export function getDiagnosticByResponseToken(
  token: string,
): { diagnostic: Diagnostic; group: RespondentGroupMeta } | undefined {
  const group = getRespondentGroups().find((option) =>
    token.endsWith(`-${option.id}`),
  );

  if (!group) return undefined;

  const diagnosticId = token.slice(0, -group.id.length - 1);
  const diagnostic = getDiagnosticById(diagnosticId);

  if (!diagnostic) return undefined;

  return { diagnostic, group };
}
