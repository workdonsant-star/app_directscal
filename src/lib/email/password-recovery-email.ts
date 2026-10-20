import "server-only";
import { getPublicAppUrl } from "@/lib/env";
export class PasswordRecoveryEmailError extends Error {
  constructor(public retryable: boolean, public retryAfter = 60) { super("Não foi possível enviar as instruções."); }
}
export function getPasswordRecoveryConfiguration() {
  const apiKey = process.env.RESEND_API_KEY, from = process.env.RESEND_FROM_EMAIL;
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const url = new URL(getPublicAppUrl());
  const local = process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if (!apiKey || !from || !secret || secret.length < 32 || url.username || url.password || url.search || url.hash || url.pathname !== "/" || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) throw new PasswordRecoveryEmailError(false);
  return { apiKey, from, url: new URL("/recuperar-senha", url).href };
}
const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
export function renderPasswordRecoveryEmail(url: string) {
  return {
    subject: "Redefina sua senha na DirectScal",
    text: `Recebemos uma solicitação para redefinir sua senha na DirectScal.\n\nUse este link em até uma hora:\n${url}\n\nO link funciona uma única vez. Use a solicitação mais recente. Se você não solicitou a alteração, ignore esta mensagem. Sua senha permanece como está.`,
    html: `<!doctype html><html lang="pt-BR"><head><title>Redefinir senha — DirectScal</title></head><body style="margin:0;background:#f6f7f9;color:#15171a;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:560px;margin:auto;background:#fff"><tr><td style="padding:32px"><h1 style="font-size:24px">Redefina sua senha</h1><p style="font-size:16px;line-height:1.6">Recebemos uma solicitação para redefinir sua senha na DirectScal. O link funciona uma única vez e expira em uma hora.</p><p><a href="${escape(url)}" style="display:inline-block;padding:14px 20px;background:#185eff;color:#fff;text-decoration:none;border-radius:6px;font-size:16px">Redefinir senha</a></p><p style="font-size:16px;line-height:1.6">Use a solicitação mais recente. Se você não solicitou a alteração, ignore esta mensagem. Sua senha permanece como está.</p></td></tr></table></td></tr></table></body></html>`,
  };
}
export async function sendPasswordRecoveryEmail(id: string, email: string, url: string) {
  const config = getPasswordRecoveryConfiguration();
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `password-reset-${id}` },
      body: JSON.stringify({ from: config.from, to: [email], ...renderPasswordRecoveryEmail(url), reply_to: process.env.RESEND_REPLY_TO_EMAIL || undefined }),
    });
  } catch { throw new PasswordRecoveryEmailError(true); }
  const body = await response.json().catch(() => null);
  if (!response.ok || typeof body?.id !== "string" || !body.id) throw new PasswordRecoveryEmailError(response.status >= 500 || response.status === 429 || response.ok, Number(response.headers.get("retry-after")) || 60);
  return body.id as string;
}
