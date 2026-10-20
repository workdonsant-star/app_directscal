import { NextResponse } from "next/server";
import { completePasswordResetSchema } from "@/lib/contracts/password-recovery";
import { completeCustomerPasswordReset, PasswordRecoveryError } from "@/lib/auth/password-recovery";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const input = completePasswordResetSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ message: "Confira o link e informe uma senha de 12 a 128 caracteres, com confirmação igual." }, { status: 400, headers });
  try { await completeCustomerPasswordReset(input.data); return NextResponse.json({ message: "Senha alterada. Entre novamente com a nova senha." }, { headers }); }
  catch (error) { return NextResponse.json({ message: error instanceof PasswordRecoveryError ? error.message : "Não foi possível concluir a recuperação." }, { status: error instanceof PasswordRecoveryError ? error.status : 503, headers }); }
}
