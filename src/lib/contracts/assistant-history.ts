import { z } from "zod";
import { assetQuestionCitationSchema } from "./management-assets";
export const assistantHistoryCursorSchema = z.object({ createdAt: z.iso.datetime({ offset: true }), id: z.uuid() }).strict();
export const assistantHistoryPageSchema = z.object({
 items: z.object({ id: z.uuid(), question: z.string(), answer: z.string(), status: z.enum(["respondida", "insuficiente", "erro"]), createdAt: z.iso.datetime({ offset: true }), citations: assetQuestionCitationSchema.array() }).array(),
 nextCursor: z.string().nullable(),
});
export type AssistantHistoryPage = z.infer<typeof assistantHistoryPageSchema>;
