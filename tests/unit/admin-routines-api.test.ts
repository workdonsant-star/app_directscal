import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/data/admin-adherence-data-source", () => ({ getAdminRoutineWorkspace: vi.fn(), getAdminRoutineDirectory: vi.fn(), writeAdminRoutine: vi.fn() }));
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getAdminRoutineDirectory, getAdminRoutineWorkspace, writeAdminRoutine } from "@/lib/data/admin-adherence-data-source";
import { AssetAdherenceError } from "@/lib/data/asset-adherence-data-source";
import { GET, POST } from "@/app/api/admin/companies/[id]/routines/route";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const companyId = `company_${id(1)}`;
const context = () => ({ params: Promise.resolve({ id: companyId }) });
const input = { operation: "situacao", id: id(3), routineId: id(4), expectedEventId: null, action: "pausar", reason: "Aguardar revisão" };
const request = (body: unknown) => new Request(`http://localhost/api/admin/companies/${companyId}/routines`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const session = (role = "superadmin", flags = {}) => ({ user: { id: id(2), role }, ...flags }) as Awaited<ReturnType<typeof getCurrentAuthSession>>;

beforeEach(() => { vi.clearAllMocks(); vi.mocked(getCurrentAuthSession).mockResolvedValue(session()); vi.mocked(writeAdminRoutine).mockResolvedValue({ paused: true, eventId: id(3), recordedAt: "2026-10-20T00:00:00Z" }); });

describe("API interna de rotinas", () => {
  it("exige autenticação e papel definitivo antes de acessar dados ou Slack", async () => {
    for (const value of [null, session("cliente"), session("admin"), session("superadmin", { acquisition: true }), session("superadmin", { leadershipInvitation: true })]) {
      vi.mocked(getCurrentAuthSession).mockResolvedValue(value);
      expect((await POST(request(input), context())).status).toBe(value ? 403 : 401);
      expect((await GET(new Request("http://localhost/api"), context())).status).toBe(value ? 403 : 401);
    }
    expect(writeAdminRoutine).not.toHaveBeenCalled(); expect(getAdminRoutineWorkspace).not.toHaveBeenCalled(); expect(getAdminRoutineDirectory).not.toHaveBeenCalled();
  });
  it("deriva empresa e ator da rota e sessão e não aceita campos de autorização", async () => {
    expect((await POST(request({ ...input, organizationId: id(99), actorUserId: id(99) }), context())).status).toBe(400);
    expect(writeAdminRoutine).not.toHaveBeenCalled();
    const response = await POST(request(input), context()); expect(response.status).toBe(200);
    expect(writeAdminRoutine).toHaveBeenCalledWith(companyId, id(2), input);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it("separa o diretório ativo da leitura do workspace", async () => {
    vi.mocked(getAdminRoutineDirectory).mockResolvedValue([]);
    const response = await GET(new Request("http://localhost/api?directory=1"), context());
    expect(await response.json()).toEqual({ users: [] });
    expect(getAdminRoutineDirectory).toHaveBeenCalledWith(companyId, id(2)); expect(getAdminRoutineWorkspace).not.toHaveBeenCalled();
  });
  it("preserva erro de conflito sem expor falha interna", async () => {
    vi.mocked(writeAdminRoutine).mockRejectedValueOnce(new AssetAdherenceError("O acordo mudou. Seu texto foi preservado.", 409));
    const conflict = await POST(request(input), context()); expect(conflict.status).toBe(409); expect(await conflict.json()).toEqual({ message: "O acordo mudou. Seu texto foi preservado." });
    vi.mocked(writeAdminRoutine).mockRejectedValueOnce(new Error("credencial ou detalhe privado"));
    const failure = await POST(request(input), context()); expect(failure.status).toBe(500); expect(JSON.stringify(await failure.json())).not.toContain("privado");
  });
  it("recusa transferência sem controle de versão e motivo", async () => {
    const response = await POST(request({ operation: "transferir", id: id(3), diagnosticId: id(5), actionPointId: "action_processos_ritual", expectedRules: [], assigneeUserId: "U2" }), context());
    expect(response.status).toBe(400); expect(writeAdminRoutine).not.toHaveBeenCalled();
  });
});
