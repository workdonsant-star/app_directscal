import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/data/routine-supervision-data-source", () => ({ getRoutineSupervision: vi.fn(), saveRoutineSupervision: vi.fn() }));
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getRoutineSupervision, saveRoutineSupervision } from "@/lib/data/routine-supervision-data-source";
import { GET, POST } from "@/app/api/admin/companies/[id]/routine-supervision/route";
import { AssetAdherenceError } from "@/lib/data/asset-adherence-data-source";
import type { AuthSession } from "@/lib/contracts/auth";
const id = "00000000-0000-4000-8000-000000000001";
const session: AuthSession = { token: "fixture", user: { id, role: "superadmin", name: "Operação", email: "op@fixture.invalid", company: "Fixture" }, createdAt: "2026-10-20T10:00:00Z", expiresAt: "2026-10-21T10:00:00Z" };
const input = { id, cycleId: id, expectedEventId: null, operation: "orientar", reason: "Revisar os encaminhamentos" };
const context = { params: Promise.resolve({ id: `company_${id}` }) };
const request = (body: unknown = input) => new Request("https://fixture.invalid", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getCurrentAuthSession).mockResolvedValue(session); vi.mocked(getRoutineSupervision).mockResolvedValue([]); vi.mocked(saveRoutineSupervision).mockResolvedValue(id); });
describe("revisão exclusiva da operação", () => {
  it("nega cliente, sessão temporária e ausência de sessão antes da leitura/escrita", async () => {
    for (const candidate of [null, { ...session, user: { ...session.user, role: "cliente" as const } }, { ...session, acquisition: true }, { ...session, leadershipInvitation: true }]) {
      vi.mocked(getCurrentAuthSession).mockResolvedValue(candidate);
      expect((await GET(request(), context)).status).toBe(candidate ? 403 : 401);
      expect((await POST(request(), context)).status).toBe(candidate ? 403 : 401);
    }
    expect(getRoutineSupervision).not.toHaveBeenCalled(); expect(saveRoutineSupervision).not.toHaveBeenCalled();
  });
  it("usa ator e empresa do servidor e recusa campos incompatíveis/forjados", async () => {
    for (const body of [{ ...input, organizationId: id }, { ...input, actorUserId: id }, { ...input, accepted: true }, { ...input, operation: "prazo" }]) expect((await POST(request(body), context)).status).toBe(400);
    expect(saveRoutineSupervision).not.toHaveBeenCalled();
    expect((await POST(request(), context)).status).toBe(200);
    expect(saveRoutineSupervision).toHaveBeenCalledWith(`company_${id}`, id, input);
  });
  it("preserva concorrência como conflito e não expõe falha interna", async () => {
    vi.mocked(saveRoutineSupervision).mockRejectedValueOnce(new AssetAdherenceError("A revisão mudou.", 409));
    expect((await POST(request(), context)).status).toBe(409);
    vi.mocked(getRoutineSupervision).mockRejectedValueOnce(new Error("segredo do banco"));
    const response = await GET(request(), context); expect(response.status).toBe(500); expect(await response.text()).not.toContain("segredo");
  });
});
