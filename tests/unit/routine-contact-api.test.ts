import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/data/routine-contact-data-source", () => ({ getRoutineContactPolicy: vi.fn(), saveRoutineContactPolicy: vi.fn(), openRoutineEventContact: vi.fn(), scheduleRoutineContacts: vi.fn(), scheduleRoutineReminders: vi.fn() }));
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getRoutineContactPolicy, saveRoutineContactPolicy, openRoutineEventContact, scheduleRoutineContacts, scheduleRoutineReminders } from "@/lib/data/routine-contact-data-source";
import { GET, POST } from "@/app/api/admin/companies/[id]/routine-contact-policy/route";
import { POST as EVENT } from "@/app/api/admin/companies/[id]/routine-events/route";
import { POST as SCHEDULE } from "@/app/api/internal/routine-contacts/route";
import type { AuthSession } from "@/lib/contracts/auth";
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const session: AuthSession = { token: "fixture", user: { id: id(1), role: "superadmin", name: "Operação", email: "op@example.test", company: "Empresa fixture" }, createdAt: "2026-10-20T10:00:00Z", expiresAt: "2026-10-21T10:00:00Z" };
const input = { id: id(3), expectedRevision: 0, enabled: true, sectorIds: [id(4)], weekdays: [1,2,3,4,5], startHour: 9, endHour: 17, timeZone: "America/Sao_Paulo", maxCompanyPerDay: 10, maxPersonPerDay: 1, reason: "Contato acordado" };
const event = { id: id(3), ruleId: id(4), expectedPolicyRevision: 1, sourceKey: "entrega-1", referenceUrl: "https://example.invalid/entrega-1", description: "Entrega confirmada", happenedLocal: "2026-10-20T09:30:00", dueLocal: "2026-10-21T17:00:00" };
const context = { params: Promise.resolve({ id: `company_${id(2)}` }) };
const request = (body: unknown = input) => new Request("https://fixture.test", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); vi.mocked(getCurrentAuthSession).mockResolvedValue(session); vi.mocked(getRoutineContactPolicy).mockResolvedValue(null); vi.mocked(saveRoutineContactPolicy).mockResolvedValue(1); vi.mocked(openRoutineEventContact).mockResolvedValue({ cycleId: id(5), jobId: id(6) }); });
describe("política e oportunidades de acompanhamento", () => {
  it("nega sessões ausentes, de cliente ou temporárias antes de consultar ou agendar", async () => {
    for (const candidate of [null, { ...session, user: { ...session.user, role: "cliente" as const } }, { ...session, acquisition: true }, { ...session, leadershipInvitation: true }]) {
      vi.mocked(getCurrentAuthSession).mockResolvedValue(candidate);
      expect((await GET(request(), context)).status).toBe(candidate ? 403 : 401);
      expect((await POST(request(), context)).status).toBe(candidate ? 403 : 401);
      expect((await EVENT(request(event), context)).status).toBe(candidate ? 403 : 401);
    }
    expect(getRoutineContactPolicy).not.toHaveBeenCalled(); expect(saveRoutineContactPolicy).not.toHaveBeenCalled(); expect(openRoutineEventContact).not.toHaveBeenCalled();
  });
  it("deriva ator/empresa da sessão e recusa audiência vazia ou campos forjados", async () => {
    for (const body of [{ ...input, sectorIds: [] }, { ...input, organizationId: id(7) }, { ...input, startHour: 18, endHour: 9 }, { ...input, maxCompanyPerDay: 1, maxPersonPerDay: 5 }]) expect((await POST(request(body), context)).status).toBe(400);
    expect(saveRoutineContactPolicy).not.toHaveBeenCalled();
    const response = await POST(request(), context); expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
    expect(saveRoutineContactPolicy).toHaveBeenCalledWith(`company_${id(2)}`, id(1), input);
  });
  it("exige prova HTTPS, origem e revisão para uma ocorrência explícita", async () => {
    expect((await EVENT(request({ ...event, referenceUrl: "http://example.invalid" }), context)).status).toBe(400);
    expect(openRoutineEventContact).not.toHaveBeenCalled();
    expect((await EVENT(request(event), context)).status).toBe(200);
    expect(openRoutineEventContact).toHaveBeenCalledWith(`company_${id(2)}`, id(1), event);
  });
  it("não expõe falhas internas", async () => {
    vi.mocked(getRoutineContactPolicy).mockRejectedValue(new Error("token privado"));
    const response = await GET(request(), context); expect(response.status).toBe(500); expect(await response.text()).not.toContain("token privado");
  });
  it("agendador fechado por padrão e sem empresa fornecida no payload", async () => {
    expect((await SCHEDULE(request())).status).toBe(401); expect(scheduleRoutineContacts).not.toHaveBeenCalled();
    vi.stubEnv("SLACK_DELIVERY_WORKER_SECRET", "x".repeat(32));
    vi.mocked(scheduleRoutineContacts).mockResolvedValue({ checked: 0, ensured: 0, failed: 0 });
    vi.mocked(scheduleRoutineReminders).mockResolvedValue({ checked: 0, ensured: 0, failed: 0 });
    const response = await SCHEDULE(new Request("https://fixture.test", { method: "POST", headers: { authorization: `Bearer ${"x".repeat(32)}` }, body: JSON.stringify({ organizationId: "forjada" }) }));
    expect(response.status).toBe(200); expect(scheduleRoutineContacts).toHaveBeenCalledWith();
  });
});
