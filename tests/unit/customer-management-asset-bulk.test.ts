import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/data/management-asset-update-data-source", () => ({
  updateCustomerAssetsInBulk: vi.fn(),
  CustomerAssetUpdateError: class extends Error { constructor(message: string, public status: number) { super(message); } },
}));
import { PATCH } from "@/app/api/management-assets/bulk/route";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { CustomerAssetUpdateError, updateCustomerAssetsInBulk } from "@/lib/data/management-asset-update-data-source";
const id = "11111111-1111-4111-8111-111111111111";
const input = { assetIds: [id], changes: { type: "playbook", categoryKey: "cultura" } };
const run = (body: unknown = input) => PATCH(new Request("http://localhost/api/management-assets/bulk", { method: "PATCH", body: JSON.stringify(body) }));
function session(role = "cliente", extra = {}) { return { user: { id, role }, ...extra } as NonNullable<Awaited<ReturnType<typeof getCurrentAuthSession>>>; }
beforeEach(() => { vi.clearAllMocks(); vi.mocked(getCurrentAuthSession).mockResolvedValue(session()); });
describe("metadados de ativos em lote pelo dono", () => {
  it("exige sessão", async () => { vi.mocked(getCurrentAuthSession).mockResolvedValue(null); expect((await run()).status).toBe(401); expect(updateCustomerAssetsInBulk).not.toHaveBeenCalled(); });
  it.each([session("admin"), session("superadmin"), session("cliente", { acquisition: true }), session("cliente", { leadershipInvitation: true })])("nega papéis e intents não autorizados", async value => { vi.mocked(getCurrentAuthSession).mockResolvedValue(value); expect((await run()).status).toBe(403); expect(updateCustomerAssetsInBulk).not.toHaveBeenCalled(); });
  it.each([
    { ...input, organizationId: id }, { ...input, actorId: id }, { ...input, assetIds: [] },
    { ...input, assetIds: [id, id] }, { ...input, assetIds: ["inválido"] },
    { ...input, changes: {} }, { ...input, changes: { type: "outro" } },
    { ...input, changes: { categoryKey: " " } }, { ...input, changes: { title: "Novo título" } },
  ])("recusa payload inválido ou campos extras", async body => { expect((await run(body)).status).toBe(400); expect(updateCustomerAssetsInBulk).not.toHaveBeenCalled(); });
  it.each([{ type: "raci" }, { categoryKey: "operacoes" }, input.changes])("aceita só tipo, só categoria ou ambos com ator da sessão", async changes => { expect((await run({ ...input, changes })).status).toBe(200); expect(updateCustomerAssetsInBulk).toHaveBeenCalledWith(id, { ...input, changes }); });
  it("propaga conflito e oculta falhas internas", async () => {
    vi.mocked(updateCustomerAssetsInBulk).mockRejectedValueOnce(new CustomerAssetUpdateError("Seleção mudou", 409));
    expect((await run()).status).toBe(409);
    vi.mocked(updateCustomerAssetsInBulk).mockRejectedValueOnce(new Error("segredo"));
    const response = await run(); expect(response.status).toBe(500); expect(await response.text()).not.toContain("segredo");
  });
});
