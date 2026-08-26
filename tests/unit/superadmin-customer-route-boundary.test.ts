import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAccessibleOrganizationIdsForUser: vi.fn(),
  getCurrentAuthSession: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentAuthSession: mocks.getCurrentAuthSession,
}));

vi.mock("@/lib/auth/authorization", () => ({
  getAccessibleOrganizationIdsForUser:
    mocks.getAccessibleOrganizationIdsForUser,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

import { POST } from "@/app/api/omdx/diagnostics/route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentAuthSession.mockResolvedValue({
    user: {
      id: "11111111-1111-4111-8111-111111111111",
      role: "superadmin",
    },
  });
});

describe("superadmin customer API boundary", () => {
  it("returns 403 before resolving a customer organization", async () => {
    const response = await POST(
      new Request("http://localhost/api/omdx/diagnostics", {
        body: JSON.stringify({}),
        method: "POST",
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: "Acesso restrito à área do cliente.",
    });
    expect(mocks.getAccessibleOrganizationIdsForUser).not.toHaveBeenCalled();
  });
});
