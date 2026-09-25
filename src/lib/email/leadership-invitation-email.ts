import "server-only";

type LeadershipInvitationEmailInput = {
  accessLevel: "owner" | "admin";
  companyName: string;
  invitationId: string;
  invitationUrl: string;
  leaderEmail: string;
  leaderPosition: string;
  sectorName: string;
};

type ResendSuccess = { id: string };
type ResendFailure = { message?: string; name?: string };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderLeadershipInvitationEmail(
  input: LeadershipInvitationEmailInput,
) {
  const companyName = escapeHtml(input.companyName);
  const sectorName = escapeHtml(input.sectorName);
  const leaderPosition = escapeHtml(input.leaderPosition);
  const invitationUrl = escapeHtml(input.invitationUrl);
  const accessLabel = input.accessLevel === "owner" ? "Superadmin" : "Admin";
  const accessDescription =
    input.accessLevel === "owner"
      ? "acesso completo às funcionalidades, configurações e contratos da empresa"
      : "acesso às funcionalidades da empresa, sem configurações e contratos";
  const subject = `${input.companyName} indicou você como liderança de ${input.sectorName}`;

  const html = `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#f6f7f9;color:#15171a;font-family:Inter,Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden">Confirme os dados da sua participação no diagnóstico de maturidade.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e3e5e8;border-radius:10px">
          <tr><td style="padding:32px">
            <p style="margin:0 0 24px;font-size:13px;font-weight:700;letter-spacing:.08em;color:#185eff">DIRECTSCAL</p>
            <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25">Você foi indicado como liderança</h1>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#545b66">A <strong>${companyName}</strong> registrou você como liderança do setor <strong>${sectorName}</strong>, no cargo de <strong>${leaderPosition}</strong>.</p>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#545b66">Seu nível de acesso será <strong>${accessLabel}</strong>: ${accessDescription}.</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#545b66">Revise os dados do convite. Antes de participar do diagnóstico, você confirmará sua identidade com a conta Google deste e-mail.</p>
            <a href="${invitationUrl}" style="display:inline-block;background:#185eff;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 18px;border-radius:6px">Ver detalhes do convite</a>
            <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#777f8b">Este convite expira em 7 dias. Se você não reconhece a empresa ou o setor, ignore esta mensagem.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    "Você foi indicado como liderança",
    "",
    `${input.companyName} registrou você como liderança do setor ${input.sectorName}, no cargo de ${input.leaderPosition}.`,
    `Acesso: ${accessLabel} — ${accessDescription}.`,
    "Revise os dados do convite. Antes de participar do diagnóstico, você confirmará sua identidade com a conta Google deste e-mail.",
    "",
    input.invitationUrl,
    "",
    "Este convite expira em 7 dias. Se você não reconhece a empresa ou o setor, ignore esta mensagem.",
  ].join("\n");

  return { html, subject, text };
}

export async function sendLeadershipInvitationEmail(
  input: LeadershipInvitationEmailInput,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error(
      "O envio de e-mail ainda não está configurado. Defina RESEND_API_KEY e RESEND_FROM_EMAIL.",
    );
  }

  const content = renderLeadershipInvitationEmail(input);
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from,
      html: content.html,
      reply_to: process.env.RESEND_REPLY_TO_EMAIL || undefined,
      subject: content.subject,
      text: content.text,
      to: [input.leaderEmail],
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `leadership-invitation-${input.invitationId}`,
    },
    method: "POST",
  });

  const body = (await response.json().catch(() => null)) as
    | ResendSuccess
    | ResendFailure
    | null;

  if (!response.ok || !body || !("id" in body)) {
    const detail = body && "message" in body ? body.message : null;
    throw new Error(detail || "O provedor não aceitou o envio do convite.");
  }

  return { providerMessageId: body.id };
}
