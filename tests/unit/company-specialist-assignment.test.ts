import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/data/acquisition-data-source", () => ({ getAdminAcquisitionSnapshot: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn() }));

import { getCurrentAuthSession } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getAdminAcquisitionSnapshot } from "@/lib/data/acquisition-data-source";
import { companySpecialistInputSchema } from "@/lib/contracts/admin-operations";
import { getAdminCompanyContext, saveCompanySpecialistAssignment } from "@/lib/data/admin-company-operations-data-source";
import { PATCH } from "@/app/api/admin/companies/[id]/route";

const org = "00000000-0000-4000-8000-000000000001";
const actor = "actor-session";
const rpc = vi.fn();
const input = { specialistId: "specialist_fixture", expectedUpdatedAt: null };
const assignment = { specialistId: input.specialistId, updatedAt: "2026-10-19T13:00:00Z" };
const request = (value: unknown = input) => new Request("https://example.invalid", { method: "PATCH", body: JSON.stringify(value) });
const params = { params: Promise.resolve({ id: `company_${org}` }) };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentAuthSession).mockResolvedValue({ user: { id: actor, role: "superadmin" } } as Awaited<ReturnType<typeof getCurrentAuthSession>>);
  rpc.mockResolvedValue({ data: assignment, error: null });
  vi.mocked(createSupabaseAdminClient).mockReturnValue({ schema: () => ({ rpc }) } as unknown as ReturnType<typeof createSupabaseAdminClient>);
});

describe("atribuição principal persistida", () => {
  it("exige autenticação e papel de operação antes de ler ou escrever", async () => {
    for (const user of [null, { id: actor, role: "cliente" }, { id: actor, role: "admin" }]) {
      vi.mocked(getCurrentAuthSession).mockResolvedValue(user ? { user } as Awaited<ReturnType<typeof getCurrentAuthSession>> : null);
      expect((await PATCH(request(), params)).status).toBe(user ? 403 : 401);
      expect(await getAdminCompanyContext(`company_${org}`)).toBeNull();
    }
    expect(rpc).not.toHaveBeenCalled();
    expect(getAdminAcquisitionSnapshot).not.toHaveBeenCalled();
  });
  it("não aceita empresa ou ator no payload e usa a sessão/rota", async () => {
    expect(companySpecialistInputSchema.safeParse({ ...input, organizationId: "other" }).success).toBe(false);
    expect((await PATCH(request({ ...input, actorUserId: "other" }), params)).status).toBe(400);
    const response = await PATCH(request(), params);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ assignment });
    expect(rpc).toHaveBeenCalledWith("assign_organization_specialist", { p_organization_id: org, p_actor_user_id: actor, p_specialist_id: input.specialistId, p_expected_updated_at: null });
  });
  it("propaga conflito e falhas conhecidas sem detalhes privados", async () => {
    for (const [code, status] of [["PT409", 409], ["PT404", 404], ["PT400", 400], ["42501", 403], ["XX000", 500]] as const) {
      rpc.mockResolvedValue({ data: null, error: { code, message: "secret database information" } });
      const response = await PATCH(request(), params);
      expect(response.status).toBe(status);
      expect(JSON.stringify(await response.json())).not.toContain("secret");
    }
  });
  it("recusa empresa sem organização e permite remover especialista", async () => {
    await expect(saveCompanySpecialistAssignment("company_lead-only", actor, input)).rejects.toThrow("organização cadastrada");
    expect(rpc).not.toHaveBeenCalled();
    rpc.mockResolvedValue({ data: { ...assignment, specialistId: null }, error: null });
    expect((await PATCH(request({ ...input, specialistId: null }), params)).status).toBe(200);
  });
  it("carrega histórico da empresa pelo ID e não pelo nome visível", async () => {
    vi.mocked(getAdminAcquisitionSnapshot).mockResolvedValue({ companies: [{ id: `company_${org}`, organizationId: org, name: "Mesmo nome" }], modules: [] } as unknown as Awaited<ReturnType<typeof getAdminAcquisitionSnapshot>>);
    rpc.mockResolvedValue({ data: { assignment, deliveries: [] }, error: null });
    const result = await getAdminCompanyContext(`company_${org}`);
    expect(result?.operations.assignment).toEqual(assignment);
    expect(rpc).toHaveBeenCalledWith("get_organization_operations", { p_organization_id: org, p_actor_user_id: actor });
  });
});
