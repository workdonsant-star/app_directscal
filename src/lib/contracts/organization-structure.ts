import { z } from "zod";

import { idSchema, isoDateTimeSchema } from "./omdx";

export const leadershipInviteDisplayStatusSchema = z.enum([
  "convite_pendente",
  "convite_enviado",
  "envio_falhou",
  "ativo",
  "inativo",
]);

export const organizationAccessLevelSchema = z.enum(["owner", "admin"]);

export const organizationLeaderSchema = z.object({
  accessLevel: organizationAccessLevelSchema,
  id: idSchema,
  email: z.string().email(),
  name: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  position: z.string().min(2),
});

export const organizationSectorSchema = z.object({
  id: idSchema,
  name: z.string().min(2),
  active: z.boolean(),
  leader: organizationLeaderSchema,
  inviteStatus: leadershipInviteDisplayStatusSchema,
  lastInviteSentAt: isoDateTimeSchema.nullable(),
  createdAt: isoDateTimeSchema,
});

export const createOrganizationSectorInputSchema = z.object({
  accessLevel: organizationAccessLevelSchema,
  name: z.string().trim().min(2).max(120),
  leaderEmail: z.string().trim().toLowerCase().email().max(254),
  leaderPosition: z.string().trim().min(2).max(120),
});

export type LeadershipInviteDisplayStatus = z.infer<
  typeof leadershipInviteDisplayStatusSchema
>;
export type OrganizationAccessLevel = z.infer<
  typeof organizationAccessLevelSchema
>;
export type OrganizationLeader = z.infer<typeof organizationLeaderSchema>;
export type OrganizationSector = z.infer<typeof organizationSectorSchema>;
export type CreateOrganizationSectorInput = z.infer<
  typeof createOrganizationSectorInputSchema
>;
