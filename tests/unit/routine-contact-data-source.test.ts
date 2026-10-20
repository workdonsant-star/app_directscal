import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getRoutineContactPolicy, saveRoutineContactPolicy, scheduleRoutineContacts } from "@/lib/data/routine-contact-data-source";
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const rpc = vi.fn();
const input = { id: id(3), expectedRevision: 0, enabled: false, sectorIds: [], weekdays: [1,2,3,4,5], startHour: 9, endHour: 17, timeZone: "America/Sao_Paulo", maxCompanyPerDay: 10, maxPersonPerDay: 1, reason: "Configuração inicial" };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(createSupabaseAdminClient).mockReturnValue({ schema: () => ({ rpc }) } as unknown as ReturnType<typeof createSupabaseAdminClient>); });
describe("fonte do agendamento de rotina", () => {
  it("preserva erro de papel/concorrência e recusa ator forjado no corpo", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "42501" } });
    await expect(getRoutineContactPolicy(`company_${id(1)}`, id(2))).rejects.toMatchObject({ status: 403 });
    await expect(saveRoutineContactPolicy(`company_${id(1)}`, id(2), { ...input, actorId: id(8) })).rejects.toThrow();
    rpc.mockResolvedValue({ data: null, error: { code: "PT409" } });
    await expect(saveRoutineContactPolicy(`company_${id(1)}`, id(2), input)).rejects.toMatchObject({ status: 409 });
    expect(rpc).toHaveBeenLastCalledWith("save_routine_contact_policy", { p_organization_id: id(1), p_actor_user_id: id(2), p_input: input });
  });
  it("mantém desativado quando nenhuma política foi salva", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect(await getRoutineContactPolicy(`company_${id(1)}`, id(2))).toBeNull();
  });
  it("não presume evento e avança o cursor mesmo quando uma rotina falha", async () => {
    const rule = { id: id(3), routine_id: id(4), revision: 1, organization_id: id(1), diagnostic_id: id(5), action_point_id: "action_processos_ritual", asset_id: id(6), asset_version_id: id(7), question_id: id(8), sector_id: id(9), assignee_team_id: "T1", assignee_user_id: "U1", schedule: { kind: "por_evento", eventKey: "entrega", timeZone: "America/Sao_Paulo" }, expectation: "Conferir", created_at: "2026-01-01T12:00:00Z" };
    const periodic = { ...rule, id: id(10), routine_id: id(11), schedule: { kind: "periodica", cadence: "anual", timeZone: "America/Sao_Paulo" } };
    rpc.mockImplementation(async (method: string) => method === "get_routine_contact_schedule" ? { data: [{ policyId: id(12), enabledAt: "2026-01-01T12:00:00Z", rule }, { policyId: id(12), enabledAt: "2026-01-01T12:00:00Z", rule: periodic }], error: null } : method === "enqueue_routine_contact" ? { data: null, error: { code: "PT409" } } : { data: null, error: null });
    expect(await scheduleRoutineContacts()).toEqual({ checked: 2, ensured: 0, failed: 1 });
    expect(rpc).toHaveBeenCalledWith("touch_routine_contact_schedule", { p_rule_id: id(3), p_error: false });
    expect(rpc).toHaveBeenCalledWith("touch_routine_contact_schedule", { p_rule_id: id(10), p_error: true });
    expect(rpc.mock.calls.filter(call => call[0] === "enqueue_routine_contact")).toHaveLength(1);
  });
});
