import {
  dashboardKpis,
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
