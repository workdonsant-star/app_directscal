import { SupabaseAdapter } from "@auth/supabase-adapter";
import { cookies } from "next/headers";
import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import {
  isCorporateEmailAllowed,
  resolveAuthUserFromGoogleProfile,
} from "@/lib/auth/access-control";
import {
  attachSupabaseAccessTokenToSession,
  authenticateSuperadminPasswordUser,
  checkUserHasActiveAccess,
  ensureSupabaseAuthUserProvisioned,
  getSupabaseAdapterConfig,
  resolveSupabaseAuthUser,
} from "@/lib/auth/supabase-auth";
import {
  acquisitionOauthIntentCookieName,
  authenticateAcquisitionPasswordUser,
  getAcquisitionOauthIntent,
  resolveAcquisitionAuthUser,
} from "@/lib/data/acquisition-data-source";
import type { AuthUser } from "@/lib/contracts";

const supabaseAdapterConfig = getSupabaseAdapterConfig();

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "production"
    ? undefined
    : "directscal-local-development-auth-secret");

async function getActiveAcquisitionOauthIntent() {
  try {
    const cookieStore = await cookies();

    return getAcquisitionOauthIntent(
      cookieStore.get(acquisitionOauthIntentCookieName)?.value,
    );
  } catch {
    return null;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function writeTokenUser({
  acquisition,
  token,
  user,
}: {
  acquisition?: boolean;
  token: JWT;
  user: AuthUser;
}) {
  token.acquisition = acquisition ? true : undefined;
  token.userId = user.id;
  token.name = user.name;
  token.email = user.email;
  token.company = user.company;
  token.role = user.role;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...(supabaseAdapterConfig
    ? {
        adapter: SupabaseAdapter(supabaseAdapterConfig),
      }
    : {}),
  secret: authSecret,
  pages: {
    error: "/entrar",
    signIn: "/entrar",
  },
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        flow: { label: "Fluxo", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : "";
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";
        const flow =
          typeof credentials?.flow === "string"
            ? credentials.flow
            : "acquisition";

        if (!email || !password) return null;

        if (flow === "app") {
          return authenticateSuperadminPasswordUser({ email, password });
        }

        if (flow !== "acquisition") return null;

        return authenticateAcquisitionPasswordUser({ email, password });
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const acquisitionIntent = await getActiveAcquisitionOauthIntent();

      if (acquisitionIntent) return;

      await ensureSupabaseAuthUserProvisioned(user);
    },
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "credentials") return true;
      if (account?.provider !== "google") return false;

      const googleProfile = profile as { email?: unknown; email_verified?: unknown };
      if (googleProfile?.email_verified !== true) return false;
      if (typeof googleProfile.email !== "string") return false;

      const email = normalizeEmail(googleProfile.email);

      const acquisitionIntent = await getActiveAcquisitionOauthIntent();
      if (acquisitionIntent) return true;

      if (supabaseAdapterConfig) {
        const hasActiveAccess = await checkUserHasActiveAccess(email).catch(
          () => false,
        );
        if (hasActiveAccess) return true;
      }

      return isCorporateEmailAllowed(email);
    },
    async jwt({ account, profile, token, user }) {
      if (account?.provider === "credentials" && user) {
        if (user.role === "superadmin") {
          const superadminUser = await resolveSupabaseAuthUser(
            user.id,
            user.email,
          );

          if (superadminUser?.role === "superadmin") {
            writeTokenUser({ token, user: superadminUser });
          }
        } else {
          const acquisitionUser = await resolveAcquisitionAuthUser(
            user.id,
            user.email,
          );

          if (acquisitionUser) {
            writeTokenUser({ acquisition: true, token, user: acquisitionUser });
          }
        }
      } else if (account?.provider === "google" && profile) {
        const googleProfile = profile as {
          email?: unknown;
          name?: unknown;
          picture?: unknown;
        };
        const email =
          typeof googleProfile.email === "string"
            ? normalizeEmail(googleProfile.email)
            : null;
        const userId =
          typeof user?.id === "string"
            ? user.id
            : typeof token.sub === "string"
              ? token.sub
              : null;
        const acquisitionIntent = await getActiveAcquisitionOauthIntent();

        if (acquisitionIntent && email && userId) {
          writeTokenUser({
            acquisition: true,
            token,
            user: {
              company: "Empresa pendente",
              email,
              id: userId,
              name:
                typeof googleProfile.name === "string" &&
                googleProfile.name.trim()
                  ? googleProfile.name.trim()
                  : email,
              role: "cliente",
            },
          });
        } else {
          const databaseUser = await resolveSupabaseAuthUser(userId, email);
          const googleUser =
            databaseUser ?? resolveAuthUserFromGoogleProfile(profile);

          if (googleUser) {
            writeTokenUser({ token, user: googleUser });
          }
        }
      }

      return token;
    },
    async session({ session, token, user }) {
      session.acquisition = token.acquisition === true;

      const tokenUserId =
        typeof token?.userId === "string" ? token.userId : undefined;
      const tokenEmail =
        typeof token?.email === "string" ? token.email : undefined;
      const sessionUser =
        token.acquisition === true
          ? await resolveAcquisitionAuthUser(tokenUserId, tokenEmail)
          : await resolveSupabaseAuthUser(
              user?.id ?? tokenUserId,
              user?.email ?? tokenEmail,
            );
      const databaseUser = sessionUser;

      if (databaseUser) {
        session.user.id = databaseUser.id;
        session.user.name = databaseUser.name;
        session.user.email = databaseUser.email;
        session.user.company = databaseUser.company;
        session.user.role = databaseUser.role;
        session.user.image =
          typeof user?.image === "string"
            ? user.image
            : typeof token.picture === "string"
              ? token.picture
              : undefined;

        attachSupabaseAccessTokenToSession({
          email: databaseUser.email,
          expires: session.expires,
          session,
          userId: databaseUser.id,
        });

        return session;
      }

      if (
        typeof token?.userId === "string" &&
        typeof token.name === "string" &&
        typeof token.email === "string" &&
        typeof token.company === "string" &&
        (token.role === "superadmin" ||
          token.role === "admin" ||
          token.role === "cliente")
      ) {
        session.user.id = token.userId;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.company = token.company;
        session.user.role = token.role;
        session.user.image =
          typeof token.picture === "string" ? token.picture : undefined;

        attachSupabaseAccessTokenToSession({
          email: token.email,
          expires: session.expires,
          session,
          userId: token.userId,
        });
      }

      return session;
    },
  },
});
