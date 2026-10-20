import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/authorization", () => ({ getAccessibleOrganizationIdsForUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/integrations/slack", () => ({ getSlackInstallationForOrganization: vi.fn() }));
import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSlackInstallationForOrganization } from "@/lib/integrations/slack";
import { startSlackIdentity, unlinkSlackIdentity, getSlackIdentityStatus } from "@/lib/data/slack-identity-data-source";
import type { AuthSession } from "@/lib/contracts/auth";
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const session: AuthSession = { token: "fixture", supabaseAccessToken: "jwt-ficticio", user: { id: id(1), name: "Pessoa fixture", email: "pessoa@example.test", company: "Empresa fictícia", role: "cliente" }, createdAt: "2026-10-20T10:00:00Z", expiresAt: "2026-10-21T10:00:00Z" };
const rpc = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createSupabaseAdminClient).mockReturnValue({ schema: () => ({ rpc }) } as unknown as ReturnType<typeof createSupabaseAdminClient>);
  vi.mocked(getAccessibleOrganizationIdsForUser).mockResolvedValue({ isSuperadmin: false, primaryOrganizationId: id(2), organizationIds: [id(2)] });
  vi.mocked(getSlackInstallationForOrganization).mockResolvedValue({ teamId: "T1", teamName: "Workspace fixture", scope: "users:read", installedAt: "2026-10-20T10:00:00Z" });
  rpc.mockResolvedValue({ data: "2026-10-20T10:10:00Z", error: null });
});
describe("vínculo de identidade por posse dos dois canais", () => {
  it("não inicia desafio em sessão temporária, administrativa ou sem JWT", async () => {
    for (const candidate of [{ ...session, acquisition: true }, { ...session, leadershipInvitation: true }, { ...session, supabaseAccessToken: undefined }, { ...session, user: { ...session.user, role: "superadmin" as const } }]) await expect(startSlackIdentity(candidate)).rejects.toMatchObject({ status: 403 });
    expect(getAccessibleOrganizationIdsForUser).not.toHaveBeenCalled(); expect(rpc).not.toHaveBeenCalled();
  });
  it("recusa membership ausente antes de gerar desafio", async () => {
    vi.mocked(getAccessibleOrganizationIdsForUser).mockResolvedValue({ isSuperadmin: false, primaryOrganizationId: null, organizationIds: [] });
    await expect(startSlackIdentity(session)).rejects.toMatchObject({ status: 403 }); expect(rpc).not.toHaveBeenCalled();
  });
  it("gera código forte com validade do banco e grava somente seu hash", async () => {
    const challenge = await startSlackIdentity(session);
    const code = challenge.command.replace(/^vincular /, "");
    expect(code).toMatch(/^dsc_[A-Za-z0-9_-]{43}$/);
    expect(challenge.expiresAt).toBe("2026-10-20T10:10:00Z");
    expect(rpc).toHaveBeenCalledWith("start_slack_identity", { p_organization_id: id(2), p_user_id: id(1), p_code_hash: createHash("sha256").update(code).digest("hex") });
    expect(JSON.stringify(rpc.mock.calls)).not.toContain(code);
  });
  it("desvincula somente a identidade da sessão na empresa derivada", async () => {
    await unlinkSlackIdentity(session);
    expect(rpc).toHaveBeenCalledWith("unlink_slack_identity", { p_organization_id: id(2), p_user_id: id(1) });
  });
  it("o status só expõe a própria confirmação", async () => {
    rpc.mockResolvedValue({ data: [{ appUserId: id(3), slackIdentity: "T1:U3", teamId: "T1", slackUserId: "U3", verifiedAt: "2026-10-20T10:00:00Z" }], error: null });
    expect(await getSlackIdentityStatus(session)).toEqual({ available: true, connected: false, workspace: "Workspace fixture", verifiedAt: null });
  });
  it("mantém limite de geração e não vaza erro interno", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "PT429", message: "detalhe privado" } });
    await expect(startSlackIdentity(session)).rejects.toMatchObject({ status: 429, message: "Aguarde 30 segundos antes de gerar outro código." });
  });
});
