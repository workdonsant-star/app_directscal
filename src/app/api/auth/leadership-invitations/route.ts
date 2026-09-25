import { NextResponse } from "next/server";
import { z } from "zod";

import {
  leadershipInvitationOauthCookieName,
  leadershipInvitationOauthMaxAge,
} from "@/lib/auth/leadership-invitation-session";
import { clearAuthJsSessionCookies } from "@/lib/auth/authjs-cookies";
import {
  authSessionCookieName,
  getAuthCookieOptions,
} from "@/lib/auth/mock-auth";
import { acquisitionOauthIntentCookieName } from "@/lib/data/acquisition-data-source";
import { getLeadershipInvitationPreview } from "@/lib/data/organization-structure-data-source";

const startInvitationSchema = z.object({
  token: z.string().min(32).max(128),
});

function clearOtherAuthFlows(response: NextResponse) {
  clearAuthJsSessionCookies(response);
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
  const body: unknown = await request.json().catch(() => null);
  const parsed = startInvitationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Este convite não é válido." },
      { status: 400 },
    );
  }

  const invitation = await getLeadershipInvitationPreview(parsed.data.token);

  if (!invitation) {
    return NextResponse.json(
      { message: "Este convite expirou ou foi substituído." },
      { status: 410 },
    );
  }

  const response = NextResponse.json({
    callbackUrl: "/api/auth/leadership-invitations/complete",
    ok: true,
  });

  response.cookies.set(
    leadershipInvitationOauthCookieName,
    parsed.data.token,
    {
      httpOnly: true,
      maxAge: leadershipInvitationOauthMaxAge,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  );
  clearOtherAuthFlows(response);

  return response;
}
