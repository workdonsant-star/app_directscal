import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "../../../../../../auth";
import { clearAuthJsSessionCookies } from "@/lib/auth/authjs-cookies";
import {
  getLeadershipInvitationOauthErrorPath,
  leadershipInvitationOauthCookieName,
} from "@/lib/auth/leadership-invitation-session";
import {
  authSessionCookieName,
  getAuthCookieOptions,
} from "@/lib/auth/mock-auth";
import { acquisitionOauthIntentCookieName } from "@/lib/data/acquisition-data-source";
import { acceptLeadershipInvitation } from "@/lib/data/organization-structure-data-source";

function clearInvitationAuth(
  response: NextResponse,
  { clearSession }: { clearSession: boolean },
) {
  if (clearSession) clearAuthJsSessionCookies(response);
  response.cookies.set(authSessionCookieName, "", {
    ...getAuthCookieOptions(false),
    maxAge: 0,
  });
  response.cookies.set(leadershipInvitationOauthCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set(acquisitionOauthIntentCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(leadershipInvitationOauthCookieName)?.value;
  const session = await auth();

  if (
    !token ||
    !session?.user?.id ||
    session.leadershipInvitation !== true
  ) {
    const fallbackPath = token
      ? getLeadershipInvitationOauthErrorPath(token, "confirmacao")
      : "/entrar";
    const response = NextResponse.redirect(new URL(fallbackPath, request.url));
    clearInvitationAuth(response, { clearSession: true });
    return response;
  }

  try {
    await acceptLeadershipInvitation({ token, userId: session.user.id });

    const response = NextResponse.redirect(
      new URL("/omdx", request.url),
    );
    clearInvitationAuth(response, { clearSession: false });
    return response;
  } catch {
    const response = NextResponse.redirect(
      new URL(
        getLeadershipInvitationOauthErrorPath(token, "confirmacao"),
        request.url,
      ),
    );
    clearInvitationAuth(response, { clearSession: true });
    return response;
  }
}
