import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import {
  isGoogleProfileAllowed,
  resolveAuthUserFromGoogleProfile,
} from "@/lib/auth/access-control";

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "production"
    ? undefined
    : "directscal-local-development-auth-secret");

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: authSecret,
  pages: {
    error: "/entrar",
    signIn: "/entrar",
  },
  providers: [Google],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider !== "google") return false;

      return isGoogleProfileAllowed(profile);
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
    session({ session, token }) {
      if (
        typeof token.userId === "string" &&
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
      }

      return session;
    },
  },
});
