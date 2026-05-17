import { NextResponse } from "next/server";
import { z } from "zod";

import {
  acquisitionOauthIntentCookieName,
  isAcquisitionAccountConflictError,
  registerAcquisitionPasswordUser,
} from "@/lib/data/acquisition-data-source";
import {
  authSessionCookieName,
  getAuthCookieOptions,
} from "@/lib/auth/mock-auth";

const registerInputSchema = z.object({
  password: z.string().min(8),
  token: z.string().min(1),
  values: z.record(z.string(), z.string()),
});

function clearCampaignCookies(response: NextResponse) {
  response.cookies.set(authSessionCookieName, "", {
    ...getAuthCookieOptions(false),
    maxAge: 0,
  });
  response.cookies.set(acquisitionOauthIntentCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Envie os dados para criar o acesso." },
      { status: 400 },
    );
  }

  const parsed = registerInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revise os dados e use uma senha com pelo menos 8 caracteres." },
      { status: 400 },
    );
  }

  try {
    const registration = await registerAcquisitionPasswordUser(parsed.data);
    const response = NextResponse.json(
      {
        email: registration.lead.email,
        ok: true,
      },
      { status: 201 },
    );

    clearCampaignCookies(response);

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível criar o acesso.",
      },
      { status: isAcquisitionAccountConflictError(error) ? 409 : 400 },
    );
  }
}
