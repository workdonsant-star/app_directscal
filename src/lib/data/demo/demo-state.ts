import { z } from "zod";

import { demoReports } from "@/lib/data/demo/demo-data";
import { managementAssetDocumentSchema } from "@/lib/contracts/management-assets";
import { organizationSectorSchema, profileSettingsDataSchema } from "@/lib/contracts";
import { assetNavigationPreferencesSchema } from "@/lib/contracts/asset-navigation";
import { adminRoutineWriteSchema } from "@/lib/contracts/admin-adherence";
import { routineContactPolicyInputSchema } from "@/lib/contracts/routine-contacts";
import { resultBaselineSchema } from "@/lib/contracts/routine-results";
import { adminManagementAssetDetailSchema } from "@/lib/contracts/management-assets";
import { adminDeliveryPublicationSchema } from "@/lib/contracts/admin-operations";
import { agentGapReviewSchema } from "@/lib/contracts/agent-operations";
import { adminSpecialistSchema } from "@/lib/contracts/admin-operations";
import { acquisitionCampaignSchema, leadSchema } from "@/lib/contracts/admin";
import { customerDocumentSchema } from "@/lib/contracts/customer-documents";

export const DEMO_STORAGE_KEY = "directscal:presentation:v1";
export const demoActionPointSchema = z.object({
  id: z.string().max(100),
  title: z.string().trim().min(1).max(200),
  assetId: z.string().max(100),
  leaderUserId: z.string().max(100),
  deadline: z.iso.date().nullable().default(null),
  frequency: z.enum(["diaria", "semanal", "quinzenal", "mensal"]).nullable().default(null),
  weekdays: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  sendTime: z.string().regex(/^([01]\d|2[0-3]):[0-5][05]$/).nullable().default(null),
  scheduleStartsOn: z.iso.date().nullable().default(null),
  reason: z.string().max(2000),
  action: z.string().max(2000),
  continuity: z.string().max(2000),
});
export type DemoActionPoint = z.infer<typeof demoActionPointSchema>;
export const demoFollowUpCriterionSchema = z.object({
  id: z.string().max(100),
  fact: z.string().trim().min(1).max(300),
  source: z.string().trim().min(1).max(500),
  requiredFields: z.string().trim().min(1).max(300),
  question: z.string().trim().min(1).max(500),
  clarification: z.string().trim().min(1).max(500),
  evidence: z.enum(["relato", "registro"]),
});
export const demoFollowUpCycleSchema = z.object({
  number: z.number().int().min(1).max(3),
  period: z.string().max(100),
  response: z.string().max(1000).nullable(),
  results: z.array(z.object({ criterionId: z.string(), status: z.enum(["atendido", "parcial", "nao_atendido", "inconclusivo", "sem_resposta"]), explanation: z.string().max(500), evidence: z.enum(["relato", "registro_apresentado", "nenhuma"]) })).max(5),
});
export const demoFollowUpPlanSchema = z.object({
  actionPointId: z.string().max(100),
  version: z.number().int().min(1).max(20),
  status: z.enum(["rascunho", "ativo"]),
  assetId: z.string().max(100),
  assetVersionId: z.string().max(100),
  diagnosticId: z.string().max(100),
  diagnosticQuestion: z.string().trim().min(1).max(500),
  actionFrequency: demoActionPointSchema.shape.frequency,
  orientation: z.string().max(500),
  criteria: demoFollowUpCriterionSchema.array().min(1).max(5),
  cycles: demoFollowUpCycleSchema.array().max(3),
});
export type DemoFollowUpPlan = z.infer<typeof demoFollowUpPlanSchema>;
export type DemoFollowUpCriterion = z.infer<typeof demoFollowUpCriterionSchema>;
export type DemoFollowUpCycle = z.infer<typeof demoFollowUpCycleSchema>;
export const demoAiEngineSchema = z.object({
  id: z.string().max(100),
  provider: z.enum(["anthropic", "openai", "google"]),
  name: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(120),
  enabled: z.boolean(),
});
export const demoAiAssignmentsSchema = z.object({ planner: z.string().nullable(), conductor: z.string().nullable(), classifier: z.string().nullable() });
export type DemoAiEngine = z.infer<typeof demoAiEngineSchema>;
export type DemoAiAssignments = z.infer<typeof demoAiAssignmentsSchema>;
const surveySchema = z.object({ id: z.string().max(100), name: z.string().min(1).max(120), status: z.enum(["rascunho", "ativo", "encerrado"]), responses: z.number().int().min(0).max(10000), description: z.string().nullable().optional(), deadline: z.string().nullable().optional(), leaderIds: z.string().array().optional() });
export const demoStateSchema = z.object({
  version: z.literal(1),
  surveys: z.array(surveySchema).max(50),
  records: z.array(z.object({ id: z.string(), actionId: z.string(), note: z.string().max(2000), status: z.enum(["aguardando", "validado", "devolvido"]) })).max(100),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(5000), assetId: z.string().nullable() })).max(100),
  sectors: organizationSectorSchema.array().optional(),
  profile: profileSettingsDataSchema.optional(),
  adminProfile: z.object({ name: z.string().trim().min(1).max(120), avatarUrl: z.string().max(2000000).nullable() }).optional(),
  slackConnected: z.boolean().default(true),
  assets: managementAssetDocumentSchema.array().optional(),
  navigation: assetNavigationPreferencesSchema.default({ order: [], icons: {} }),
  responseTokens: z.string().array().default([]),
  adminAssets: adminManagementAssetDetailSchema.array().max(100).optional(),
  adminCampaigns: acquisitionCampaignSchema.array().max(50).optional(),
  adminLeads: leadSchema.array().max(200).optional(),
  adminDeletedAssetIds: z.string().array().max(100).optional(),
  adminRoutineChanges: adminRoutineWriteSchema.array().max(100).optional(),
  adminContactPolicies: routineContactPolicyInputSchema.array().max(100).optional(),
  adminBaselines: resultBaselineSchema.array().max(100).optional(),
  adminActionPoints: demoActionPointSchema.array().max(100).optional(),
  adminTestedActionPoints: z.string().array().max(100).optional(),
  adminFollowUpPlans: demoFollowUpPlanSchema.array().max(100).optional(),
  adminAiEngines: demoAiEngineSchema.array().max(30).optional(),
  adminAiAssignments: demoAiAssignmentsSchema.optional(),
  adminPublications: adminDeliveryPublicationSchema.array().max(10).optional(),
  adminGapReviews: agentGapReviewSchema.array().max(100).optional(),
  adminSpecialists: adminSpecialistSchema.extend({ archived: z.boolean() }).array().max(30).optional(),
  deletedCompanyIds: z.string().array().max(10).optional(),
  adminAssignedSpecialistId: z.string().nullable().optional(),
  uploadedDocuments: customerDocumentSchema.array().max(100).optional(),
});
export type DemoState = z.infer<typeof demoStateSchema>;

export function createDemoState(): DemoState {
  return {
    version: 1,
    surveys: [
      ...demoReports.map(report => ({ id: report.diagnostic.id, name: report.diagnostic.name, status: "encerrado" as const, responses: report.responses.total })),
      { id: "demo-survey-active", name: "Pulso de acompanhamento", status: "ativo", responses: 12 },
    ],
    records: [{ id: "demo-record-1", actionId: "ap-001", note: "Daily realizada às 9h. Prioridades registradas e um impedimento encaminhado à liderança.", status: "aguardando" }],
    messages: [],
    navigation: { order: [], icons: {} },
    responseTokens: [],
    slackConnected: true,
  };
}

export function restoreDemoState(serialized: string | null): DemoState {
  try { return demoStateSchema.parse(JSON.parse(serialized ?? "null")); }
  catch { return createDemoState(); }
}

export function submitDemoResponse(state: DemoState, surveyId?: string): DemoState {
  const active = state.surveys.find(survey => survey.status === "ativo" && (!surveyId || survey.id === surveyId));
  if (!active) return state;
  return { ...state, surveys: state.surveys.map(survey => survey.id === active.id ? { ...survey, responses: survey.responses + 1 } : survey) };
}

export function reviewDemoRecord(state: DemoState, id: string, status: "validado" | "devolvido"): DemoState {
  return { ...state, records: state.records.map(record => record.id === id && record.status === "aguardando" ? { ...record, status } : record) };
}
