import { z } from "zod";

import { idSchema, isoDateTimeSchema } from "@/lib/contracts/omdx";

export const operationalMemberStatusValues = [
  "aprovado",
  "pendente_aprovacao",
  "rejeitado",
] as const;

export const operationalMemberStatusSchema = z.enum(
  operationalMemberStatusValues,
);

export const operationalMemberSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  name: z.string().min(1),
  email: z.string().email(),
  area: z.string().min(1),
  operationalRole: z.string().min(1),
  perceivedResponsibilities: z.string().min(1),
  participatesInAreaDecisions: z.boolean(),
  status: operationalMemberStatusSchema,
  submittedAt: isoDateTimeSchema,
});

export const operationalOnboardingWorkspaceSchema = z.object({
  organizationId: idSchema,
  organizationName: z.string().min(1),
  authorizedDomain: z.string().min(1),
  publicUrl: z.string().url(),
  previewPath: z.string().min(1),
  required: z.boolean(),
  hasMinimumApprovedMember: z.boolean(),
  members: z.array(operationalMemberSchema),
});

export const operationalMemberRegistrationWorkspaceSchema = z.object({
  token: z.string().min(1),
  organizationName: z.string().min(1),
  authorizedDomain: z.string().min(1),
});

export const operationalMemberRegistrationInputSchema = z
  .object({
    token: z.string().min(1),
    name: z.string().trim().min(1),
    email: z.string().trim().email(),
    area: z.string().trim().min(1),
    operationalRole: z.string().trim().min(1),
    perceivedResponsibilities: z.string().trim().min(1),
    participatesInAreaDecisions: z.boolean(),
  })
  .strict();

export type OperationalMemberStatus = z.infer<
  typeof operationalMemberStatusSchema
>;
export type OperationalMember = z.infer<typeof operationalMemberSchema>;
export type OperationalOnboardingWorkspace = z.infer<
  typeof operationalOnboardingWorkspaceSchema
>;
export type OperationalMemberRegistrationWorkspace = z.infer<
  typeof operationalMemberRegistrationWorkspaceSchema
>;
export type OperationalMemberRegistrationInput = z.infer<
  typeof operationalMemberRegistrationInputSchema
>;
