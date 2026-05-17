import { z } from "zod";

import { idSchema, isoDateTimeSchema } from "./omdx";

export const adminModuleStatusValues = ["ativo", "inativo"] as const;
export const acquisitionCampaignStatusValues = ["ativo", "pausado"] as const;
export const acquisitionLeadStatusValues = [
  "lead",
  "pending_company",
  "account_created",
] as const;
export const acquisitionAccountProviderValues = ["google", "password"] as const;
export const acquisitionFormFieldTypeValues = [
  "text",
  "email",
  "phone",
  "number",
  "select",
  "textarea",
] as const;

export const adminModuleStatusSchema = z.enum(adminModuleStatusValues);
export const acquisitionCampaignStatusSchema = z.enum(
  acquisitionCampaignStatusValues,
);
export const acquisitionLeadStatusSchema = z.enum(acquisitionLeadStatusValues);
export const acquisitionAccountProviderSchema = z.enum(
  acquisitionAccountProviderValues,
);
export const acquisitionFormFieldTypeSchema = z.enum(
  acquisitionFormFieldTypeValues,
);

export const acquisitionFormFieldSchema = z.object({
  id: idSchema,
  label: z.string().min(1),
  type: acquisitionFormFieldTypeSchema,
  required: z.boolean(),
  placeholder: z.string().nullable(),
  options: z.array(z.string().min(1)).nullable(),
  order: z.number().int().nonnegative(),
});

export const adminModuleSchema = z.object({
  id: idSchema,
  slug: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  description: z.string().min(1),
  status: adminModuleStatusSchema,
  productPath: z.string().min(1),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  campaignsCount: z.number().int().nonnegative(),
  activeCampaigns: z.number().int().nonnegative(),
  leadCount: z.number().int().nonnegative(),
  companyCount: z.number().int().nonnegative(),
});

export const acquisitionCampaignSchema = z.object({
  id: idSchema,
  moduleId: idSchema,
  name: z.string().min(1),
  source: z.string().min(1),
  status: acquisitionCampaignStatusSchema,
  token: z.string().min(1),
  publicPath: z.string().min(1),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  visits: z.number().int().nonnegative(),
  fields: z.array(acquisitionFormFieldSchema).min(1),
});

export const leadSchema = z.object({
  id: idSchema,
  moduleId: idSchema,
  campaignId: idSchema,
  campaignName: z.string().min(1),
  source: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable(),
  role: z.string().nullable(),
  companyName: z.string().min(1),
  companySize: z.string().nullable(),
  objective: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  fieldValues: z.record(z.string(), z.string()),
  status: acquisitionLeadStatusSchema.default("lead"),
  accountProvider: acquisitionAccountProviderSchema.nullable().default(null),
  userId: z.string().nullable().default(null),
  organizationId: z.string().nullable().default(null),
});

export const leadCompanySchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  companySize: z.string().nullable(),
  leadCount: z.number().int().nonnegative(),
  moduleNames: z.array(z.string().min(1)),
  sources: z.array(z.string().min(1)),
  firstLeadAt: isoDateTimeSchema,
  lastLeadAt: isoDateTimeSchema,
});

export const acquisitionSubmissionInputSchema = z.object({
  token: z.string().min(1),
  values: z.record(z.string(), z.string()),
});

export type AdminModuleStatus = z.infer<typeof adminModuleStatusSchema>;
export type AcquisitionCampaignStatus = z.infer<
  typeof acquisitionCampaignStatusSchema
>;
export type AcquisitionLeadStatus = z.infer<typeof acquisitionLeadStatusSchema>;
export type AcquisitionAccountProvider = z.infer<
  typeof acquisitionAccountProviderSchema
>;
export type AcquisitionFormFieldType = z.infer<
  typeof acquisitionFormFieldTypeSchema
>;
export type AcquisitionFormField = z.infer<typeof acquisitionFormFieldSchema>;
export type AdminModule = z.infer<typeof adminModuleSchema>;
export type AcquisitionCampaign = z.infer<typeof acquisitionCampaignSchema>;
export type Lead = z.infer<typeof leadSchema>;
export type LeadCompany = z.infer<typeof leadCompanySchema>;
export type AcquisitionSubmissionInput = z.infer<
  typeof acquisitionSubmissionInputSchema
>;
