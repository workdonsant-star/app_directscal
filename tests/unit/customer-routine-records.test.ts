import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn(), createSupabaseRlsClient: vi.fn() }));
import { createSupabaseAdminClient, createSupabaseRlsClient } from "@/lib/supabase/server";
import { getCustomerRoutineRecords } from "@/lib/data/customer-routine-records";
import type { AuthSession } from "@/lib/contracts/auth";
const visible = vi.fn(), rpc = vi.fn();
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const session: AuthSession = { token: "fixture", supabaseAccessToken: "jwt-ficticio", user: { id: id(1), name: "Pessoa fixture", email: "pessoa@fixture.invalid", role: "cliente", company: "Empresa fixture" }, createdAt: "2026-10-20T10:00:00Z", expiresAt: "2026-10-21T10:00:00Z" };
const record = (n: number) => ({ createdAt: "2026-10-20T10:00:00Z", cycle: { id: id(n), opportunityKey: `cycle-${n}`, opensAt: "2026-10-01T10:00:00Z", dueAt: "2026-10-10T10:00:00Z", facts: [],
  rule: { id: id(2), routineId: id(3), revision: 1, organizationId: id(4), diagnosticId: id(5), actionPointId: "action_processos_ritual", assetId: id(6), assetVersionId: id(7), questionId: id(8), sectorId: id(9), assignee: { teamId: "T1", userId: "U1" }, schedule: { kind: "periodica", cadence: "semanal", timeZone: "America/Sao_Paulo" }, expectation: "Conferir", createdAt: "2026-10-01T10:00:00Z" } }, proposals: [], messages: [] });
beforeEach(() => {
  vi.clearAllMocks();
  const query = { select: vi.fn(() => query), eq: vi.fn(() => query), maybeSingle: visible };
  vi.mocked(createSupabaseRlsClient).mockReturnValue({ from: () => query } as unknown as ReturnType<typeof createSupabaseRlsClient>);
  vi.mocked(createSupabaseAdminClient).mockReturnValue({ schema: () => ({ rpc }) } as unknown as ReturnType<typeof createSupabaseAdminClient>);
  visible.mockResolvedValue({ data: { id: id(5) }, error: null }); rpc.mockResolvedValue({ data: [], error: null });
});
describe("registros autorizados de execução", () => {
  it("nega sessão global ou temporária e aplica RLS antes de ler fatos privados", async () => {
    for (const candidate of [{ ...session, user: { ...session.user, role: "superadmin" as const } }, { ...session, acquisition: true }, { ...session, leadershipInvitation: true }, { ...session, supabaseAccessToken: undefined }]) {
      expect(await getCustomerRoutineRecords(candidate, id(4), id(5))).toEqual([]);
    }
    expect(rpc).not.toHaveBeenCalled();
    visible.mockResolvedValueOnce({ data: null, error: null });
    expect(await getCustomerRoutineRecords(session, id(4), id(5))).toEqual([]); expect(rpc).not.toHaveBeenCalled();
  });
  it("pagina a base inteira mantendo o cursor bruto e ator da sessão", async () => {
    const page = Array.from({ length: 100 }, (_, n) => record(1000 - n));
    rpc.mockResolvedValueOnce({ data: page, error: null }).mockResolvedValueOnce({ data: [record(800)], error: null });
    expect(await getCustomerRoutineRecords(session, id(4), id(5))).toHaveLength(101);
    expect(rpc).toHaveBeenLastCalledWith("get_customer_routine_records", { p_organization_id: id(4), p_actor_user_id: id(1), p_diagnostic_id: id(5), p_before_at: page[99].createdAt, p_before_id: page[99].cycle.id });
  });
  it("falha sem expor erro privado ou devolver uma base parcial", async () => {
    rpc.mockResolvedValueOnce({ data: Array.from({ length: 100 }, (_, n) => record(1000 - n)), error: null }).mockResolvedValueOnce({ data: null, error: { message: "detalhe privado" } });
    await expect(getCustomerRoutineRecords(session, id(4), id(5))).rejects.toThrow("Não foi possível consultar os registros desta coleta.");
  });
});
