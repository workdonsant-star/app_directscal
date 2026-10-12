import { cookies } from "next/headers";
import { cache } from "react";

import { getAccountProfile } from "@/lib/data/person-profiles-data-source";

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
  const session = await auth().catch(() => null);

  if (session) {
    const parsedUser = authUserSchema.safeParse(session.user);

    if (parsedUser.success) {
      return toAuthSession(
        { ...parsedUser.data, ...(await getAccountProfile(parsedUser.data.id)) },
        session.expires,
        session.supabaseAccessToken,
        session.acquisition,
        session.leadershipInvitation,
      );
    }
  }

  if (!isDevPasswordLoginEnabled()) return null;

  const cookieStore = await cookies();

  return getAuthSessionFromCookie(cookieStore.get(authSessionCookieName)?.value);
});
