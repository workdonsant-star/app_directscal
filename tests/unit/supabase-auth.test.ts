import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMock = vi.hoisted(() => ({
  state: {
    lead: null as { id: string } | null,
    member: null as { id: string } | null,
    user: null as { id: string } | null,
  },
}));

vi.mock("@/lib/supabase/server", () => {
  function createBuilder(table: string) {
    return {
      eq() {
        return this;
      },
      ilike() {
        return this;
      },
      limit() {
        return this;
      },
      maybeSingle() {
        if (table === "users") {
          return Promise.resolve({ data: supabaseMock.state.user, error: null });
        }

        if (table === "organization_members") {
          return Promise.resolve({
            data: supabaseMock.state.member,
            error: null,
          });
        }

        if (table === "acquisition_leads") {
          return Promise.resolve({ data: supabaseMock.state.lead, error: null });
        }

        return Promise.resolve({ data: null, error: null });
      },
      select() {
        return this;
      },
    };
  }

  return {
    createSupabaseAdminClient: () => ({
      from: (table: string) => createBuilder(table),
      schema: () => ({
        from: (table: string) => createBuilder(table),
      }),
    }),
  };
});

import { checkUserHasActiveAccess } from "@/lib/auth/supabase-auth";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = {
    ...originalEnv,
    SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    SUPABASE_URL: "https://example.supabase.co",
  };
  supabaseMock.state.lead = null;
  supabaseMock.state.member = null;
  supabaseMock.state.user = null;
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.clearAllMocks();
});

describe("checkUserHasActiveAccess", () => {
  it("rejects adapter-only users without membership or completed lead", async () => {
    supabaseMock.state.user = { id: "user_1" };

    await expect(
      checkUserHasActiveAccess("diretorio@fahtomediagroup.com"),
    ).resolves.toBe(false);
  });

  it("accepts users with an organization membership", async () => {
    supabaseMock.state.user = { id: "user_1" };
    supabaseMock.state.member = { id: "member_1" };

    await expect(
      checkUserHasActiveAccess("diretorio@fahtomediagroup.com"),
    ).resolves.toBe(true);
  });

  it("accepts users with a completed acquisition lead", async () => {
    supabaseMock.state.user = { id: "user_1" };
    supabaseMock.state.lead = { id: "lead_1" };

    await expect(
      checkUserHasActiveAccess("diretorio@fahtomediagroup.com"),
    ).resolves.toBe(true);
  });
});
