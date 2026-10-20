import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));
import { getCurrentAuthSession } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { agentGapInputSchema } from "@/lib/contracts/agent-operations";
import { getAgentOperations, saveAgentGap } from "@/lib/data/agent-operations-data-source";
import { POST } from "@/app/api/admin/companies/[id]/agent-operations/route";
import type { AuthSession } from "@/lib/contracts/auth";
const id = "00000000-0000-4000-8000-000000000001", other = "00000000-0000-4000-8000-000000000002";
const session: AuthSession = { token: "fixture", user: { id, role: "superadmin", name: "Operação", email: "op@fixture.invalid", company: "Fixture" }, createdAt: "2026-10-20T10:00:00Z", expiresAt: "2026-10-21T10:00:00Z" };
const input = { id, auditId: other, expectedEventId: null, status: "em_andamento", assigneeUserId: id, reason: "Conferir a fonte publicada", evidenceUrl: null, dueAt: null };
const rpc = vi.fn();
const context = { params: Promise.resolve({ id: `company_${other}` }) };
const request = (body: unknown = input) => new Request("https://fixture.invalid", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getCurrentAuthSession).mockResolvedValue(session); vi.mocked(createSupabaseAdminClient).mockReturnValue({ schema: () => ({ rpc }) } as unknown as ReturnType<typeof createSupabaseAdminClient>); rpc.mockResolvedValue({ data: id, error: null }); });
describe("fila de lacunas com autoria e evidência", () => {
 it("rejeita resolução sem responsável/evidência e campos de autorização forjados", () => {
   for (const value of [{ ...input, status: "resolvida" }, { ...input, assigneeUserId: null }, { ...input, actorUserId: id }, { ...input, organizationId: id }, { ...input, evidenceUrl: "javascript:alert(1)" }]) expect(agentGapInputSchema.safeParse(value).success).toBe(false);
   expect(agentGapInputSchema.safeParse({ ...input, status: "resolvida", evidenceUrl: "https://example.invalid/evidencia" }).success).toBe(true);
 });
 it("bloqueia cliente, intents temporários e ausência de sessão antes do banco", async () => {
   for (const value of [null, { ...session, user: { ...session.user, role: "cliente" as const } }, { ...session, acquisition: true }, { ...session, leadershipInvitation: true }]) {
     vi.mocked(getCurrentAuthSession).mockResolvedValue(value);
     expect((await POST(request(), context)).status).toBe(value ? 403 : 401);
   }
   expect(rpc).not.toHaveBeenCalled();
 });
 it("deriva ator/empresa no servidor e preserva conflito sem vazar detalhes", async () => {
   expect((await POST(request({ ...input, actorUserId: other }), context)).status).toBe(400);
   expect((await POST(request(), context)).status).toBe(200);
   expect(rpc).toHaveBeenCalledWith("save_agent_gap_review", { p_organization_id: other, p_actor_user_id: id, p_input: input });
   rpc.mockResolvedValueOnce({ data: null, error: { code: "PT409", message: "internal" } });
   const response = await POST(request(), context); expect(response.status).toBe(409); expect(await response.text()).not.toContain("internal");
 });
 it("lê todas as revisões em lotes e não confunde saúde com entrega confirmada", async () => {
   const batch = { operators: [{ id, name: "Operação" }], reviews: [], health: { capturedAt: "2026-10-20T12:00:00Z", slackFailures: 2, slackUncertain: 1, slackOverdue: 0, queries30Days: 8, queryErrors30Days: 1 } };
   rpc.mockResolvedValue({ data: batch, error: null });
   const result = await getAgentOperations(`company_${other}`, Array.from({ length: 401 }, () => id));
   expect(rpc).toHaveBeenCalledTimes(3); expect(result.health.slackUncertain).toBe(1);
   await saveAgentGap(`company_${other}`, input);
 });
});
