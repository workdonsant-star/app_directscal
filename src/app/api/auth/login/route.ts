import { NextResponse } from "next/server";

import { isDevPasswordLoginEnabled } from "@/lib/auth/access-control";
import { signInInputSchema } from "@/lib/contracts";
import {
  authSessionCookieName,
  authenticateMockUser,
  createAuthSession,
  getAuthCookieOptions,
} from "@/lib/auth/mock-auth";

export async function POST(request: Request) {
  if (!isDevPasswordLoginEnabled()) {
    return NextResponse.json(
      { message: "Login por senha está desativado neste ambiente." },
      { status: 403 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Envie e-mail e senha para entrar." },
      { status: 400 },
    );
  }

  const parsed = signInInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revise o e-mail e a senha informados." },
      { status: 400 },
    );
  }

  const user = authenticateMockUser(parsed.data);

  if (!user) {
    return NextResponse.json(
      { message: "E-mail ou senha inválidos." },
      { status: 401 },
    );
  }

  const session = createAuthSession(user, parsed.data.remember);
  const response = NextResponse.json({ session }, { status: 200 });

  response.cookies.set(
    authSessionCookieName,
    session.token,
    getAuthCookieOptions(parsed.data.remember),
  );

  return response;
}
