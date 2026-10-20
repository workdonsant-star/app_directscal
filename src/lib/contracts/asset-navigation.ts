import { z } from "zod";

import { isAssetIconName } from "@/lib/asset-navigation-icons";

export const assetNavigationPreferencesSchema = z.object({
  order: z.array(z.string().min(1).max(160)).max(100).refine(keys => new Set(keys).size === keys.length),
  categories: z.array(z.object({ key: z.string().min(1).max(160), title: z.string().trim().min(1).max(80), deleted: z.boolean().optional() }).strict()).max(104).optional(),
  icons: z.record(z.string().min(1).max(160), z.string().max(100).refine(isAssetIconName))
    .refine(icons => Object.keys(icons).length <= 100),
}).strict();
export type AssetNavigationPreferences = z.infer<typeof assetNavigationPreferencesSchema>;

export const assetCategoryInputSchema = z.object({
  title: z.string().trim().min(1).max(80).transform(value => value.replace(/\s+/g, " ")),
  key: z.string().min(1).max(160).optional(),
}).strict();
export const assetNavigationWriteSchema = assetNavigationPreferencesSchema.omit({ categories: true });

export const deleteAssetCategoryInputSchema = z.object({
  key: z.string().min(1).max(160),
  destinationKey: z.string().min(1).max(160).optional(),
  newTitle: z.string().trim().min(1).max(80).transform(value => value.replace(/\s+/g, " ")).optional(),
}).strict().refine(input => !(input.destinationKey && input.newTitle));
export type DeleteAssetCategoryInput = z.infer<typeof deleteAssetCategoryInputSchema>;
