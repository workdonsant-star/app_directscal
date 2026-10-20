import { z } from "zod";
import { adherenceScheduleSchema } from "./asset-adherence";

const id = z.uuid();
const text = z.string().trim().min(1).max(200);
const reason = z.string().trim().min(1).max(1000);
const date = z.iso.datetime({ offset: true });

export const adminRoutineSaveSchema = z.object({
  operation: z.literal("salvar"), id, routineId: id, expectedRuleId: id.nullable(),
  diagnosticId: id, actionPointId: text, expectedAssignmentUpdatedAt: date.nullable(),
  title: text, assetId: id, assetVersionId: id, questionId: id, sectorId: id,
  assigneeUserId: text, schedule: adherenceScheduleSchema,
  expectation: z.string().trim().min(1).max(2000), successIndicator: z.string().trim().min(1).max(1000), reason,
}).strict();

export const adminRoutineTransferSchema = z.object({
  operation: z.literal("transferir"), id, diagnosticId: id, actionPointId: text,
  expectedUpdatedAt: date, expectedRules: z.array(z.object({ routineId: id, ruleId: id }).strict()).max(200),
  assigneeUserId: text, reason,
}).strict().refine(input => new Set(input.expectedRules.map(rule => rule.routineId)).size === input.expectedRules.length, "Rotinas duplicadas.");

export const adminRoutineTransitionSchema = z.object({
  operation: z.literal("situacao"), id, routineId: id, expectedEventId: id.nullable(), action: z.enum(["pausar", "retomar"]), reason,
}).strict();

export const adminRoutineWriteSchema = z.discriminatedUnion("operation", [adminRoutineSaveSchema, adminRoutineTransferSchema, adminRoutineTransitionSchema]);
export type AdminRoutineWrite = z.infer<typeof adminRoutineWriteSchema>;

export type RoutineAction = { diagnosticId: string; diagnosticName: string; actionPointId: string; title: string; description: string; successIndicator: string; assignment: { teamId: string; userId: string; name: string; updatedAt: string } | null };
export type RoutineRevision = { id: string; routineId: string; revision: number; diagnosticId: string; actionPointId: string; title: string; successIndicator: string; expectation: string; assetId: string; assetVersionId: string; questionId: string; sectorId: string; assigneeUserId: string; schedule: z.infer<typeof adherenceScheduleSchema>; createdAt: string; reason: string | null; actorName: string };
export type RoutineStateEvent = { id: string; routineId: string; action: "pausar" | "retomar"; reason: string; recordedAt: string; actorName: string; sequence: number };
export type AdminRoutineWorkspace = {
  companyId: string; companyName: string;
  actions: RoutineAction[];
  questions: { id: string; diagnosticId: string; text: string }[];
  assets: { id: string; versionId: string; title: string; version: string }[];
  sectors: { id: string; name: string }[];
  rules: RoutineRevision[]; events: RoutineStateEvent[];
};

export const customerRoutineAgreementSchema = z.object({
  id, routineId: id, actionPointId: text, title: z.string().nullable(), expectation: z.string(), successIndicator: z.string().nullable(), revision: z.number().int(),
  question: z.string(), sector: z.string(), assigneeName: z.string().nullable(), assetId: id,
  assetType: z.enum(["sop", "playbook", "governanca", "raci"]), assetTitle: z.string(), assetVersion: z.string(), assetAvailable: z.boolean(), schedule: adherenceScheduleSchema, paused: z.boolean(),
});
export type CustomerRoutineAgreement = z.infer<typeof customerRoutineAgreementSchema>;
