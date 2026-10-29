import { z } from "zod";

export const companyDeletionInputSchema = z.object({
  companyIds: z.array(z.string().regex(/^company_[0-9a-f-]+$/i).refine(
    (id) => z.uuid().safeParse(id.slice(8)).success,
  )).min(1).max(100).refine((ids) => new Set(ids).size === ids.length),
  confirmation: z.literal("EXCLUIR"),
}).strict();

export const companyDeletionResultSchema = z.object({
  deletedCompanyIds: z.array(z.string()),
  deletedUsers: z.number().int().nonnegative(),
  retainedUsers: z.number().int().nonnegative(),
});
