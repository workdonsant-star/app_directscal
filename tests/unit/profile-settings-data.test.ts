import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  getCurrentAuthSession: vi.fn(),
}));

import type { AuthUser } from "@/lib/contracts";
import { getProfileSettingsData } from "@/lib/data/omdx-data-source";
import { mockUserProfile } from "@/lib/mock-data";

describe("getProfileSettingsData", () => {
  it("uses the authenticated user identity instead of the mock profile", () => {
    const user: AuthUser = {
      id: "user_joao",
      name: "João Felix",
      email: "joaofelix@shippingcaps.com.br",
      company: "Shipping Caps",
      role: "cliente",
    };

    const profile = getProfileSettingsData(user);

    expect(profile.id).toBe(user.id);
    expect(profile.name).toBe(user.name);
    expect(profile.email).toBe(user.email);
    expect(profile.company).toBe(user.company);
    expect(profile.employeeCount).toBe(mockUserProfile.employeeCount);
    expect(profile.name).not.toBe(mockUserProfile.name);
  });
});
