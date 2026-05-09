import { z } from "zod";

import { idSchema, isoDateTimeSchema } from "./omdx";

export const dbUserProfileSchema = z.object({
  id: idSchema,
  organization_id: idSchema,
  name: z.string().min(1),
  email: z.string().email(),
  avatar_url: z.string().url().nullable(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const userProfileSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  name: z.string().min(1),
  email: z.string().email(),
  avatarUrl: z.string().url().nullable(),
  company: z.string().min(1),
  employeeCount: z.number().int().min(1),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const profileSettingsDataSchema = userProfileSchema;

export const updateProfileInputSchema = z.object({
  userId: idSchema,
  name: z.string().min(1),
  avatarUrl: z.string().url().nullable().optional(),
});

export const changePasswordInputSchema = z.object({
  userId: idSchema,
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const updateOrganizationInputSchema = z.object({
  organizationId: idSchema,
  employeeCount: z.number().int().min(1),
});

export type DbUserProfile = z.infer<typeof dbUserProfileSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type ProfileSettingsData = z.infer<typeof profileSettingsDataSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationInputSchema>;
