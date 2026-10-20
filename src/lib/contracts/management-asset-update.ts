import { z } from "zod";
import { managementAssetTypeSchema } from "./management-assets";
import { richTextDocumentSchema } from "./rich-text";

export const customerManagementAssetUpdateSchema = z.object({
  expectedVersionId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(2000),
  content: richTextDocumentSchema,
}).strict();

export type CustomerManagementAssetUpdate = z.infer<typeof customerManagementAssetUpdateSchema>;

export const customerAssetBulkUpdateSchema = z.object({
  assetIds: z.array(z.string().uuid()).min(1).max(1000).refine(ids => new Set(ids).size === ids.length),
  changes: z.object({
    type: managementAssetTypeSchema.optional(),
    categoryKey: z.string().trim().min(1).max(200).optional(),
  }).strict().refine(changes => changes.type !== undefined || changes.categoryKey !== undefined),
}).strict();
export type CustomerAssetBulkUpdate = z.infer<typeof customerAssetBulkUpdateSchema>;
