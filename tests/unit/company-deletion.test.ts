import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/env", () => ({ isFeatureAcquisitionEnabled: vi.fn(() => true) }));

import { getCurrentAuthSession } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { isFeatureAcquisitionEnabled } from "@/lib/env";
import { DELETE } from "@/app/api/admin/companies/route";

const org = "00000000-0000-4000-8000-000000000001";
const input = { companyIds: [`company_${org}`], confirmation: "EXCLUIR" };
const result = { deletedCompanyIds: input.companyIds, deletedUsers: 2, retainedUsers: 1 };
const rpc = vi.fn();
const request = (body: unknown = input, origin = "https://example.invalid") => new Request("https://example.invalid/api/admin/companies", {
  method: "DELETE", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body),
});
type Session = Awaited<ReturnType<typeof getCurrentAuthSession>>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isFeatureAcquisitionEnabled).mockReturnValue(true);
  vi.mocked(getCurrentAuthSession).mockResolvedValue({ user: { id: "session-actor", role: "superadmin" } } as Session);
  rpc.mockResolvedValue({ data: result, error: null });
  vi.mocked(createSupabaseAdminClient).mockReturnValue({ schema: () => ({ rpc }) } as unknown as ReturnType<typeof createSupabaseAdminClient>);
});

describe("exclusão integral de empresas", () => {
  it("recusa anônimo, cliente, admin e sessões temporárias antes do banco", async () => {
    for (const session of [null, { user: { role: "cliente" } }, { user: { role: "admin" } },
      { user: { role: "superadmin" }, acquisition: true }, { user: { role: "superadmin" }, leadershipInvitation: true }]) {
      vi.mocked(getCurrentAuthSession).mockResolvedValue(session as Session);
      expect((await DELETE(request())).status).toBe(session ? 403 : 401);
    }
    expect(rpc).not.toHaveBeenCalled();
  });
  it("exige confirmação, seleção válida/única/limitada e recusa ator forjado", async () => {
    for (const body of [null, { ...input, confirmation: "excluir" }, { ...input, companyIds: [] },
      { ...input, companyIds: [input.companyIds[0], input.companyIds[0]] }, { ...input, companyIds: ["company_x"] },
      { ...input, companyIds: Array.from({ length: 101 }, (_, index) => `company_00000000-0000-4000-8000-${String(index).padStart(12, "0")}`) },
      { ...input, actorUserId: "forged" }]) {
      expect((await DELETE(request(body))).status).toBe(400);
    }
    expect(rpc).not.toHaveBeenCalled();
  });
  it("recusa origem externa e feature desligada", async () => {
    expect((await DELETE(request(input, "https://other.invalid"))).status).toBe(403);
    vi.mocked(isFeatureAcquisitionEnabled).mockReturnValue(false);
    expect((await DELETE(request())).status).toBe(404);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("deriva ator da sessão e executa uma única transação para todo o lote", async () => {
    const response = await DELETE(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(result);
    expect(rpc).toHaveBeenCalledExactlyOnceWith("delete_admin_companies", {
      p_actor_user_id: "session-actor", p_organization_ids: [org], p_confirmation: "EXCLUIR",
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("preserva status de conflitos/proteção e não expõe erros internos", async () => {
    for (const [code, status] of [["PGRST202", 503], ["PT403", 403], ["PT404", 404], ["PT409", 409], ["23503", 409], ["42501", 403], ["PT400", 400], ["XX000", 500]]) {
      rpc.mockResolvedValue({ data: null, error: { code, message: "secret" } });
      const response = await DELETE(request());
      expect(response.status).toBe(status);
      expect(JSON.stringify(await response.json())).not.toContain("secret");
    }
  });
  it("não confirma sucesso se o banco retorna resultado inválido", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect((await DELETE(request())).status).toBe(500);
  });
});
