import { z } from "zod";

import { idSchema, isoDateTimeSchema } from "./omdx";

export const adminSpecialistStatusValues = ["ativo", "inativo"] as const;
export const adminDeliveryStatusValues = [
  "sem_especialista",
  "aguardando_analise",
  "em_analise",
  "pronta_para_publicar",
  "publicada",
] as const;

export const adminSpecialistStatusSchema = z.enum(
  adminSpecialistStatusValues,
);
export const adminDeliveryStatusSchema = z.enum(adminDeliveryStatusValues);

export const adminSpecialistSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  email: z.string().email(),
  title: z.string().min(1),
  location: z.string().min(1),
  status: adminSpecialistStatusSchema,
  companyCount: z.number().int().nonnegative(),
  activeDeliveryCount: z.number().int().nonnegative(),
  createdAt: isoDateTimeSchema,
});

export const adminDeliveryScoreSchema = z.object({
  dimension: z.string().min(1),
  score: z.number().min(1).max(5),
});

export const adminDeliverySchema = z.object({
  id: idSchema,
  diagnosticId: idSchema,
  diagnosticName: z.string().min(1),
  companyId: idSchema,
  companyName: z.string().min(1),
  specialistId: idSchema.nullable(),
  status: adminDeliveryStatusSchema,
  responseCount: z.number().int().nonnegative(),
  closedAt: isoDateTimeSchema,
  dueAt: isoDateTimeSchema,
  generalScore: z.number().min(1).max(5),
  scores: z.array(adminDeliveryScoreSchema).length(6),
});

export const adminActionPointTemplateSchema = z.object({
  id: idSchema,
  dimension: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  owner: z.string().min(1),
  involved: z.string().min(1),
  deadline: z.string().min(1),
  expectedImpact: z.string().min(1),
  successIndicator: z.string().min(1),
  priority: z.enum(["Alta", "Média", "Baixa"]),
});

export const adminDeliveryReportDraftSchema = z.object({
  executiveSummary: z.string(),
  generalReading: z.string(),
  vulnerabilities: z.string(),
  structuralCauses: z.string(),
  recommendations: z.string(),
  conclusion: z.string(),
});

export const adminDeliveryPublicationSchema = z.object({
  diagnosticId: idSchema,
  organizationId: idSchema,
  specialistId: idSchema.nullable(),
  status: adminDeliveryStatusSchema,
  report: adminDeliveryReportDraftSchema,
  dimensionReadings: z.record(idSchema, z.string()),
  selectedActionPointIds: z.array(idSchema),
  publishedAt: isoDateTimeSchema.nullable(),
  updatedAt: isoDateTimeSchema,
});

export const adminDeliveryMutationSchema = z.object({
  intent: z.enum(["save", "publish"]),
  specialistId: idSchema.nullable(),
  report: adminDeliveryReportDraftSchema,
  dimensionReadings: z.record(idSchema, z.string()),
  selectedActionPointIds: z.array(idSchema),
});

export type AdminSpecialistStatus = z.infer<
  typeof adminSpecialistStatusSchema
>;
export type AdminDeliveryStatus = z.infer<typeof adminDeliveryStatusSchema>;
export type AdminSpecialist = z.infer<typeof adminSpecialistSchema>;
export type AdminDeliveryScore = z.infer<typeof adminDeliveryScoreSchema>;
export type AdminDelivery = z.infer<typeof adminDeliverySchema>;
export type AdminActionPointTemplate = z.infer<
  typeof adminActionPointTemplateSchema
>;
export type AdminDeliveryReportDraft = z.infer<
  typeof adminDeliveryReportDraftSchema
>;
export type AdminDeliveryPublication = z.infer<
  typeof adminDeliveryPublicationSchema
>;
export type AdminDeliveryMutation = z.infer<
  typeof adminDeliveryMutationSchema
>;
