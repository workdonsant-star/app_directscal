import { NextResponse } from "next/server";

import { isDevPasswordLoginEnabled } from "@/lib/auth/access-control";
import { signUpInputSchema } from "@/lib/contracts";
import {
  authSessionCookieName,
  createLocalAuthSession,
  getAuthCookieOptions,
} from "@/lib/auth/mock-auth";

export async function POST(request: Request) {
  if (!isDevPasswordLoginEnabled()) {
    return NextResponse.json(
      { message: "Cadastro por senha está desativado." },
      { status: 403 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Envie os dados da conta para continuar." },
      { status: 400 },
    );
  }

  const parsed = signUpInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revise nome, empresa, e-mail e senha." },
      { status: 400 },
    );
  }

  const session = createLocalAuthSession(true);
  const response = NextResponse.json({ session }, { status: 201 });

  response.cookies.set(
    authSessionCookieName,
    session.token,
    getAuthCookieOptions(true),
  );

  return response;
}
