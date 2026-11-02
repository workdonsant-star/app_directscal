import { z } from "zod";

export const customerDocumentSchema = z.object({
  id: z.string(), organizationId: z.string(), kind: z.enum(["asset", "report"]),
  categoryKey: z.string().nullable(), title: z.string(), fileName: z.string(),
  mimeType: z.string(), byteSize: z.number().int().nonnegative(), publishedAt: z.string(),
});
export type CustomerDocument = z.infer<typeof customerDocumentSchema>;
