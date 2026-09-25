import { cookies } from "next/headers";
import { cache } from "react";

import { auth } from "../../../auth";
import { isDevPasswordLoginEnabled } from "@/lib/auth/access-control";
import {
  authUserSchema,
  type AuthSession,
  type AuthUser,
} from "@/lib/contracts";
import {
  authSessionCookieName,
  getAuthSessionFromCookie,
} from "@/lib/auth/mock-auth";

function toAuthSession(
  user: AuthUser,
  expires: string,
  supabaseAccessToken?: string,
  acquisition?: boolean,
  leadershipInvitation?: boolean,
): AuthSession {
  return {
    acquisition: acquisition ? true : undefined,
    leadershipInvitation: leadershipInvitation ? true : undefined,
    token: `authjs:${user.id}`,
    supabaseAccessToken,
    user,
    createdAt: new Date().toISOString(),
    expiresAt: expires,
  };
}

export const getCurrentAuthSession = cache(async function getCurrentAuthSession() {
  try {
    const session = await auth();

    if (session) {
      const parsedUser = authUserSchema.safeParse(session.user);

      if (parsedUser.success) {
        return toAuthSession(
          parsedUser.data,
          session.expires,
          session.supabaseAccessToken,
          session.acquisition,
          session.leadershipInvitation,
        );
      }
    }
  } catch {
    // Google OAuth may be unconfigured in local demos. The mock cookie is only
    // honored when the explicit development password fallback is enabled.
  }

  if (!isDevPasswordLoginEnabled()) return null;

  const cookieStore = await cookies();

  return getAuthSessionFromCookie(cookieStore.get(authSessionCookieName)?.value);
});
