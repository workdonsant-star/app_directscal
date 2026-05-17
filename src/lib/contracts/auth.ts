import { z } from "zod";

import { idSchema, isoDateTimeSchema } from "./omdx";

export const authRoleSchema = z.enum(["superadmin", "admin", "cliente"]);

export const authUserSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().min(1),
  role: authRoleSchema,
});

export const authSessionSchema = z.object({
  acquisition: z.boolean().optional(),
  token: z.string().min(1),
  supabaseAccessToken: z.string().min(1).optional(),
  user: authUserSchema,
  createdAt: isoDateTimeSchema,
  expiresAt: isoDateTimeSchema,
});

export const signInInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean().default(false),
});

export const signUpInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().min(1),
  password: z.string().min(8),
});

export const resetPasswordInputSchema = z.object({
  email: z.string().email(),
});

export type AuthRole = z.infer<typeof authRoleSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type SignInInput = z.infer<typeof signInInputSchema>;
export type SignUpInput = z.infer<typeof signUpInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
