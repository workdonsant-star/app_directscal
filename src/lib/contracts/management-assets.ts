import { z } from "zod";

import { idSchema, isoDateTimeSchema } from "./omdx";

export const managementAssetTypeValues = [
  "sop",
  "playbook",
  "governanca",
  "raci",
] as const;

export const managementAssetTypeSchema = z.enum(managementAssetTypeValues);

export const managementAssetAuthorSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  avatarUrl: z.string().url().optional(),
});

export const managementAssetSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  type: managementAssetTypeSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  category: z.string().min(1).nullable(),
  author: managementAssetAuthorSchema,
  publishedAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const managementSopContentBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("paragraph"),
    text: z.string().min(1),
  }),
  z.object({
    type: z.literal("list"),
    ordered: z.boolean(),
    items: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal("table"),
    columns: z.array(z.string().min(1)).min(1),
    rows: z.array(z.array(z.string().min(1)).min(1)).min(1),
  }),
]);

export const managementSopSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  blocks: z.array(managementSopContentBlockSchema).min(1),
});

export const managementSopDocumentSchema = managementAssetSchema.extend({
  type: z.literal("sop"),
  document: z.object({
    version: z.string().min(1),
    operationalOwner: z.string().min(1),
    reviewCycle: z.string().min(1),
    sections: z.array(managementSopSectionSchema).min(1),
  }),
});

export type ManagementAssetType = z.infer<typeof managementAssetTypeSchema>;
export type ManagementAssetAuthor = z.infer<
  typeof managementAssetAuthorSchema
>;
export type ManagementAsset = z.infer<typeof managementAssetSchema>;
export type ManagementSopContentBlock = z.infer<
  typeof managementSopContentBlockSchema
>;
export type ManagementSopSection = z.infer<typeof managementSopSectionSchema>;
export type ManagementSopDocument = z.infer<
  typeof managementSopDocumentSchema
>;
