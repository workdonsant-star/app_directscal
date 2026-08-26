import { z } from "zod";

export const idSchema = z.string().min(1);
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const diagnosticStatusValues = ["rascunho", "ativo", "encerrado"] as const;
export const respondentGroupValues = ["fundador", "lideranca", "operacao"] as const;
export const dimensionIdValues = [
  "cultura",
  "visao",
  "comunicacao",
  "processos",
  "lideranca",
  "performance",
] as const;
export const diagnosticTemplateIdValues = ["omdx-v1"] as const;

export const diagnosticStatusSchema = z.enum(diagnosticStatusValues);
export const respondentGroupSchema = z.enum(respondentGroupValues);
export const dimensionIdSchema = z.enum(dimensionIdValues);
export const diagnosticTemplateIdSchema = z.enum(diagnosticTemplateIdValues);

export const classificationSchema = z.enum([
  "Crítico",
  "Inconsistente",
  "Atenção",
  "Consistente",
]);

export const responsesByGroupSchema = z.object({
  total: z.number().int().nonnegative(),
  fundador: z.number().int().nonnegative(),
  lideranca: z.number().int().nonnegative(),
  operacao: z.number().int().nonnegative(),
});

export const scoresByGroupSchema = z.object({
  fundador: z.number().min(1).max(5),
  lideranca: z.number().min(1).max(5),
  operacao: z.number().min(1).max(5),
});

export const nullableScoresByGroupSchema = z.object({
  fundador: z.number().min(1).max(5).nullable(),
  lideranca: z.number().min(1).max(5).nullable(),
  operacao: z.number().min(1).max(5).nullable(),
});

export const dimensionScoresSchema = z.object({
  cultura: z.number().min(1).max(5),
  visao: z.number().min(1).max(5),
  comunicacao: z.number().min(1).max(5),
  processos: z.number().min(1).max(5),
  lideranca: z.number().min(1).max(5),
  performance: z.number().min(1).max(5),
});

export const dimensionLayerScoresSchema = z.object({
  cultura: scoresByGroupSchema,
  visao: scoresByGroupSchema,
  comunicacao: scoresByGroupSchema,
  processos: scoresByGroupSchema,
  lideranca: scoresByGroupSchema,
  performance: scoresByGroupSchema,
});

export const dbOrganizationSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  employee_count: z.number().int().min(1),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const organizationSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  employeeCount: z.number().int().min(1),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const respondentGroupMetaSchema = z.object({
  id: respondentGroupSchema,
  label: z.string().min(1),
  description: z.string().min(1),
});

export const dimensionSchema = z.object({
  id: dimensionIdSchema,
  number: z.number().int().min(1).max(6),
  name: z.string().min(1),
  shortName: z.string().min(1),
  question: z.string().min(1),
  description: z.string().min(1),
});

export const likertScalePointSchema = z.object({
  value: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  label: z.string().min(1),
});

export const diagnosticTemplateSchema = z.object({
  id: diagnosticTemplateIdSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  dimensions: z.array(dimensionIdSchema).length(6),
  scale: z.array(likertScalePointSchema).length(5),
});

export const dbDiagnosticSchema = z.object({
  id: idSchema,
  organization_id: idSchema,
  template_id: diagnosticTemplateIdSchema,
  name: z.string().min(1),
  description: z.string().nullable(),
  status: diagnosticStatusSchema,
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
  activated_at: isoDateTimeSchema.nullable(),
  closed_at: isoDateTimeSchema.nullable(),
  deadline: isoDateSchema.nullable(),
  responses_total: z.number().int().nonnegative(),
  responses_fundador: z.number().int().nonnegative(),
  responses_lideranca: z.number().int().nonnegative(),
  responses_operacao: z.number().int().nonnegative(),
  general_score: z.number().min(1).max(5).nullable(),
});

export const diagnosticSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  organizationName: z.string().min(1),
  company: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  templateId: diagnosticTemplateIdSchema,
  status: diagnosticStatusSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  activatedAt: isoDateTimeSchema.nullable(),
  closedAt: isoDateTimeSchema.nullable(),
  deadline: isoDateSchema.nullable(),
  responses: responsesByGroupSchema,
  generalScore: z.number().min(1).max(5).nullable(),
});

export const diagnosticListItemSchema = diagnosticSchema;
export const diagnosticDetailSchema = diagnosticSchema;

export const diagnosticShareLinkSchema = z.object({
  diagnosticId: idSchema,
  group: respondentGroupSchema,
  token: z.string().min(1),
  publicUrl: z.string().url(),
  previewPath: z.string().min(1),
  suggestedMessage: z.string().min(1),
});

export const diagnosticShareWorkspaceSchema = z.object({
  diagnostic: diagnosticDetailSchema,
  links: z.array(diagnosticShareLinkSchema).length(3),
  responses: responsesByGroupSchema,
});

export const diagnosticResponseQuestionSchema = z.object({
  id: idSchema,
  dimensionId: dimensionIdSchema,
  orderIndex: z.number().int().min(1),
  text: z.string().min(1),
});

export const diagnosticResponseDimensionSchema = dimensionSchema.extend({
  questions: z.array(diagnosticResponseQuestionSchema).min(1),
});

export const diagnosticResponseWorkspaceSchema = z.object({
  token: z.string().min(1),
  diagnostic: diagnosticDetailSchema,
  group: respondentGroupMetaSchema,
  expiresAt: isoDateTimeSchema.nullable(),
  template: diagnosticTemplateSchema,
  dimensions: z.array(diagnosticResponseDimensionSchema).length(6),
});

export const dbRespondentSchema = z.object({
  id: idSchema,
  diagnostic_id: idSchema,
  group: respondentGroupSchema,
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  created_at: isoDateTimeSchema,
});

export const respondentSchema = z.object({
  id: idSchema,
  diagnosticId: idSchema,
  group: respondentGroupSchema,
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  createdAt: isoDateTimeSchema,
});

export const likertAnswerSchema = z.object({
  questionId: idSchema,
  value: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
});

export const responseSessionSchema = z.object({
  id: idSchema,
  diagnosticId: idSchema,
  respondentId: idSchema.nullable(),
  group: respondentGroupSchema,
  status: z.enum(["iniciado", "concluido"]),
  startedAt: isoDateTimeSchema,
  submittedAt: isoDateTimeSchema.nullable(),
});

export const dimensionInsightRecordSchema = z.object({
  diagnosticId: idSchema,
  scores: dimensionScoresSchema,
  layers: dimensionLayerScoresSchema,
});

export const dimensionInsightTrendPointSchema = z.object({
  diagnosticId: idSchema,
  diagnosticName: z.string().min(1),
  company: z.string().min(1),
  createdAt: isoDateTimeSchema,
  gap: z.number().nonnegative().nullable(),
  responses: z.number().int().nonnegative(),
  score: z.number().min(1).max(5),
});

export const dimensionInsightSummarySchema = z.object({
  dimensionId: dimensionIdSchema,
  filter: z.union([z.literal("todos"), idSchema]),
  totalResponses: z.number().int().nonnegative(),
  averageScore: z.number().min(1).max(5).nullable(),
  diagnosticsWithData: z.number().int().nonnegative(),
  variation: z.number().nonnegative().nullable(),
  layerScores: nullableScoresByGroupSchema,
  trend: z.array(dimensionInsightTrendPointSchema),
});

export const dimensionQuestionResultSchema = z.object({
  id: idSchema,
  dimensionId: dimensionIdSchema,
  text: z.string().min(1),
  score: z.number().min(1).max(5),
  layerScores: nullableScoresByGroupSchema,
  gap: z.number().nonnegative().nullable(),
  responses: z.number().int().nonnegative(),
  classification: classificationSchema,
  priorityIndex: z.number().int().min(0).max(100),
});

export const diagnosticReportMisalignmentSchema = z.object({
  value: z.number().nonnegative(),
  highestGroup: respondentGroupSchema,
  lowestGroup: respondentGroupSchema,
});

export const diagnosticReportQuestionSchema = z.object({
  id: idSchema,
  diagnosticId: idSchema,
  dimensionId: dimensionIdSchema,
  text: z.string().min(1),
  score: z.number().min(1).max(5),
  variance: z.number().nonnegative(),
  responses: z.number().int().nonnegative(),
  layerScores: nullableScoresByGroupSchema,
});

export const diagnosticReportDimensionSchema = z.object({
  id: dimensionIdSchema,
  number: z.number().int().min(1).max(6),
  name: z.string().min(1),
  shortName: z.string().min(1),
  question: z.string().min(1),
  description: z.string().min(1),
  score: z.number().min(1).max(5),
  classification: classificationSchema,
  variance: z.number().nonnegative(),
  responses: z.number().int().nonnegative(),
  layerScores: nullableScoresByGroupSchema,
  misalignment: diagnosticReportMisalignmentSchema.nullable(),
  questions: z.array(diagnosticReportQuestionSchema).min(1),
});

export const diagnosticReportDimensionSummarySchema = z.object({
  id: dimensionIdSchema,
  name: z.string().min(1),
  shortName: z.string().min(1),
  score: z.number().min(1).max(5),
  classification: classificationSchema,
});

export const diagnosticReportTopMisalignmentSchema =
  diagnosticReportMisalignmentSchema.extend({
    dimensionId: dimensionIdSchema,
    dimensionName: z.string().min(1),
  });

export const diagnosticReportSchema = z.object({
  diagnostic: diagnosticDetailSchema,
  generatedAt: isoDateTimeSchema,
  threshold: z.number().min(1).max(5),
  generalScore: z.number().min(1).max(5),
  classification: classificationSchema,
  responses: responsesByGroupSchema,
  layerAverages: nullableScoresByGroupSchema,
  weakestDimension: diagnosticReportDimensionSummarySchema,
  highestMisalignment: diagnosticReportTopMisalignmentSchema.nullable(),
  dimensions: z.array(diagnosticReportDimensionSchema).length(6),
});

export const diagnosticActionPointPrioritySchema = z.enum([
  "Alta",
  "Média",
  "Baixa",
]);

export const diagnosticActionPointOwnerSchema = z.enum([
  "Fundador",
  "Liderança",
]);

export const diagnosticActionPlanDimensionSchema = z.object({
  id: dimensionIdSchema,
  name: z.string().min(1),
  shortName: z.string().min(1),
  score: z.number().min(1).max(5),
  classification: classificationSchema,
  gap: z.number().nonnegative().nullable(),
  layerScores: nullableScoresByGroupSchema,
  criticalQuestions: z.array(diagnosticReportQuestionSchema).min(1),
});

export const diagnosticActionPointSchema = z.object({
  id: idSchema,
  dimensionId: dimensionIdSchema,
  dimensionName: z.string().min(1),
  problem: z.string().min(1),
  recommendedAction: z.string().min(1),
  owner: diagnosticActionPointOwnerSchema,
  involved: z.array(z.string().min(1)).min(1),
  suggestedDeadline: z.string().min(1),
  expectedImpact: z.string().min(1),
  successIndicator: z.string().min(1),
  priority: diagnosticActionPointPrioritySchema,
  score: z.number().min(1).max(5),
  gap: z.number().nonnegative().nullable(),
});

export const diagnosticActionPlanSchema = z.object({
  diagnostic: diagnosticDetailSchema,
  generatedAt: isoDateTimeSchema,
  generalScore: z.number().min(1).max(5),
  classification: classificationSchema,
  responses: responsesByGroupSchema,
  weakestDimension: diagnosticReportDimensionSummarySchema,
  highestMisalignment: diagnosticReportTopMisalignmentSchema.nullable(),
  layerAverages: nullableScoresByGroupSchema,
  dimensions: z.array(diagnosticActionPlanDimensionSchema).length(6),
  actionPoints: z.array(diagnosticActionPointSchema).min(1),
});

export const dashboardSummarySchema = z.object({
  activeDiagnostics: z.number().int().nonnegative(),
  totalResponses: z.number().int().nonnegative(),
  averageScore: z.number().min(1).max(5).nullable(),
  topGap: z.object({
    name: z.string(),
    score: z.number().min(1).max(5),
  }),
});

export const createDiagnosticInputSchema = z.object({
  templateId: diagnosticTemplateIdSchema,
  name: z.string().min(1),
  description: z.string().trim().optional().nullable(),
  deadline: isoDateSchema.optional().nullable(),
});

export const updateDiagnosticDraftInputSchema = createDiagnosticInputSchema.extend({
  diagnosticId: idSchema,
});

export const activateDiagnosticInputSchema = z.object({
  diagnosticId: idSchema,
  activatedAt: isoDateTimeSchema,
});

export const closeDiagnosticInputSchema = z.object({
  diagnosticId: idSchema,
  closedAt: isoDateTimeSchema,
});

export const deleteDiagnosticInputSchema = z.object({
  diagnosticId: idSchema,
});

export const submitLikertResponseInputSchema = z.object({
  token: z.string().min(1),
  answers: z.array(likertAnswerSchema).min(1),
}).strict();

export type Id = z.infer<typeof idSchema>;
export type DiagnosticStatus = z.infer<typeof diagnosticStatusSchema>;
export type RespondentGroup = z.infer<typeof respondentGroupSchema>;
export type DimensionId = z.infer<typeof dimensionIdSchema>;
export type DiagnosticTemplateId = z.infer<typeof diagnosticTemplateIdSchema>;
export type Classification = z.infer<typeof classificationSchema>;
export type ResponsesByGroup = z.infer<typeof responsesByGroupSchema>;
export type DbOrganization = z.infer<typeof dbOrganizationSchema>;
export type Organization = z.infer<typeof organizationSchema>;
export type RespondentGroupMeta = z.infer<typeof respondentGroupMetaSchema>;
export type Dimension = z.infer<typeof dimensionSchema>;
export type LikertScalePoint = z.infer<typeof likertScalePointSchema>;
export type DiagnosticTemplate = z.infer<typeof diagnosticTemplateSchema>;
export type DbDiagnostic = z.infer<typeof dbDiagnosticSchema>;
export type Diagnostic = z.infer<typeof diagnosticSchema>;
export type DiagnosticListItem = z.infer<typeof diagnosticListItemSchema>;
export type DiagnosticDetail = z.infer<typeof diagnosticDetailSchema>;
export type DiagnosticShareLink = z.infer<typeof diagnosticShareLinkSchema>;
export type DiagnosticShareWorkspace = z.infer<typeof diagnosticShareWorkspaceSchema>;
export type DiagnosticResponseQuestion = z.infer<typeof diagnosticResponseQuestionSchema>;
export type DiagnosticResponseDimension = z.infer<typeof diagnosticResponseDimensionSchema>;
export type DiagnosticResponseWorkspace = z.infer<typeof diagnosticResponseWorkspaceSchema>;
export type DbRespondent = z.infer<typeof dbRespondentSchema>;
export type Respondent = z.infer<typeof respondentSchema>;
export type LikertAnswer = z.infer<typeof likertAnswerSchema>;
export type ResponseSession = z.infer<typeof responseSessionSchema>;
export type DimensionInsightRecord = z.infer<typeof dimensionInsightRecordSchema>;
export type DimensionInsightTrendPoint = z.infer<typeof dimensionInsightTrendPointSchema>;
export type DimensionInsightSummary = z.infer<typeof dimensionInsightSummarySchema>;
export type DimensionQuestionResult = z.infer<typeof dimensionQuestionResultSchema>;
export type DiagnosticReportMisalignment = z.infer<typeof diagnosticReportMisalignmentSchema>;
export type DiagnosticReportQuestion = z.infer<typeof diagnosticReportQuestionSchema>;
export type DiagnosticReportDimension = z.infer<typeof diagnosticReportDimensionSchema>;
export type DiagnosticReportDimensionSummary = z.infer<typeof diagnosticReportDimensionSummarySchema>;
export type DiagnosticReportTopMisalignment = z.infer<typeof diagnosticReportTopMisalignmentSchema>;
export type DiagnosticReport = z.infer<typeof diagnosticReportSchema>;
export type DiagnosticActionPointPriority = z.infer<typeof diagnosticActionPointPrioritySchema>;
export type DiagnosticActionPointOwner = z.infer<typeof diagnosticActionPointOwnerSchema>;
export type DiagnosticActionPlanDimension = z.infer<typeof diagnosticActionPlanDimensionSchema>;
export type DiagnosticActionPoint = z.infer<typeof diagnosticActionPointSchema>;
export type DiagnosticActionPlan = z.infer<typeof diagnosticActionPlanSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type CreateDiagnosticInput = z.infer<typeof createDiagnosticInputSchema>;
export type UpdateDiagnosticDraftInput = z.infer<typeof updateDiagnosticDraftInputSchema>;
export type ActivateDiagnosticInput = z.infer<typeof activateDiagnosticInputSchema>;
export type CloseDiagnosticInput = z.infer<typeof closeDiagnosticInputSchema>;
export type DeleteDiagnosticInput = z.infer<typeof deleteDiagnosticInputSchema>;
export type SubmitLikertResponseInput = z.infer<typeof submitLikertResponseInputSchema>;
