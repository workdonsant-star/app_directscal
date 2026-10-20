import { z } from "zod";
import { adherenceCycleSchema } from "@/lib/contracts/asset-adherence";
import { routineSupervisionEventSchema } from "@/lib/contracts/routine-supervision";
const reason = z.string().trim().min(1).max(2000);
const evidence = z.array(z.url().max(2000).refine(value => value.startsWith("https://"))).max(20);
export const routineReplyOperationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("execucao"), performed: z.boolean(), evidence, description: reason }).strict(),
  z.object({ kind: z.literal("bloqueio"), reason }).strict(),
  z.object({ kind: z.literal("excecao"), reason }).strict(),
  z.object({ kind: z.literal("progresso"), value: z.number().int().min(0).max(100), reason }).strict(),
  z.object({ kind: z.literal("leitura") }).strict(),
]);
export type RoutineReplyOperation = z.infer<typeof routineReplyOperationSchema>;
export type ParsedRoutineReply = { kind: "consulta" } | { kind: "ambigua"; message: string } | { kind: "decisao"; decision: "confirmar" | "cancelar"; proposalId: string } | { kind: "proposta"; cycleId: string | null; operation: RoutineReplyOperation };
export const routineReplyContextSchema = z.object({ cycleId: z.uuid(), ruleId: z.uuid(), title: z.string(), assetTitle: z.string(), assetVersion: z.string(), opensAt: z.string(), dueAt: z.string() });
export type RoutineReplyContext = z.infer<typeof routineReplyContextSchema>;
export const routineReplyProposalSchema = z.object({ id: z.uuid(), status: z.enum(["pendente", "confirmada", "cancelada"]), expiresAt: z.string(), operation: routineReplyOperationSchema, context: routineReplyContextSchema });
export const routineExecutionRecordSchema = z.object({
  createdAt: z.iso.datetime({ offset: true }), cycle: adherenceCycleSchema,
  supervision: z.array(routineSupervisionEventSchema).default([]),
  proposals: z.array(z.object({ id: z.uuid(), operation: routineReplyOperationSchema, status: z.enum(["pendente", "confirmada", "cancelada"]),
    expiresAt: z.iso.datetime({ offset: true }), createdAt: z.iso.datetime({ offset: true }), resolvedAt: z.iso.datetime({ offset: true }).nullable(), actorName: z.string(), factId: z.uuid().nullable() })),
  messages: z.array(z.object({ id: z.string(), actor: z.enum(["pessoa", "agente"]), name: z.string(), text: z.string(), at: z.iso.datetime({ offset: true }) })),
});
export type RoutineExecutionRecord = z.infer<typeof routineExecutionRecordSchema>;
