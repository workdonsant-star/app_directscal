import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { AuthSession } from "@/lib/contracts/auth";
import { changeCustomerPasswordSchema, completePasswordResetSchema } from "@/lib/contracts/password-recovery";
import { createRecoveryToken, hashRecoveryToken, openRecoveryToken, sealRecoveryToken } from "@/lib/auth/password-recovery-crypto";
import { hashPasswordCredential, verifyPasswordCredential } from "@/lib/auth/password-credentials";
import { getPasswordRecoveryConfiguration, PasswordRecoveryEmailError, sendPasswordRecoveryEmail } from "@/lib/email/password-recovery-email";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
export class PasswordRecoveryError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const db = () => createSupabaseAdminClient().schema("app_private");
const credentialSchema = z.object({ passwordHash: z.string().min(1) });
export async function getUserSessionVersion(userId: string) {
  const { data, error } = await db().rpc("get_user_session_version", { p_user_id: userId });
  if (error) throw new Error("Não foi possível validar a sessão.");
  return z.union([z.uuid(), z.literal("initial")]).parse(data);
}
export async function requestCustomerPasswordReset(email: string) {
  const config = getPasswordRecoveryConfiguration();
  const id = randomUUID(), token = createRecoveryToken(id);
  const { data, error } = await db().rpc("start_customer_password_reset", { p_id: id, p_email: email.trim().toLowerCase(), p_token_hash: hashRecoveryToken(token), p_sealed_token: sealRecoveryToken(id, token, config.url) as Json });
  if (error) throw new PasswordRecoveryError(503, "A recuperação está indisponível. Tente novamente mais tarde.");
  return data;
}
export async function processPasswordResetDelivery(id?: string) {
  const { data, error } = await db().rpc("claim_password_reset_delivery", id ? { p_id: id } : {});
  if (error) throw new Error("Não foi possível reservar o envio.");
  if (!data) return false;
  const job = z.object({ id: z.uuid(), leaseId: z.uuid(), email: z.email(), sealedToken: z.unknown() }).parse(data);
  let messageId: string | null = null; let retryable = false; let retryAfter = 60;
  try {
    const { token, url } = openRecoveryToken(job.id, job.sealedToken);
    const link = new URL(url); link.hash = new URLSearchParams({ codigo: token }).toString();
    messageId = await sendPasswordRecoveryEmail(job.id, job.email, link.href);
  } catch (cause) {
    retryable = cause instanceof PasswordRecoveryEmailError && cause.retryable;
    if (cause instanceof PasswordRecoveryEmailError) retryAfter = cause.retryAfter;
  }
  const saved = await db().rpc("finish_password_reset_delivery", { p_id: job.id, p_lease_id: job.leaseId, p_message_id: messageId, p_retryable: retryable, p_retry_after: retryAfter });
  if (saved.error) throw new Error("Não foi possível confirmar o envio. A reserva será recuperada com a mesma chave de idempotência.");
  return true;
}
function scope(session: AuthSession) {
  if (session.user.role === "superadmin" || session.acquisition || session.leadershipInvitation || !session.supabaseAccessToken) throw new PasswordRecoveryError(403, "Entre com uma conta definitiva da empresa.");
}
export async function hasCustomerPassword(session: AuthSession) {
  scope(session);
  const { data, error } = await db().rpc("get_customer_password_context", { p_user_id: session.user.id });
  if (error) throw new PasswordRecoveryError(503, "Não foi possível consultar o método de acesso.");
  return data !== null;
}
export async function changeCustomerPassword(session: AuthSession, rawInput: unknown) {
  scope(session);
  const input = changeCustomerPasswordSchema.parse(rawInput);
  const { data, error } = await db().rpc("get_customer_password_context", { p_user_id: session.user.id });
  if (error) throw new PasswordRecoveryError(503, "Não foi possível verificar a senha atual.");
  if (!data) throw new PasswordRecoveryError(409, "Esta conta usa Google para entrar. Gerencie sua senha na conta Google.");
  const attempt = await db().rpc("start_customer_password_change", { p_user_id: session.user.id });
  if (attempt.error) throw new PasswordRecoveryError(503, "Não foi possível verificar a senha atual.");
  if (!attempt.data) throw new PasswordRecoveryError(429, "Aguarde quinze minutos antes de tentar alterar a senha novamente.");
  const credential = credentialSchema.parse(data);
  if (!verifyPasswordCredential(input.currentPassword, credential.passwordHash)) throw new PasswordRecoveryError(400, "A senha atual não confere.");
  const result = await db().rpc("change_customer_password", { p_user_id: session.user.id, p_expected_hash: credential.passwordHash, p_new_hash: hashPasswordCredential(input.password) });
  if (result.error) throw new PasswordRecoveryError(result.error.code === "PT409" ? 409 : 503, "Não foi possível alterar a senha. Entre novamente e confira o método de acesso.");
}
export async function completeCustomerPasswordReset(rawInput: unknown) {
  const input = completePasswordResetSchema.parse(rawInput), tokenHash = hashRecoveryToken(input.token);
  const { data, error } = await db().rpc("get_customer_password_reset_context", { p_token_hash: tokenHash });
  if (error) throw new PasswordRecoveryError(503, "A recuperação está indisponível. Tente novamente mais tarde.");
  if (!data) throw new PasswordRecoveryError(400, "O link é inválido, expirou ou já foi utilizado. Solicite um novo link.");
  const credential = credentialSchema.parse(data);
  const result = await db().rpc("complete_customer_password_reset", { p_token_hash: tokenHash, p_expected_hash: credential.passwordHash, p_new_hash: hashPasswordCredential(input.password) });
  if (result.error || !result.data) throw new PasswordRecoveryError(result.error?.code === "PT409" || !result.error ? 400 : 503, "O link não está mais disponível. Solicite um novo link e tente novamente.");
}
