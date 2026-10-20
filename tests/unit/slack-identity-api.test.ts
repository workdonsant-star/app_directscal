import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/data/slack-identity-data-source", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/data/slack-identity-data-source")>(), getSlackIdentityStatus: vi.fn(), startSlackIdentity: vi.fn(), unlinkSlackIdentity: vi.fn() }));
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getSlackIdentityStatus, startSlackIdentity, unlinkSlackIdentity } from "@/lib/data/slack-identity-data-source";
import { GET, POST, DELETE } from "@/app/api/profile/slack-identity/route";
import type { AuthSession } from "@/lib/contracts/auth";
const session: AuthSession = { token: "fixture", supabaseAccessToken: "jwt-ficticio", user: { id: "owner", name: "Pessoa fixture", email: "pessoa@example.test", company: "Empresa fictícia", role: "cliente" }, createdAt: "2026-10-20T10:00:00Z", expiresAt: "2026-10-21T10:00:00Z" };
const request = (body: unknown = {}) => new Request("https://fixture.test", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getCurrentAuthSession).mockResolvedValue(session); vi.mocked(getSlackIdentityStatus).mockResolvedValue({ available: true, connected: false, workspace: null, verifiedAt: null }); vi.mocked(startSlackIdentity).mockResolvedValue({ command: "vincular código-fictício", expiresAt: "2026-10-20T10:10:00Z" }); vi.mocked(unlinkSlackIdentity).mockResolvedValue(undefined); });
describe("API da própria identidade Slack", () => {
  it("exige conta definitiva antes de consultar ou escrever", async () => {
    for (const candidate of [null, { ...session, acquisition: true }, { ...session, leadershipInvitation: true }, { ...session, supabaseAccessToken: undefined }, { ...session, user: { ...session.user, role: "superadmin" as const } }]) {
      vi.mocked(getCurrentAuthSession).mockResolvedValue(candidate);
      expect((await GET()).status).toBe(candidate ? 403 : 401);
      expect((await POST(request())).status).toBe(candidate ? 403 : 401);
      expect((await DELETE(request())).status).toBe(candidate ? 403 : 401);
    }
    expect(getSlackIdentityStatus).not.toHaveBeenCalled(); expect(startSlackIdentity).not.toHaveBeenCalled(); expect(unlinkSlackIdentity).not.toHaveBeenCalled();
  });
  it("não aceita empresa, conta ou pessoa escolhida no corpo", async () => {
    for (const input of [{ organizationId: "outra" }, { userId: "outra" }, { slackUserId: "U1" }]) expect((await POST(request(input))).status).toBe(400);
    expect(startSlackIdentity).not.toHaveBeenCalled();
    const response = await POST(request());
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store"); expect(startSlackIdentity).toHaveBeenCalledWith(session);
  });
  it("erro desconhecido não vaza conteúdo do desafio ou token", async () => {
    vi.mocked(getSlackIdentityStatus).mockRejectedValue(new Error("token privado"));
    const response = await GET(); expect(response.status).toBe(500); expect(await response.text()).not.toContain("token privado");
  });
});
