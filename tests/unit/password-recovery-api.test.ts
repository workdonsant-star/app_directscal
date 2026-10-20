import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/server", async original => ({ ...await original<typeof import("next/server")>(), after: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getCurrentAuthSession: vi.fn() }));
vi.mock("@/lib/auth/password-recovery", async original => ({ ...await original<typeof import("@/lib/auth/password-recovery")>(), requestCustomerPasswordReset: vi.fn(), processPasswordResetDelivery: vi.fn(), completeCustomerPasswordReset: vi.fn(), changeCustomerPassword: vi.fn() }));
import { after } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { changeCustomerPassword, completeCustomerPasswordReset, requestCustomerPasswordReset } from "@/lib/auth/password-recovery";
import { POST as REQUEST } from "@/app/api/auth/reset-password/route";
import { POST as COMPLETE } from "@/app/api/auth/reset-password/complete/route";
import { POST as CHANGE } from "@/app/api/profile/password/route";
import { POST as WORKER } from "@/app/api/internal/password-resets/route";
import type { AuthSession } from "@/lib/contracts/auth";
const id = "00000000-0000-4000-8000-000000000001";
const session: AuthSession = { token: "fixture", supabaseAccessToken: "fixture-jwt", user: { id, role: "cliente", name: "Pessoa fixture", email: "pessoa@fixture.invalid", company: "Fixture" }, createdAt: "2026-10-20T10:00:00Z", expiresAt: "2026-10-21T10:00:00Z" };
const request = (body: unknown) => new Request("https://fixture.invalid", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); vi.mocked(getCurrentAuthSession).mockResolvedValue(session); vi.mocked(requestCustomerPasswordReset).mockResolvedValue(id); });
describe("API de recuperação e própria senha", () => {
  it("não revela existência/método e só agenda o que já foi persistido", async () => {
    const known = await REQUEST(request({ email: "pessoa@fixture.invalid" }));
    expect(known.status).toBe(200); expect(after).toHaveBeenCalledOnce();
    vi.mocked(after).mockClear(); vi.mocked(requestCustomerPasswordReset).mockResolvedValue(null);
    const unknown = await REQUEST(request({ email: "outra@fixture.invalid" }));
    expect(unknown.status).toBe(200); expect(await unknown.text()).toBe(await known.text()); expect(after).not.toHaveBeenCalled();
  });
  it("não confirma envio quando falha a persistência/configuração", async () => {
    vi.mocked(requestCustomerPasswordReset).mockRejectedValue(new Error("detalhe privado"));
    const response = await REQUEST(request({ email: "pessoa@fixture.invalid" })); expect(response.status).toBe(503); expect(await response.text()).not.toContain("privado"); expect(after).not.toHaveBeenCalled();
  });
  it("recusa corpo forjado e token inválido antes de consultar credenciais", async () => {
    expect((await REQUEST(request({ email: "pessoa@fixture.invalid", userId: id }))).status).toBe(400);
    expect((await COMPLETE(request({ token: "inválido", password: "senha nova extensa", confirmation: "senha nova extensa" }))).status).toBe(400);
    expect(requestCustomerPasswordReset).not.toHaveBeenCalled(); expect(completeCustomerPasswordReset).not.toHaveBeenCalled();
  });
  it("troca própria exige sessão definitiva e não aceita ator no corpo", async () => {
    const input = { currentPassword: "senha atual extensa", password: "senha nova extensa", confirmation: "senha nova extensa" };
    for (const candidate of [null, { ...session, acquisition: true }, { ...session, leadershipInvitation: true }, { ...session, supabaseAccessToken: undefined }, { ...session, user: { ...session.user, role: "superadmin" as const } }]) {
      vi.mocked(getCurrentAuthSession).mockResolvedValue(candidate);
      expect((await CHANGE(request(input))).status).toBe(candidate ? 403 : 401);
    }
    expect(changeCustomerPassword).not.toHaveBeenCalled();
    vi.mocked(getCurrentAuthSession).mockResolvedValue(session);
    expect((await CHANGE(request({ ...input, userId: id }))).status).toBe(400);
    expect((await CHANGE(request(input))).status).toBe(200); expect(changeCustomerPassword).toHaveBeenCalledWith(session, input);
  });
  it("consumidor de e-mail é fechado por padrão e exige segredo próprio", async () => {
    expect((await WORKER(request({}))).status).toBe(401);
    vi.stubEnv("PASSWORD_RESET_WORKER_SECRET", "x".repeat(32));
    expect((await WORKER(new Request("https://fixture.invalid", { method: "POST", headers: { authorization: "Bearer " + "x".repeat(31) } }))).status).toBe(401);
  });
});
