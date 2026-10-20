import { z } from "zod";

const reference = z.string().min(1).max(200);
export const slackQuestionSchema = z.object({
  kind: z.enum(["mention", "direct", "thread_reply"]), teamId: reference, userId: reference,
  channel: reference, ts: z.string().regex(/^\d+\.\d+$/), threadTs: z.string().regex(/^\d+\.\d+$/).optional(),
  text: z.string().max(12000),
}).strict();
export type SlackQuestion = z.infer<typeof slackQuestionSchema>;
export const routineContactContextSchema = z.object({ kind: z.literal("rotina"), teamId: reference, userId: reference, channel: z.literal("pendente"), ts: z.literal("0.0"), cycleId: z.uuid() }).strict();
export const slackReplySchema = z.object({ text: z.string().min(1).max(40000), blocks: z.array(z.unknown()).optional(), channel: z.string().regex(/^D[A-Za-z0-9]+$/).optional() }).strict();
export type SlackReply = z.infer<typeof slackReplySchema>;
export const slackDeliveryJobSchema = z.object({
  id: z.uuid(), event_id: reference, organization_id: z.uuid(), team_id: reference,
  question: z.union([slackQuestionSchema, routineContactContextSchema]), lease_id: z.uuid(), attempts: z.number().int().min(1).max(5),
  reply: slackReplySchema.nullable(),
});
export type SlackDeliveryJob = z.infer<typeof slackDeliveryJobSchema>;
