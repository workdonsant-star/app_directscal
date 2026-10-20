import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/data/slack-delivery-operations", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/data/slack-delivery-operations")>(), listSlackDeliveries: vi.fn(), retrySlackDelivery: vi.fn() }));
vi.mock("@/lib/integrations/slack-delivery", () => ({ processSlackDelivery: vi.fn() }));
import { getCurrentAuthSession } from "@/lib/auth/session";
import { listSlackDeliveries, retrySlackDelivery } from "@/lib/data/slack-delivery-operations";
import { GET, POST } from "@/app/api/admin/companies/[id]/slack-deliveries/route";
import { POST as WORK } from "@/app/api/internal/slack-deliveries/route";
import { processSlackDelivery } from "@/lib/integrations/slack-delivery";
import type { AuthSession } from "@/lib/contracts/auth";
const id = "00000000-0000-4000-8000-000000000001";
const session: AuthSession = { token: "fixture", user: { id, role: "superadmin", name: "Operação", email: "op@example.test", company: "DirectScal fictícia" }, createdAt: "2026-10-20T10:00:00Z", expiresAt: "2026-10-21T10:00:00Z" };
const context = { params: Promise.resolve({ id: `company_${id}` }) };
const request = (body: unknown = { id, expectedUpdatedAt: "2026-10-20T10:00:00Z" }) => new Request("https://fixture.test", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); vi.mocked(getCurrentAuthSession).mockResolvedValue(session); vi.mocked(listSlackDeliveries).mockResolvedValue({ items: [], nextCursor: null }); vi.mocked(retrySlackDelivery).mockResolvedValue(undefined); });
describe("operação e recuperação Slack", () => {
  it("exige sessão definitiva global antes de ler ou repetir", async () => {
    for (const candidate of [null, { ...session, user: { ...session.user, role: "cliente" as const } }, { ...session, acquisition: true }, { ...session, leadershipInvitation: true }]) {
      vi.mocked(getCurrentAuthSession).mockResolvedValue(candidate);
      expect((await GET(new Request("https://fixture.test"), context)).status).toBe(candidate ? 403 : 401);
      expect((await POST(request(), context)).status).toBe(candidate ? 403 : 401);
    }
    expect(listSlackDeliveries).not.toHaveBeenCalled(); expect(retrySlackDelivery).not.toHaveBeenCalled();
  });
  it("deriva empresa/ator da sessão e recusa campos forjados", async () => {
    const response = await GET(new Request("https://fixture.test?cursor=abc"), context);
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
    expect(listSlackDeliveries).toHaveBeenCalledWith(`company_${id}`, id, "abc");
    expect((await POST(request({ id, expectedUpdatedAt: "2026-10-20T10:00:00Z", organizationId: "forjada" }), context)).status).toBe(400);
    expect(retrySlackDelivery).not.toHaveBeenCalled();
    expect((await POST(request(), context)).status).toBe(200);
    expect(retrySlackDelivery).toHaveBeenCalledWith(`company_${id}`, id, id, "2026-10-20T10:00:00Z");
  });
  it("não vaza detalhes da fila", async () => {
    vi.mocked(listSlackDeliveries).mockRejectedValue(new Error("segredo privado"));
    const response = await GET(new Request("https://fixture.test"), context);
    expect(response.status).toBe(500); expect(await response.text()).not.toContain("segredo");
  });
  it("worker fechado por padrão, valida segredo e limita um processamento", async () => {
    expect((await WORK(request())).status).toBe(401);
    vi.stubEnv("SLACK_DELIVERY_WORKER_SECRET", "x".repeat(32));
    expect((await WORK(new Request("https://fixture.test", { method: "POST", headers: { authorization: `Bearer ${"é".repeat(32)}` } }))).status).toBe(401);
    expect(processSlackDelivery).not.toHaveBeenCalled();
    vi.mocked(processSlackDelivery).mockResolvedValue(true);
    const response = await WORK(new Request("https://fixture.test", { method: "POST", headers: { authorization: `Bearer ${"x".repeat(32)}` } }));
    expect(await response.json()).toEqual({ processed: true }); expect(processSlackDelivery).toHaveBeenCalledOnce();
  });
});
