import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

const captured = vi.hoisted(() => ({ config: undefined as NextAuthConfig | undefined }));
vi.mock("@/lib/auth/password-recovery", () => ({ getUserSessionVersion: vi.fn() }));
vi.mock("next-auth", () => ({ default: (config: NextAuthConfig) => { captured.config = config; return {}; } }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@auth/supabase-adapter", () => ({ SupabaseAdapter: vi.fn() }));
vi.mock("@/lib/auth/access-snapshot", () => ({ getUserAccessSnapshot: vi.fn() }));
vi.mock("@/lib/auth/supabase-auth", async () => ({
  buildSupabaseAuthUser: (await vi.importActual<typeof import("@/lib/auth/supabase-auth")>("@/lib/auth/supabase-auth")).buildSupabaseAuthUser,
  getSupabaseAdapterConfig: () => ({ url: "https://fixture.invalid", secret: "fixture" }),
  resolveSupabaseAuthUser: vi.fn(),
  attachSupabaseAccessTokenToSession: vi.fn(),
  authenticateSuperadminPasswordUser: vi.fn(),
  authenticateCustomerPasswordUser: vi.fn(),
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
import { getUserSessionVersion } from "@/lib/auth/password-recovery";
import { getUserAccessSnapshot, type UserAccessSnapshot } from "@/lib/auth/access-snapshot";

const user = { id: "user-test", email: "owner@example.com", name: "Dono", company: "Empresa", role: "cliente" as const };

async function refresh(token: JWT) {
  const callback = captured.config?.callbacks?.jwt;
  if (!callback) throw new Error("Callback JWT não registrado.");
  return callback({ token } as Parameters<typeof callback>[0]);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(resolveSupabaseAuthUser).mockResolvedValue(user);
  vi.mocked(getUserSessionVersion).mockResolvedValue("initial");
  vi.mocked(getUserAccessSnapshot).mockResolvedValue(null);
});

describe("sessão de e-mail e senha", () => {
  it("não promove credencial de aquisição para superadmin global", async () => {
    vi.mocked(resolveSupabaseAuthUser).mockResolvedValue({ ...user, role: "superadmin" });
    const callback = captured.config?.callbacks?.jwt;
    if (!callback) throw new Error("Callback JWT não registrado.");
    await expect(callback({
      account: { provider: "credentials" },
      user,
      token: {},
    } as Parameters<typeof callback>[0])).resolves.toBeNull();
  });
  it.each(["cliente", "admin", "superadmin"] as const)("preserva o papel %s do membership e entra sem intent temporário", async (role) => {
    const databaseUser = { ...user, role };
    vi.mocked(resolveSupabaseAuthUser).mockResolvedValue(databaseUser);
    const callback = captured.config?.callbacks?.jwt;
    if (!callback) throw new Error("Callback JWT não registrado.");
    const result = await callback({
      account: { provider: "credentials" },
      user: databaseUser,
      token: { acquisition: true },
    } as Parameters<typeof callback>[0]);
    expect(result).toMatchObject({ userId: user.id, role });
    expect(result?.acquisition).toBeUndefined();
    expect(result?.leadershipInvitation).toBeUndefined();
  });
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
  it("revalida membership de uma sessão regular e recusa acesso removido", async () => {
    await refresh({ userId: user.id, email: user.email, role: "cliente" });
    expect(resolveSupabaseAuthUser).toHaveBeenCalledWith(user.id, user.email);
    vi.mocked(resolveSupabaseAuthUser).mockResolvedValue(null);
    expect(await refresh({ userId: user.id, email: user.email, role: "cliente" })).toBeNull();
  });
  it("recusa token anterior à troca de senha ou remoção de acesso", async () => {
    vi.mocked(getUserSessionVersion).mockResolvedValue("00000000-0000-4000-8000-000000000001");
    expect(await refresh({ userId: user.id, email: user.email, role: "cliente", securityVersion: "initial" })).toBeNull();
  });
});

describe("revalidação pelo snapshot de acesso", () => {
  const userId = "11111111-1111-4111-8111-111111111111";
  const organizationId = "22222222-2222-4222-8222-222222222222";
  const snapshot: UserAccessSnapshot = {
    sessionVersion: "initial",
    user: { id: userId, email: "Owner@Example.com", name: "Dono", image: null },
    memberships: [{ organization_id: organizationId, role: "cliente" }],
    organization: { id: organizationId, name: "Empresa do snapshot", employee_count: 10 },
    profile: null,
    moduleAccess: [],
    onboardingCompleted: true,
    slackConnected: false,
  };

  it("usa conta, vínculo e empresa do snapshot sem consultas avulsas", async () => {
    vi.mocked(getUserAccessSnapshot).mockResolvedValue(snapshot);
    const result = await refresh({ userId, email: "owner@example.com", role: "cliente" });
    expect(result).toMatchObject({ userId, company: "Empresa do snapshot", role: "cliente", email: "owner@example.com" });
    expect(resolveSupabaseAuthUser).not.toHaveBeenCalled();
    expect(getUserSessionVersion).not.toHaveBeenCalled();
  });
  it("recusa versão de sessão divergente", async () => {
    vi.mocked(getUserAccessSnapshot).mockResolvedValue({ ...snapshot, sessionVersion: "00000000-0000-4000-8000-000000000001" });
    expect(await refresh({ userId, email: "owner@example.com", securityVersion: "initial" })).toBeNull();
  });
  it("recusa acesso removido", async () => {
    vi.mocked(getUserAccessSnapshot).mockResolvedValue({ ...snapshot, memberships: [], organization: null });
    expect(await refresh({ userId, email: "owner@example.com" })).toBeNull();
  });
  it("prioriza o papel superadmin como o resolvedor avulso", async () => {
    const globalOrg = "33333333-3333-4333-8333-333333333333";
    vi.mocked(getUserAccessSnapshot).mockResolvedValue({
      ...snapshot,
      memberships: [...snapshot.memberships, { organization_id: globalOrg, role: "superadmin" }],
      organization: { id: globalOrg, name: "Registro interno", employee_count: 1 },
    });
    expect(await refresh({ userId, email: "owner@example.com" })).toMatchObject({ role: "superadmin", company: "Registro interno" });
  });
});
