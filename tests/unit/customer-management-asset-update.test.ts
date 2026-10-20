import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/data/management-asset-update-data-source", () => ({
  updateCustomerManagementAsset: vi.fn(),
  CustomerAssetUpdateError: class extends Error { constructor(message: string, public status: number) { super(message); } },
}));
import { PATCH } from "@/app/api/management-assets/[id]/route";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { CustomerAssetUpdateError, updateCustomerManagementAsset } from "@/lib/data/management-asset-update-data-source";
const id = "11111111-1111-4111-8111-111111111111";
const input = { expectedVersionId: id, title: "Ativo", summary: "Resumo", content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Texto" }] }] } };
const run = (body: unknown = input) => PATCH(new Request("http://localhost/api/management-assets/" + id, { method: "PATCH", body: JSON.stringify(body) }), { params: Promise.resolve({ id }) });
function session(role = "cliente", extra = {}) { return { user: { id, role }, ...extra } as NonNullable<Awaited<ReturnType<typeof getCurrentAuthSession>>>; }
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getCurrentAuthSession).mockResolvedValue(session()); });
describe("atualização de ativo pelo cliente", () => {
  it("exige autenticação", async () => { vi.mocked(getCurrentAuthSession).mockResolvedValue(null); expect((await run()).status).toBe(401); expect(updateCustomerManagementAsset).not.toHaveBeenCalled(); });
  it.each([session("admin"), session("superadmin"), session("cliente", { acquisition: true }), session("cliente", { leadershipInvitation: true })])("bloqueia papel/intenção sem autorização", async (value) => { vi.mocked(getCurrentAuthSession).mockResolvedValue(value); expect((await run()).status).toBe(403); expect(updateCustomerManagementAsset).not.toHaveBeenCalled(); });
  it.each([{ ...input, organizationId: id }, { ...input, expectedVersionId: "inválido" }, { ...input, content: { type: "doc", content: [{ type: "script" }] } }, { ...input, title: " " }])("valida payload sem aceitar empresa ou conteúdo arbitrário", async (body) => { expect((await run(body)).status).toBe(400); expect(updateCustomerManagementAsset).not.toHaveBeenCalled(); });
  it("passa ator exclusivamente da sessão e versão base", async () => { const response = await run(); expect(response.status).toBe(200); expect(updateCustomerManagementAsset).toHaveBeenCalledWith(id, id, input); expect(response.headers.get("Cache-Control")).toBe("no-store"); });
  it("preserva conflito e oculta falhas internas", async () => { vi.mocked(updateCustomerManagementAsset).mockRejectedValueOnce(new CustomerAssetUpdateError("Versão mudou", 409)); expect((await run()).status).toBe(409); vi.mocked(updateCustomerManagementAsset).mockRejectedValueOnce(new Error("segredo")); const response = await run(); expect(response.status).toBe(500); expect(await response.text()).not.toContain("segredo"); });
});
