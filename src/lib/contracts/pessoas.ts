import { z } from "zod";

import { idSchema, isoDateSchema, isoDateTimeSchema } from "./omdx";

export const peopleEmploymentTypeValues = [
  "pj",
  "clt",
  "socio",
  "afiliado",
  "freelancer",
  "temporario",
  "outro",
] as const;

export const peoplePersonStatusValues = [
  "rascunho",
  "pendente",
  "ativo",
  "em_revisao",
  "inativo",
] as const;

export const peoplePaymentStatusValues = [
  "nao_calculado",
  "calculado",
  "com_pendencia",
  "em_revisao",
  "aprovado",
  "exportado",
  "pago",
  "cancelado",
  "reaberto",
] as const;

export const peopleDocumentStatusValues = [
  "pendente",
  "valido",
  "vence_em_breve",
  "vencido",
] as const;

export const peopleEmploymentTypeSchema = z.enum(peopleEmploymentTypeValues);
export const peoplePersonStatusSchema = z.enum(peoplePersonStatusValues);
export const peoplePaymentStatusSchema = z.enum(peoplePaymentStatusValues);
export const peopleDocumentStatusSchema = z.enum(peopleDocumentStatusValues);

export const peopleRemunerationSchema = z.object({
  fixedAmount: z.number().nonnegative(),
  variableForecast: z.number().nonnegative(),
  bonusProvision: z.number().nonnegative(),
  benefitsCost: z.number().nonnegative(),
  chargesEstimate: z.number().nonnegative(),
  currency: z.literal("BRL"),
  totalMonthlyCost: z.number().nonnegative(),
});

export const peopleBenefitSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  companyCost: z.number().nonnegative(),
  personDiscount: z.number().nonnegative(),
  recurrence: z.string().min(1),
  status: z.enum(["ativo", "pendente", "encerrado"]),
});

export const peopleDocumentSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  type: z.string().min(1),
  status: peopleDocumentStatusSchema,
  dueDate: isoDateSchema.nullable(),
});

export const peoplePaymentSchema = z.object({
  id: idSchema,
  personId: idSchema,
  personName: z.string().min(1),
  competence: z.string().regex(/^\d{4}-\d{2}$/),
  dueDate: isoDateSchema,
  fixedAmount: z.number().nonnegative(),
  variableAmount: z.number().nonnegative(),
  benefitsAmount: z.number().nonnegative(),
  reimbursementsAmount: z.number().nonnegative(),
  discountsAmount: z.number().nonnegative(),
  chargesAmount: z.number().nonnegative(),
  netAmount: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
  status: peoplePaymentStatusSchema,
  pendingReasons: z.array(z.string().min(1)),
});

export const peoplePersonSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  name: z.string().min(1),
  email: z.string().email(),
  status: peoplePersonStatusSchema,
  employmentType: peopleEmploymentTypeSchema,
  area: z.string().min(1),
  operationalRole: z.string().min(1),
  formalRole: z.string().nullable(),
  manager: z.string().nullable(),
  costCenter: z.string().min(1),
  startedAt: isoDateSchema,
  companyName: z.string().nullable(),
  paymentMethod: z.string().min(1),
  paymentKey: z.string().nullable(),
  remuneration: peopleRemunerationSchema,
  benefits: z.array(peopleBenefitSchema),
  documents: z.array(peopleDocumentSchema),
  responsibilities: z.array(z.string().min(1)),
  competencies: z.array(z.string().min(1)),
  paymentHistory: z.array(peoplePaymentSchema),
  updatedAt: isoDateTimeSchema,
});

export const peopleCostBreakdownSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
});

export const peopleOverviewAlertSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(["alta", "media", "baixa"]),
});

export const peopleOverviewWorkspaceSchema = z.object({
  organizationId: idSchema,
  competence: z.string().regex(/^\d{4}-\d{2}$/),
  totalPeopleCost: z.number().nonnegative(),
  recurringCost: z.number().nonnegative(),
  variableCost: z.number().nonnegative(),
  cltCost: z.number().nonnegative(),
  pjCost: z.number().nonnegative(),
  activePeople: z.number().int().nonnegative(),
  pendingPayments: z.number().int().nonnegative(),
  pendingDocuments: z.number().int().nonnegative(),
  incompleteProfiles: z.number().int().nonnegative(),
  approvedAmount: z.number().nonnegative(),
  pendingAmount: z.number().nonnegative(),
  costByEmploymentType: z.array(peopleCostBreakdownSchema),
  costByArea: z.array(peopleCostBreakdownSchema),
  alerts: z.array(peopleOverviewAlertSchema),
  payments: z.array(peoplePaymentSchema),
});

export const peopleDirectoryWorkspaceSchema = z.object({
  organizationId: idSchema,
  people: z.array(peoplePersonSchema),
});

export const peopleProfileWorkspaceSchema = z.object({
  person: peoplePersonSchema,
});

export const peopleClosingStepSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(["concluido", "em_andamento", "pendente"]),
});

export const peopleMonthlyClosingWorkspaceSchema = z.object({
  organizationId: idSchema,
  competence: z.string().regex(/^\d{4}-\d{2}$/),
  status: z.enum(["aberto", "em_revisao", "aprovado", "exportado"]),
  openedAt: isoDateTimeSchema,
  approvedAt: isoDateTimeSchema.nullable(),
  exportedAt: isoDateTimeSchema.nullable(),
  totalToPay: z.number().nonnegative(),
  totalCost: z.number().nonnegative(),
  approvedAmount: z.number().nonnegative(),
  pendingAmount: z.number().nonnegative(),
  payments: z.array(peoplePaymentSchema),
  steps: z.array(peopleClosingStepSchema),
});

export const peopleConfigurationWorkspaceSchema = z.object({
  organizationId: idSchema,
  employmentTypes: z.array(
    z.object({
      id: peopleEmploymentTypeSchema,
      label: z.string().min(1),
      description: z.string().min(1),
    }),
  ),
  costCenters: z.array(z.string().min(1)),
  documentTypes: z.array(z.string().min(1)),
  paymentStatuses: z.array(
    z.object({
      id: peoplePaymentStatusSchema,
      label: z.string().min(1),
    }),
  ),
});

export type PeopleEmploymentType = z.infer<
  typeof peopleEmploymentTypeSchema
>;
export type PeoplePersonStatus = z.infer<typeof peoplePersonStatusSchema>;
export type PeoplePaymentStatus = z.infer<typeof peoplePaymentStatusSchema>;
export type PeopleDocumentStatus = z.infer<typeof peopleDocumentStatusSchema>;
export type PeopleRemuneration = z.infer<typeof peopleRemunerationSchema>;
export type PeopleBenefit = z.infer<typeof peopleBenefitSchema>;
export type PeopleDocument = z.infer<typeof peopleDocumentSchema>;
export type PeoplePayment = z.infer<typeof peoplePaymentSchema>;
export type PeoplePerson = z.infer<typeof peoplePersonSchema>;
export type PeopleCostBreakdown = z.infer<typeof peopleCostBreakdownSchema>;
export type PeopleOverviewAlert = z.infer<typeof peopleOverviewAlertSchema>;
export type PeopleOverviewWorkspace = z.infer<
  typeof peopleOverviewWorkspaceSchema
>;
export type PeopleDirectoryWorkspace = z.infer<
  typeof peopleDirectoryWorkspaceSchema
>;
export type PeopleProfileWorkspace = z.infer<
  typeof peopleProfileWorkspaceSchema
>;
export type PeopleClosingStep = z.infer<typeof peopleClosingStepSchema>;
export type PeopleMonthlyClosingWorkspace = z.infer<
  typeof peopleMonthlyClosingWorkspaceSchema
>;
export type PeopleConfigurationWorkspace = z.infer<
  typeof peopleConfigurationWorkspaceSchema
>;
