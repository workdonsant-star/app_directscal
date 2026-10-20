import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: vi.fn(), createSupabaseRlsClient: vi.fn() }));
import { createSupabaseAdminClient, createSupabaseRlsClient } from "@/lib/supabase/server";
import { getCustomerRoutineAgreements } from "@/lib/data/customer-routine-agreements";
import type { AuthSession } from "@/lib/contracts/auth";

const visible = vi.fn();
const rpc = vi.fn();
const session: AuthSession = { token: "fixture", supabaseAccessToken: "jwt-ficticio", user: { id: "owner", name: "Pessoa fictícia", email: "pessoa@example.test", role: "cliente", company: "Empresa fictícia" }, createdAt: "2026-10-20T10:00:00Z", expiresAt: "2026-10-21T10:00:00Z" };
beforeEach(() => {
  vi.clearAllMocks();
  const query = { select: vi.fn(() => query), eq: vi.fn(() => query), maybeSingle: visible };
  vi.mocked(createSupabaseRlsClient).mockReturnValue({ from: () => query } as unknown as ReturnType<typeof createSupabaseRlsClient>);
  vi.mocked(createSupabaseAdminClient).mockReturnValue({ schema: () => ({ rpc }) } as unknown as ReturnType<typeof createSupabaseAdminClient>);
  visible.mockResolvedValue({ data: { id: "coleta" }, error: null });
  rpc.mockResolvedValue({ data: [], error: null });
});
describe("acordos visíveis ao cliente", () => {
  it("nega sessões administrativas, temporárias e sem JWT antes de consultar", async () => {
    for (const candidate of [{ ...session, user: { ...session.user, role: "superadmin" as const } }, { ...session, acquisition: true }, { ...session, leadershipInvitation: true }, { ...session, supabaseAccessToken: undefined }]) {
      expect(await getCustomerRoutineAgreements(candidate, "empresa", "coleta")).toEqual([]);
    }
    expect(createSupabaseRlsClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("respeita a policy do diagnóstico antes de usar service role", async () => {
    visible.mockResolvedValueOnce({ data: null, error: null });
    expect(await getCustomerRoutineAgreements(session, "empresa", "coleta")).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
    expect(await getCustomerRoutineAgreements(session, "empresa", "coleta")).toEqual([]);
    expect(createSupabaseRlsClient).toHaveBeenCalledWith("jwt-ficticio");
    expect(rpc).toHaveBeenCalledWith("get_customer_adherence_agreements", { p_organization_id: "empresa", p_actor_user_id: "owner", p_diagnostic_id: "coleta" });
  });
  it("falha sem detalhes privados quando RLS ou RPC falham", async () => {
    visible.mockResolvedValueOnce({ data: null, error: { message: "detalhe privado" } });
    await expect(getCustomerRoutineAgreements(session, "empresa", "coleta")).rejects.toThrow("Não foi possível consultar os acordos desta coleta.");
    expect(rpc).not.toHaveBeenCalled();
    rpc.mockResolvedValueOnce({ data: null, error: { message: "outro detalhe privado" } });
    await expect(getCustomerRoutineAgreements(session, "empresa", "coleta")).rejects.toThrow("Não foi possível consultar os acordos desta coleta.");
  });
});
