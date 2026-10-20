import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { from, rpc } = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: () => ({ from, schema: () => ({rpc}) }) }));

import { POST } from "@/app/api/omdx/responses/route";

beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockResolvedValue({ data: { duplicate: false }, error: null });
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-19T03:00:00Z"));
});
afterEach(() => vi.useRealTimers());

function mockTables(deadline: string | null) {
  from.mockImplementation((table: string) => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: table === "diagnostic_share_links"
        ? { id: "link", diagnostic_id: "diagnostic", group_id: "operacao", expires_at: null }
        : { status: "ativo", closed_at: null, template_id: "template", deadline }, error: null })),
      returns: vi.fn(async () => ({ data: [{ id: "q1" }], error: null })),
      insert: vi.fn(() => query),
      single: vi.fn(async () => ({ data: { id: "response" }, error: null })),
      then: (resolve: (value: unknown) => unknown) => resolve({ error: null }),
    };
    return query;
  });
}

let requestId = 0;
function submit() {
  return POST(new Request("http://localhost/api/omdx/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": `test-${++requestId}` },
    body: JSON.stringify({ token: "deadline-test", submissionId: "00000000-0000-4000-8000-000000000001", answers: [{ questionId: "q1", value: 3 }] }),
  }));
}

describe("public response deadline", () => {
  it("blocks expired research even with an active, non-expiring link, before writing", async () => {
    mockTables("2026-10-18");
    const response = await submit();
    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({ message: "O prazo desta pesquisa terminou. Não são aceitas novas respostas." });
    expect(from.mock.calls.map(([table]) => table)).toEqual(["diagnostic_share_links", "diagnostics"]);
  });

  it.each(["2026-10-19", null])("accepts available research with deadline %s", async (deadline) => {
    mockTables(deadline);
    expect((await submit()).status).toBe(201);
    expect(rpc).toHaveBeenCalledWith("submit_anonymous_likert_response", expect.objectContaining({p_submission_id:"00000000-0000-4000-8000-000000000001"}));
  });

  it("accepts the final instant of the selected day in Sao Paulo", async () => {
    vi.setSystemTime(new Date("2026-10-19T02:59:59.999Z"));
    mockTables("2026-10-18");
    expect((await submit()).status).toBe(201);
  });
  it("não confirma nem grava cookie quando a transação falha", async () => {
    mockTables(null);
    rpc.mockResolvedValueOnce({data:null,error:{code:"XX000",message:"detalhe privado do banco"}});
    const response=await submit();
    expect(response.status).toBe(500);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(await response.text()).not.toContain("detalhe privado");
    expect(from.mock.calls.map(([table])=>table)).not.toContain("response_sessions");
  });
  it("revalida encerramento concorrente no banco sem cookie de sucesso", async () => {
    mockTables(null);
    rpc.mockResolvedValueOnce({data:null,error:{code:"PT409"}});
    const response=await submit();
    expect(response.status).toBe(409);expect(response.headers.get("set-cookie")).toBeNull();
  });
  it("confirma repetição idempotente de uma gravação anterior", async () => {
    mockTables(null);
    rpc.mockResolvedValueOnce({data:{duplicate:true},error:null});
    const response=await submit();
    expect(response.status).toBe(201);expect(response.headers.get("set-cookie")).toContain("directscal_omdx_response_");
  });

});
