import { NextResponse } from "next/server";
import { z } from "zod";

import {
  acquisitionOauthIntentCookieName,
  acquisitionOauthIntentMaxAge,
  createAcquisitionOauthIntent,
} from "@/lib/data/acquisition-data-source";
import {
  authSessionCookieName,
  getAuthCookieOptions,
} from "@/lib/auth/mock-auth";

const oauthIntentInputSchema = z.object({
  token: z.string().min(1),
});

function clearMockSession(response: NextResponse) {
  response.cookies.set(authSessionCookieName, "", {
    ...getAuthCookieOptions(false),
    maxAge: 0,
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Envie a campanha para continuar." },
      { status: 400 },
    );
  }

  const parsed = oauthIntentInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Campanha inválida." },
      { status: 400 },
    );
  }

  try {
    const intent = await createAcquisitionOauthIntent(parsed.data.token);
    const response = NextResponse.json(
      {
        callbackUrl: intent.campaign.publicPath.concat("/completar"),
        ok: true,
      },
      { status: 201 },
    );

    response.cookies.set(acquisitionOauthIntentCookieName, intent.rawToken, {
      httpOnly: true,
      maxAge: acquisitionOauthIntentMaxAge,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    clearMockSession(response);

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Não foi possível continuar.",
      },
      { status: 400 },
    );
  }
}
