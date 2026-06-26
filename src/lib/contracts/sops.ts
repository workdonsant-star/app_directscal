import { z } from "zod";

import { idSchema, isoDateTimeSchema } from "./omdx";

export const sopStatusValues = ["rascunho", "publicado", "arquivado"] as const;

export const sopStatusSchema = z.enum(sopStatusValues);

export const sopDocumentSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  title: z.string().min(1),
  department: z.string().min(1),
  owner: z.string().min(1),
  status: sopStatusSchema,
  updatedAt: isoDateTimeSchema,
  contentHtml: z.string().min(1),
});

export const updateSopInputSchema = z.object({
  title: z.string().min(1),
  department: z.string().min(1),
  owner: z.string().min(1),
  status: sopStatusSchema,
  contentHtml: z.string().min(1),
});

export type SopStatus = z.infer<typeof sopStatusSchema>;
export type SopDocument = z.infer<typeof sopDocumentSchema>;
export type UpdateSopInput = z.infer<typeof updateSopInputSchema>;
