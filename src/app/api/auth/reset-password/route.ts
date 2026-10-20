import { NextResponse } from "next/server";
import { after } from "next/server";
import { processPasswordResetDelivery, requestCustomerPasswordReset } from "@/lib/auth/password-recovery";

import { resetPasswordInputSchema } from "@/lib/contracts";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Informe o e-mail da conta." },
      { status: 400 },
    );
  }

  const parsed = resetPasswordInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Informe um e-mail válido." },
      { status: 400 },
    );
  }

  let id: string | null;
  try { id = await requestCustomerPasswordReset(parsed.data.email); }
  catch { return NextResponse.json({ message: "A recuperação está indisponível. Tente novamente mais tarde." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
  if (id) after(async () => { try { await processPasswordResetDelivery(id); } catch { console.error("[auth] password recovery delivery unavailable"); } });
  return NextResponse.json(
    {
      message:
        "Solicitação recebida. Se houver uma conta com senha cadastrada e acesso ativo, você receberá as instruções. Confira sua caixa de entrada e spam. Para acesso com Google, use Entrar com Google.",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
