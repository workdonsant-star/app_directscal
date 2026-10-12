import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

const captured = vi.hoisted(() => ({ config: undefined as NextAuthConfig | undefined }));
vi.mock("next-auth", () => ({ default: (config: NextAuthConfig) => { captured.config = config; return {}; } }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@auth/supabase-adapter", () => ({ SupabaseAdapter: vi.fn() }));
vi.mock("@/lib/auth/supabase-auth", () => ({
  getSupabaseAdapterConfig: () => null,
  resolveSupabaseAuthUser: vi.fn(),
  attachSupabaseAccessTokenToSession: vi.fn(),
  authenticateSuperadminPasswordUser: vi.fn(),
  checkUserHasActiveAccess: vi.fn(),
  ensureSupabaseAuthUserProvisioned: vi.fn(),
}));
vi.mock("@/lib/data/acquisition-data-source", () => ({
  acquisitionOauthIntentCookieName: "acquisition-intent",
  authenticateAcquisitionPasswordUser: vi.fn(),
  getAcquisitionOauthIntent: vi.fn(),
  resolveAcquisitionAuthUser: vi.fn(),
}));
vi.mock("@/lib/data/organization-structure-data-source", () => ({ getLeadershipInvitationPreview: vi.fn() }));

import "../../auth";
import { resolveSupabaseAuthUser } from "@/lib/auth/supabase-auth";

const user = { id: "user-test", email: "owner@example.com", name: "Dono", company: "Empresa", role: "cliente" as const };

async function refresh(token: JWT) {
  const callback = captured.config?.callbacks?.jwt;
  if (!callback) throw new Error("Callback JWT não registrado.");
  return callback({ token } as Parameters<typeof callback>[0]);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(resolveSupabaseAuthUser).mockResolvedValue(user);
});

describe("promoção da sessão temporária", () => {
  it.each(["acquisition", "leadershipInvitation"] as const)("remove %s após confirmar membership, sem novo login", async (intent) => {
    const token = { userId: user.id, email: user.email, company: "Empresa pendente", [intent]: true };
    const result = await refresh(token);
    expect(resolveSupabaseAuthUser).toHaveBeenCalledWith(user.id, user.email);
    expect(result).toMatchObject({ userId: user.id, company: "Empresa", role: "cliente" });
    expect(result?.acquisition).toBeUndefined();
    expect(result?.leadershipInvitation).toBeUndefined();
  });
  it("preserva o intent enquanto o cadastro não tem membership", async () => {
    vi.mocked(resolveSupabaseAuthUser).mockResolvedValue(null);
    expect(await refresh({ userId: user.id, email: user.email, acquisition: true })).toMatchObject({ acquisition: true });
  });
  it("não consulta membership novamente para uma sessão já regular", async () => {
    await refresh({ userId: user.id, email: user.email, role: "cliente" });
    expect(resolveSupabaseAuthUser).not.toHaveBeenCalled();
  });
});
