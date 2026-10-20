import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));
import { getCurrentAuthSession } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { resultBaselineSchema } from "@/lib/contracts/routine-results";
import { GET, POST } from "@/app/api/admin/companies/[id]/result-baselines/route";
import type { AuthSession } from "@/lib/contracts/auth";
const id = "00000000-0000-4000-8000-000000000001", org = "00000000-0000-4000-8000-000000000002";
const session: AuthSession = { token: "fixture", user: { id, role: "superadmin", name: "Operação", email: "op@fixture.invalid", company: "Fixture" }, createdAt: "2026-10-20T10:00:00Z", expiresAt: "2026-10-21T10:00:00Z" };
const baseline = { ruleId: id, routineId: id, diagnosticId: id, questionId: id, actionPointId: "action", assetId: id, assetVersionId: id, capturedAt: "2026-10-20T10:00:00Z", diagnosticClosedAt: null, questionText: "Como é a rotina?", layers: [{group: "fundador", responses: 0, score: null}, {group: "lideranca", responses: 2, score: 3}, {group: "operacao", responses: 0, score: null}] };
const rpc = vi.fn(); const context = { params: Promise.resolve({id: `company_${org}`}) };
const request = (body: unknown = {ruleId: id}) => new Request("https://fixture.invalid", {method: "POST", body: JSON.stringify(body)});
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getCurrentAuthSession).mockResolvedValue(session); vi.mocked(createSupabaseAdminClient).mockReturnValue({schema: () => ({rpc})} as unknown as ReturnType<typeof createSupabaseAdminClient>); rpc.mockResolvedValue({data: [], error: null}); });
describe("linha de base sem estimativa inventada", () => {
 it("preserva ausência de base e recusa score fabricado/duplicação de camada", () => {
  expect(resultBaselineSchema.safeParse(baseline).success).toBe(true);
  expect(resultBaselineSchema.safeParse({...baseline, layers: baseline.layers.map(layer => ({...layer, score: 3}))}).success).toBe(false);
  expect(resultBaselineSchema.safeParse({...baseline, layers: Array(3).fill(baseline.layers[0])}).success).toBe(false);
 });
 it("nega cliente/temporária/sem sessão e campos de score/ator forjados", async () => {
  for (const value of [null, {...session, user: {...session.user, role: "cliente" as const}}, {...session, acquisition: true}]) {
   vi.mocked(getCurrentAuthSession).mockResolvedValue(value); expect((await GET(request(), context)).status).toBe(value ? 403 : 401); expect((await POST(request(), context)).status).toBe(value ? 403 : 401);
  }
  expect(rpc).not.toHaveBeenCalled(); vi.mocked(getCurrentAuthSession).mockResolvedValue(session);
  for (const body of [{ruleId: id, score: 4}, {ruleId: id, organizationId: id}, {ruleId: id, actorUserId: org}]) expect((await POST(request(body), context)).status).toBe(400);
 });
 it("deriva ator/empresa e lê snapshot validado", async () => {
  rpc.mockResolvedValueOnce({data: [baseline], error: null}); const read = await GET(request(), context); expect(read.status).toBe(200); expect((await read.json()).items[0].layers[0].score).toBeNull();
  rpc.mockResolvedValueOnce({data: id, error: null}); expect((await POST(request(), context)).status).toBe(200);
  expect(rpc).toHaveBeenLastCalledWith("capture_routine_result_baseline", {p_organization_id: org, p_actor_user_id: id, p_rule_id: id});
 });
});
