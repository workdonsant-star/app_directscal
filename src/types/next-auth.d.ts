import type { AuthRole } from "@/lib/contracts";

declare module "next-auth" {
  interface Session {
    acquisition?: boolean;
    leadershipInvitation?: boolean;
    supabaseAccessToken?: string;
    user: {
      id: string;
      name: string;
      email: string;
      company: string;
      role: AuthRole;
      image?: string | null;
    };
  }

  interface User {
    company?: string;
    role?: AuthRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    acquisition?: boolean;
    leadershipInvitation?: boolean;
    company?: string;
    role?: AuthRole;
    userId?: string;
  }
}
