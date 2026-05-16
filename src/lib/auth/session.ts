import { cookies } from "next/headers";

import { auth } from "../../../auth";
import {
  authUserSchema,
  type AuthSession,
  type AuthUser,
} from "@/lib/contracts";
import {
  authSessionCookieName,
  getAuthSessionFromCookie,
} from "@/lib/auth/mock-auth";

function toAuthSession(user: AuthUser, expires: string): AuthSession {
  return {
    token: `authjs:${user.id}`,
    user,
    createdAt: new Date().toISOString(),
    expiresAt: expires,
  };
}

export async function getCurrentAuthSession() {
  try {
    const session = await auth();

    if (!session) return null;

    const parsedUser = authUserSchema.safeParse(session.user);

    if (parsedUser.success) {
      return toAuthSession(parsedUser.data, session.expires);
    }
  } catch {
    // Google OAuth may be unconfigured in local demos; the mock cookie remains
    // available so the interface can still be explored with seeded users.
  }

  const cookieStore = await cookies();

  return getAuthSessionFromCookie(cookieStore.get(authSessionCookieName)?.value);
}
