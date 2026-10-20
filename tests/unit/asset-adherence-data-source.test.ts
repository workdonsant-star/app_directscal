import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getAssetAdherenceSummary, recordAssetAdherenceFact, transitionAssetAdherenceRoutine } from "@/lib/data/asset-adherence-data-source";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const filters = vi.fn();
const ranges = vi.fn();
const rpc = vi.fn();
let rows: Record<string, Record<string, unknown>[]>;
const context = { organizationId: id(1), actorUserId: id(2), from: new Date("2026-10-01T00:00:00Z"), to: new Date("2026-11-01T00:00:00Z"), at: new Date("2026-10-20T00:00:00Z") };
const rule = { id: id(3), routine_id: id(4), revision: 1, organization_id: id(1), diagnostic_id: id(5), action_point_id: "AP-001", asset_id: id(6), asset_version_id: id(7), question_id: id(8), sector_id: id(9), assignee_team_id: "TFIXTURE", assignee_user_id: "UFIXTURE", schedule: { kind: "por_evento", eventKey: "fechamento", timeZone: "America/Sao_Paulo" }, expectation: "Conferir fechamento", created_by: id(2), created_at: "2026-10-01T00:00:00Z" };
const cycle = { id: id(10), organization_id: id(1), rule_id: id(3), routine_id: id(4), opportunity_key: "evento-1", opens_at: "2026-10-01T00:00:00Z", due_at: "2026-10-10T00:00:00Z", created_at: "2026-10-01T00:00:00Z" };

beforeEach(() => {
  vi.clearAllMocks();
  rows = { organization_members: [{ organization_id: id(1), role: "cliente" }], asset_adherence_rules: [rule], asset_adherence_cycles: [cycle], asset_adherence_facts: [] };
  const db = {
    schema: () => db, rpc,
    from(table: string) {
      const query = {
        select: () => query,
        eq: (column: string, value: unknown) => { filters(table, column, value); return query; },
        in: (column: string, value: unknown) => { filters(table, column, value); return query; },
        gte: (column: string, value: unknown) => { filters(table, column, value); return query; },
        lt: (column: string, value: unknown) => { filters(table, column, value); return query; },
        lte: (column: string, value: unknown) => { filters(table, column, value); return query; },
        order: () => query,
        range: (first: number, last: number) => { ranges(table, first, last); return Promise.resolve({ data: (rows[table] ?? []).slice(first, last + 1), error: null }); },
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ data: rows[table] ?? [], error: null })),
      }; return query;
    },
  };
  vi.mocked(createSupabaseAdminClient).mockReturnValue(db as unknown as ReturnType<typeof createSupabaseAdminClient>);
});

describe("persistência da base de aderência", () => {
  it("preserva a versão esperada e o ator ao pausar a rotina", async () => {
    const input = { organizationId: id(1), routineId: id(4), id: id(30), expectedEventId: null, action: "pausar", reason: "  Aguardar decisão operacional  " };
    rpc.mockResolvedValue({ data: { paused: true, eventId: id(30), recordedAt: "2026-10-20T12:00:00Z" }, error: null });
    expect((await transitionAssetAdherenceRoutine(id(2), input)).paused).toBe(true);
    expect(rpc).toHaveBeenCalledWith("transition_asset_adherence_routine", expect.objectContaining({ p_actor_user_id: id(2), p_expected_event_id: null, p_reason: "Aguardar decisão operacional" }));
    rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "interno" } });
    await expect(transitionAssetAdherenceRoutine(id(2), input)).rejects.toMatchObject({ status: 403, message: "Acesso restrito à operação DirectScal." });
    await expect(transitionAssetAdherenceRoutine(id(2), { ...input, actorUserId: id(99) })).rejects.toThrow();
  });
  it("usa o escopo em cada leitura e não inventa relato para ciclo sem fato", async () => {
    const result = await getAssetAdherenceSummary(context);
    expect(result.total).toMatchObject({ eligible: 1, reported: 0, validated: 0, validatedPercent: 0 });
    for (const table of ["asset_adherence_rules", "asset_adherence_cycles", "asset_adherence_facts"]) expect(filters).toHaveBeenCalledWith(table, "organization_id", id(1));
    expect(filters).toHaveBeenCalledWith("asset_adherence_cycles", "due_at", context.from.toISOString());
    expect(filters).toHaveBeenCalledWith("asset_adherence_facts", "recorded_at", context.at.toISOString());
  });
  it("bloqueia outra empresa e o papel admin antes de ler dados privados", async () => {
    for (const member of [{ organization_id: id(99), role: "cliente" }, { organization_id: id(1), role: "admin" }]) {
      rows.organization_members = [member];
      await expect(getAssetAdherenceSummary(context)).rejects.toMatchObject({ status: 403 });
      expect(ranges).not.toHaveBeenCalled();
    }
  });
  it("lê todas as páginas para não truncar denominadores", async () => {
    rows.asset_adherence_cycles = Array.from({ length: 1001 }, (_, n) => ({ ...cycle, id: id(100 + n), opportunity_key: `evento-${n}` }));
    const result = await getAssetAdherenceSummary(context);
    expect(result.total.eligible).toBe(1001);
    expect(ranges).toHaveBeenCalledWith("asset_adherence_cycles", 1000, 1999);
    expect(result.total.validatedPercent).toBe(0);
  });
  it("não transforma inconsistência persistida em percentual zero", async () => {
    rows.asset_adherence_rules = [];
    await expect(getAssetAdherenceSummary(context)).rejects.toMatchObject({ status: 500 });
  });
  it("envia ator e tentativa explícitos para a transação e protege detalhes de erro", async () => {
    const args = { organizationId: id(1), cycleId: id(10), actorUserId: id(2), id: id(20), payload: { kind: "leitura_confirmada" } };
    rpc.mockResolvedValue({ data: { id: id(20), sequence: 1, recordedAt: "2026-10-10T00:00:00Z" }, error: null });
    expect((await recordAssetAdherenceFact(args)).id).toBe(id(20));
    expect(rpc).toHaveBeenCalledWith("record_asset_adherence_fact", expect.objectContaining({ p_actor_user_id: id(2), p_id: id(20) }));
    rpc.mockResolvedValue({ data: null, error: { code: "PT409", message: "detalhe privado" } });
    await expect(recordAssetAdherenceFact(args)).rejects.toMatchObject({ status: 409 });
    rpc.mockResolvedValue({ data: null, error: { code: "XX000", message: "detalhe privado" } });
    await expect(recordAssetAdherenceFact(args)).rejects.toThrow("Não foi possível acessar");
    const calls = rpc.mock.calls.length;
    await expect(recordAssetAdherenceFact({ ...args, payload: { ...args.payload, actorUserId: id(99) } })).rejects.toThrow();
    expect(rpc).toHaveBeenCalledTimes(calls);
  });
});
