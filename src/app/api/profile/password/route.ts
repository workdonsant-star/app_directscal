import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { changeCustomerPasswordSchema } from "@/lib/contracts/password-recovery";
import { changeCustomerPassword, PasswordRecoveryError } from "@/lib/auth/password-recovery";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" }, session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401, headers });
  if (session.user.role === "superadmin" || session.acquisition || session.leadershipInvitation || !session.supabaseAccessToken) return NextResponse.json({ message: "Entre com uma conta definitiva da empresa." }, { status: 403, headers });
  const input = changeCustomerPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ message: "Confira a senha atual e escolha uma senha diferente, de 12 a 128 caracteres, com confirmação igual." }, { status: 400, headers });
  try { await changeCustomerPassword(session, input.data); return NextResponse.json({ message: "Senha alterada. Entre novamente." }, { headers }); }
  catch (error) { return NextResponse.json({ message: error instanceof PasswordRecoveryError ? error.message : "Não foi possível alterar a senha." }, { status: error instanceof PasswordRecoveryError ? error.status : 503, headers }); }
}
