import { z } from "zod";

export const agentGapInputSchema = z.object({
  id: z.uuid(), auditId: z.uuid(), expectedEventId: z.uuid().nullable(),
  status: z.enum(["aberta", "em_andamento", "resolvida"]),
  assigneeUserId: z.uuid().nullable(), reason: z.string().trim().min(1).max(2000),
  evidenceUrl: z.url({ protocol: /^https$/ }).max(2000).nullable(),
  dueAt: z.iso.datetime({ offset: true }).nullable(),
}).strict().superRefine((value, ctx) => {
  if (value.status !== "aberta" && !value.assigneeUserId) ctx.addIssue({ code: "custom", path: ["assigneeUserId"], message: "Defina o responsável." });
  if (value.status === "resolvida" && !value.evidenceUrl) ctx.addIssue({ code: "custom", path: ["evidenceUrl"], message: "Informe a evidência de resolução." });
});
export const agentGapReviewSchema = z.object({
  id: z.uuid(), auditId: z.uuid(), sequence: z.number().int().positive(),
  status: z.enum(["aberta", "em_andamento", "resolvida"]),
  assigneeUserId: z.uuid().nullable(), actorName: z.string(), reason: z.string(),
  evidenceUrl: z.string().nullable(), dueAt: z.iso.datetime({ offset: true }).nullable(),
  recordedAt: z.iso.datetime({ offset: true }),
});
export const agentOperationsSchema = z.object({
  operators: z.object({ id: z.uuid(), name: z.string() }).array(),
  reviews: agentGapReviewSchema.array(),
  health: z.object({
    capturedAt: z.iso.datetime({ offset: true }), slackFailures: z.number().int().nonnegative(),
    slackUncertain: z.number().int().nonnegative(), slackOverdue: z.number().int().nonnegative(),
    queries30Days: z.number().int().nonnegative(), queryErrors30Days: z.number().int().nonnegative(),
  }),
});
export type AgentOperations = z.infer<typeof agentOperationsSchema>;
export type AgentGapReview = z.infer<typeof agentGapReviewSchema>;
