import { z } from "zod";
const password = z.string().min(12, "Use pelo menos 12 caracteres.").max(128, "Use até 128 caracteres.");
export const recoveryTokenSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[A-Za-z0-9_-]{43}$/i);
export const completePasswordResetSchema = z.object({ token: recoveryTokenSchema, password, confirmation: z.string().max(128) }).strict().refine(input => input.password === input.confirmation, { message: "As senhas não conferem.", path: ["confirmation"] });
export const changeCustomerPasswordSchema = z.object({ currentPassword: z.string().min(1).max(1024), password, confirmation: z.string().max(128) }).strict()
  .refine(input => input.password === input.confirmation, { message: "As senhas não conferem.", path: ["confirmation"] })
  .refine(input => input.password !== input.currentPassword, { message: "Escolha uma senha diferente da atual.", path: ["password"] });
