import { NextResponse } from "next/server";

import {
  authSessionCookieName,
  getAuthCookieOptions,
} from "@/lib/auth/mock-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true }, { status: 200 });

  response.cookies.set(authSessionCookieName, "", {
    ...getAuthCookieOptions(),
    maxAge: 0,
  });

  return response;
}
