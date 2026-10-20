import { z } from "zod";
const reason = z.string().trim().min(1).max(2000);
const base = { id: z.uuid(), cycleId: z.uuid(), expectedEventId: z.uuid().nullable(), reason };
export const routineSupervisionInputSchema = z.discriminatedUnion("operation", [
  z.object({ ...base, operation: z.literal("evidencia"), factId: z.uuid(), accepted: z.boolean() }).strict(),
  z.object({ ...base, operation: z.literal("excecao"), factId: z.uuid(), accepted: z.boolean() }).strict(),
  z.object({ ...base, operation: z.literal("orientar"), proposalId: z.uuid().optional() }).strict(),
  z.object({ ...base, operation: z.literal("prazo"), responseDueAt: z.iso.datetime({ offset: true }), proposalId: z.uuid().optional() }).strict(),
]);
export const routineSupervisionEventSchema = z.object({ id: z.uuid(), operation: z.enum(["evidencia", "excecao", "orientar", "prazo"]), reason,
  responseDueAt: z.iso.datetime({ offset: true }).nullable(), accepted: z.boolean().nullable(), recordedAt: z.iso.datetime({ offset: true }), actorName: z.string() });
export type RoutineSupervisionInput = z.infer<typeof routineSupervisionInputSchema>;
export type RoutineSupervisionEvent = z.infer<typeof routineSupervisionEventSchema>;
