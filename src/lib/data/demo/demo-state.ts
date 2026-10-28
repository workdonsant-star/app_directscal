import { z } from "zod";

import { demoReports } from "@/lib/data/demo/demo-data";
import { managementAssetDocumentSchema } from "@/lib/contracts/management-assets";
import { organizationSectorSchema, profileSettingsDataSchema } from "@/lib/contracts";
import { assetNavigationPreferencesSchema } from "@/lib/contracts/asset-navigation";

export const DEMO_STORAGE_KEY = "directscal:presentation:v1";
const surveySchema = z.object({ id: z.string().max(100), name: z.string().min(1).max(120), status: z.enum(["rascunho", "ativo", "encerrado"]), responses: z.number().int().min(0).max(10000), description: z.string().nullable().optional(), deadline: z.string().nullable().optional(), leaderIds: z.string().array().optional() });
export const demoStateSchema = z.object({
  version: z.literal(1),
  surveys: z.array(surveySchema).max(50),
  records: z.array(z.object({ id: z.string(), actionId: z.string(), note: z.string().max(2000), status: z.enum(["aguardando", "validado", "devolvido"]) })).max(100),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(5000), assetId: z.string().nullable() })).max(100),
  sectors: organizationSectorSchema.array().optional(),
  profile: profileSettingsDataSchema.optional(),
  slackConnected: z.boolean().default(true),
  assets: managementAssetDocumentSchema.array().optional(),
  navigation: assetNavigationPreferencesSchema.default({ order: [], icons: {} }),
  responseTokens: z.string().array().default([]),
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
