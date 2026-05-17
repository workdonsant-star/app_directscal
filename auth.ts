import { SupabaseAdapter } from "@auth/supabase-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import {
  isGoogleProfileAllowed,
  resolveAuthUserFromGoogleProfile,
} from "@/lib/auth/access-control";
import {
  attachSupabaseAccessTokenToSession,
  ensureSupabaseAuthUserProvisioned,
  getSupabaseAdapterConfig,
  resolveSupabaseAuthUser,
} from "@/lib/auth/supabase-auth";

const supabaseAdapterConfig = getSupabaseAdapterConfig();

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "production"
    ? undefined
    : "directscal-local-development-auth-secret");

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
  providers: [Google],
  session: {
    strategy: supabaseAdapterConfig ? "database" : "jwt",
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;

      await ensureSupabaseAuthUserProvisioned(user);
    },
  },
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google") return false;

      if (!isGoogleProfileAllowed(profile)) return false;

      if (user.id && user.email) {
        await ensureSupabaseAuthUserProvisioned(user);
      }

      return true;
    },
    jwt({ account, profile, token }) {
      if (account?.provider === "google" && profile) {
        const user = resolveAuthUserFromGoogleProfile(profile);

        if (user) {
          token.userId = user.id;
          token.name = user.name;
          token.email = user.email;
          token.company = user.company;
          token.role = user.role;
        }
      }

      return token;
    },
    async session({ session, token, user }) {
      const databaseUser =
        user?.id || user?.email
          ? await resolveSupabaseAuthUser(user.id, user.email)
          : null;

      if (databaseUser) {
        session.user.id = databaseUser.id;
        session.user.name = databaseUser.name;
        session.user.email = databaseUser.email;
        session.user.company = databaseUser.company;
        session.user.role = databaseUser.role;
        session.user.image = user.image;

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
