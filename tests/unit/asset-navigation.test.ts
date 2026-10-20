import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/data/profile-data-source", () => ({ getProfileSettingsData: vi.fn() }));
vi.mock("@/lib/data/asset-navigation-data-source", () => ({ saveAssetNavigationPreferences: vi.fn() }));

import { PUT } from "@/app/api/settings/asset-navigation/route";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";
import { saveAssetNavigationPreferences } from "@/lib/data/asset-navigation-data-source";
import { assetNavigationPreferencesSchema } from "@/lib/contracts/asset-navigation";

const preferences = { order: ["governanca", "cultura"], icons: { governanca: "shield" } };
const session = (role: "cliente" | "admin" | "superadmin", extra = {}) => ({ user: { id: "authenticated-owner", role }, ...extra }) as Awaited<ReturnType<typeof getCurrentAuthSession>>;
const request = (body: unknown = preferences) => new Request("http://localhost/api/settings/asset-navigation", { method: "PUT", body: JSON.stringify(body) });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCurrentAuthSession).mockResolvedValue(session("cliente"));
  vi.mocked(saveAssetNavigationPreferences).mockResolvedValue(preferences);
  vi.mocked(getProfileSettingsData).mockResolvedValue({ organizationId: "organization-from-session" } as Awaited<ReturnType<typeof getProfileSettingsData>>);
});

describe("navegação compartilhada dos ativos", () => {
  it("exige sessão", async () => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue(null);
    expect((await PUT(request())).status).toBe(401);
    expect(saveAssetNavigationPreferences).not.toHaveBeenCalled();
  });
  it.each(["admin", "superadmin"] as const)("bloqueia escrita por %s", async role => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue(session(role));
    expect((await PUT(request())).status).toBe(403);
    expect(saveAssetNavigationPreferences).not.toHaveBeenCalled();
  });
  it.each(["acquisition", "leadershipInvitation"])("bloqueia intenção temporária %s", async intent => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue(session("cliente", { [intent]: true }));
    expect((await PUT(request())).status).toBe(403);
  });
  it("rejeita tentativa de escolher empresa no payload", async () => {
    expect((await PUT(request({ ...preferences, organizationId: "another-company" }))).status).toBe(400);
    expect(saveAssetNavigationPreferences).not.toHaveBeenCalled();
  });
  it("grava na empresa resolvida no servidor, com ator autenticado", async () => {
    const response = await PUT(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(preferences);
    expect(saveAssetNavigationPreferences).toHaveBeenCalledWith("organization-from-session", "authenticated-owner", preferences);
  });
  it("não expõe detalhes do banco quando o salvamento falha", async () => {
    vi.mocked(saveAssetNavigationPreferences).mockRejectedValue(new Error("sensitive database details"));
    const response = await PUT(request());
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("sensitive");
  });
  it("aceita ícones do catálogo completo e preserva ícones legados", () => {
    expect(assetNavigationPreferencesSchema.safeParse({ order: [], icons: { cultura: "a-arrow-down", pessoas: "people", documentos: "lucide:book" } }).success).toBe(true);
  });
  it("rejeita ícones desconhecidos e posições duplicadas", () => {
    expect(assetNavigationPreferencesSchema.safeParse({ order: ["cultura", "cultura"], icons: {} }).success).toBe(false);
    expect(assetNavigationPreferencesSchema.safeParse({ order: [], icons: { cultura: "unknown" } }).success).toBe(false);
  });
});
