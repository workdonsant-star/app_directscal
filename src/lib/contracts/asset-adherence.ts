import { z } from "zod";

const reference = z.string().trim().min(1).max(200);
const instant = z.iso.datetime({ offset: true });

export const adherenceScheduleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("periodica"), cadence: z.enum(["diaria", "semanal", "quinzenal", "mensal", "trimestral", "semestral", "anual"]), timeZone: z.literal("America/Sao_Paulo") }).strict(),
  z.object({ kind: z.literal("por_evento"), eventKey: reference, timeZone: z.literal("America/Sao_Paulo") }).strict(),
]);

// Cada revisão conserva o acordo que originou os ciclos, inclusive responsável e versão.
export const adherenceRuleSchema = z.object({
  id: z.uuid(), routineId: z.uuid(), revision: z.number().int().positive(), organizationId: z.uuid(), diagnosticId: z.uuid(), actionPointId: reference,
  assetId: z.uuid(), assetVersionId: z.uuid(), questionId: z.uuid(), sectorId: z.uuid(),
  assignee: z.object({ teamId: reference, userId: reference }).strict(),
  schedule: adherenceScheduleSchema, expectation: z.string().trim().min(1).max(2000),
  createdAt: instant,
}).strict();

const reason = z.string().trim().min(1).max(2000);
export const adherenceFactPayloadSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("leitura_confirmada") }).strict(),
  z.object({ kind: z.literal("execucao_relatada"), performed: z.boolean(), evidence: z.array(z.string().url().max(2000).refine(value => value.startsWith("https://"), "Use um endereço HTTPS.")).max(20) }).strict(),
  z.object({ kind: z.literal("evidencia_revisada"), executionId: z.uuid(), accepted: z.boolean(), reason }).strict(),
  z.object({ kind: z.literal("excecao_solicitada"), reason }).strict(),
  z.object({ kind: z.literal("excecao_revisada"), requestId: z.uuid(), accepted: z.boolean(), reason }).strict(),
  z.object({ kind: z.literal("resultado_registrado"), indicator: reference, baseline: z.number().finite(), observed: z.number().finite(), unit: reference, source: z.string().url().max(2000).refine(value => value.startsWith("https://")), reason }).strict(),
]);

export const adherenceFactSchema = z.object({
  id: z.uuid(), cycleId: z.uuid(), sequence: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), recordedAt: instant,
  actorUserId: z.uuid().nullable(), payload: adherenceFactPayloadSchema,
  origin: z.enum(["manual", "slack"]).default("manual"),
  slackTeamId: z.string().nullable().optional(), slackUserId: z.string().nullable().optional(), slackEventJobId: z.uuid().nullable().optional(),
}).strict().superRefine((fact, ctx) => {
  const valid = fact.origin === "manual"
    ? Boolean(fact.actorUserId) && !fact.slackTeamId && !fact.slackUserId && !fact.slackEventJobId
    : fact.actorUserId === null && Boolean(fact.slackTeamId && fact.slackUserId && fact.slackEventJobId);
  if (!valid) ctx.addIssue({ code: "custom", message: "Identidade do registro inconsistente." });
});

export const adherenceCycleSchema = z.object({
  id: z.uuid(), rule: adherenceRuleSchema, opportunityKey: reference,
  opensAt: instant, dueAt: instant, facts: z.array(adherenceFactSchema),
}).strict().superRefine((cycle, ctx) => {
  if (Date.parse(cycle.dueAt) < Date.parse(cycle.opensAt)) ctx.addIssue({ code: "custom", message: "O prazo não pode anteceder a abertura.", path: ["dueAt"] });
  if (cycle.facts.some(fact => fact.cycleId !== cycle.id)) ctx.addIssue({ code: "custom", message: "Fato de outro ciclo.", path: ["facts"] });
  if (new Set(cycle.facts.map(fact => fact.sequence)).size !== cycle.facts.length || new Set(cycle.facts.map(fact => fact.id)).size !== cycle.facts.length) ctx.addIssue({ code: "custom", message: "Fatos duplicados.", path: ["facts"] });
});

export type AdherenceRule = z.infer<typeof adherenceRuleSchema>;
export type AdherenceFactPayload = z.infer<typeof adherenceFactPayloadSchema>;
export type AdherenceFact = z.infer<typeof adherenceFactSchema>;
export type AdherenceCycle = z.infer<typeof adherenceCycleSchema>;
