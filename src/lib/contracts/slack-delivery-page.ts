import { z } from "zod";

export const slackDeliveryPageSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    eventId: z.string(),
    source: z.enum(["rotina", "consulta"]),
    cycleId: z.string().nullable(),
    status: z.string(),
    attempts: z.number().int().nonnegative(),
    retryable: z.boolean(),
    nextAttemptAt: z.string(),
    channel: z.string().nullable(),
    messageTs: z.string().nullable(),
    deliveredTs: z.string().nullable(),
    errorCode: z.string().nullable(),
    receivedAt: z.string(),
    updatedAt: z.string(),
  })),
  nextCursor: z.string().nullable(),
});

export type SlackDeliveryPage = z.infer<typeof slackDeliveryPageSchema>;
