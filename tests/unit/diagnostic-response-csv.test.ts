import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/(app)/omdx/[id]/respostas/route";
import { buildDiagnosticResponseCsv } from "@/lib/data/omdx-response-csv";

const mocks = vi.hoisted(() => ({ session: vi.fn(), access: vi.fn(), diagnostic: vi.fn(), admin: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: mocks.session }));
vi.mock("@/lib/auth/access-control", () => ({ canAccessCustomerApp: mocks.access }));
vi.mock("@/lib/data/omdx-data-source", () => ({ getDiagnosticById: mocks.diagnostic }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: mocks.admin }));

const download = () => GET(new Request("http://app.test/omdx/test/respostas"), {
  params: Promise.resolve({ id: "test" }),
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ user: { id: "user", role: "cliente" } });
  mocks.access.mockReturnValue(true);
  mocks.diagnostic.mockResolvedValue({ id: "test", name: "Pesquisa Q4" });
});

describe("exportação das respostas", () => {
  it("exige sessão e acesso à pesquisa antes de consultar as respostas", async () => {
    mocks.session.mockResolvedValueOnce(null);
    expect((await download()).status).toBe(401);
    mocks.access.mockReturnValueOnce(false);
    expect((await download()).status).toBe(403);
    mocks.diagnostic.mockResolvedValueOnce(undefined);
    expect((await download()).status).toBe(404);
    expect(mocks.admin).not.toHaveBeenCalled();
  });

  it("preserva linhas por pergunta, acentos e impede fórmulas em células de texto", () => {
    const csv = buildDiagnosticResponseCsv([
      { responseNumber: 1, group: "lideranca", submittedAt: "2026-11-02T14:00:00Z", dimension: "Visão", question: '=HYPERLINK("site")', value: 4 },
      { responseNumber: 1, group: "lideranca", submittedAt: "2026-11-02T14:00:00Z", dimension: "Cultura", question: "Há clareza?", value: 5 },
    ]);
    expect(csv).toMatch(/^\uFEFFresposta;grupo;enviado_em;dimensao;pergunta;nota\r\n/);
    expect(csv).toContain('"1";"lideranca";"2026-11-02T14:00:00Z";"Visão";"\'=HYPERLINK(""site"")";"4"');
    expect(csv).toContain('"Cultura";"Há clareza?";"5"');
    expect(csv.split("\r\n")).toHaveLength(4);
  });

  it("pagina as notas além do limite de 500 linhas sem perder respostas", async () => {
    const sessions = Array.from({ length: 20 }, (_, index) => ({
      id: `session-${index}`, group_id: "operacao", submitted_at: "2026-11-02T14:00:00Z",
    }));
    const questions = Array.from({ length: 30 }, (_, index) => ({
      id: `question-${index}`, dimension_id: "dimension", text: `Pergunta ${index}`, order_index: index,
    }));
    const answers = sessions.flatMap((session) => questions.map((question) => ({
      response_session_id: session.id, question_id: question.id, value: 4,
    })));
    mocks.admin.mockReturnValue({
      from(table: string) {
        if (table === "diagnostics") return { select: () => ({ eq: () => ({ single: async () => ({ data: { template_id: "template" }, error: null }) }) }) };
        if (table === "questions") return { select: () => ({ eq: async () => ({ data: questions, error: null }) }) };
        if (table === "dimensions") return { select: async () => ({ data: [{ id: "dimension", name: "Cultura" }], error: null }) };
        if (table === "response_sessions") return { select: () => ({ eq: () => ({ eq: () => ({ order: () => ({ range: async (start: number, end: number) => ({ data: sessions.slice(start, end + 1), error: null }) }) }) }) }) };
        return { select: () => ({ in: () => ({ order: () => ({ order: () => ({ range: async (start: number, end: number) => ({ data: answers.slice(start, end + 1), error: null }) }) }) }) }) };
      },
    });

    const response = await download();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toContain("respostas-pesquisa-q4-test.csv");
    expect((await response.text()).split("\r\n")).toHaveLength(602);
  });
});
