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
import { clearAuthJsSessionCookies } from "@/lib/auth/authjs-cookies";

const oauthIntentInputSchema = z.object({
  slug: z.string().min(1).optional(),
  token: z.string().min(1).optional(),
});

function resolveCampaignSlug(input: z.infer<typeof oauthIntentInputSchema>) {
  return input.slug ?? input.token ?? null;
}

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
  const slug = parsed.success ? resolveCampaignSlug(parsed.data) : null;

  if (!parsed.success || !slug) {
    return NextResponse.json(
      { message: "Campanha inválida." },
      { status: 400 },
    );
  }

  try {
    const intent = await createAcquisitionOauthIntent(slug);
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
    clearAuthJsSessionCookies(response);
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
