import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMock = vi.hoisted(() => ({
  memberships: [
    {
      organization_id: "22222222-2222-4222-8222-222222222222",
      role: "superadmin" as const,
    },
    {
      organization_id: "33333333-3333-4333-8333-333333333333",
      role: "cliente" as const,
    },
  ],
  tablesRead: [] as string[],
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentAuthSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => ({
    from(table: string) {
      supabaseMock.tablesRead.push(table);

      return {
        eq() {
          return this;
        },
        order() {
          return this;
        },
        returns() {
          return Promise.resolve({
            data:
              table === "organization_members"
                ? supabaseMock.memberships
                : [],
            error: null,
          });
        },
        select() {
          return this;
        },
      };
    },
  }),
}));

import {
  getAccessibleOrganizationIdsForUser,
  userCanAccessModule,
  userCanAccessOrganization,
} from "@/lib/auth/authorization";

const superadminUserId = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  supabaseMock.tablesRead.length = 0;
});

describe("customer role authorization", () => {
  it("does not turn a superadmin membership into global organization access", async () => {
    await expect(
      getAccessibleOrganizationIdsForUser(superadminUserId),
    ).resolves.toEqual({
      isSuperadmin: true,
      organizationIds: [],
      primaryOrganizationId: null,
    });

    expect(supabaseMock.tablesRead).not.toContain("organizations");
  });

  it("denies customer organizations and modules to a superadmin", async () => {
    await expect(
      userCanAccessOrganization(
        superadminUserId,
        "22222222-2222-4222-8222-222222222222",
      ),
    ).resolves.toBe(false);
    await expect(
      userCanAccessModule(superadminUserId, "module_omdx"),
    ).resolves.toBe(false);
  });
});
