import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseAdminClient: () => ({ schema: () => ({ rpc }) }) }));
vi.mock("@/lib/email/password-recovery-email", async original => ({ ...await original<typeof import("@/lib/email/password-recovery-email")>(), sendPasswordRecoveryEmail: vi.fn() }));
import { createRecoveryToken, hashRecoveryToken, openRecoveryToken, sealRecoveryToken } from "@/lib/auth/password-recovery-crypto";
import { changeCustomerPassword, completeCustomerPasswordReset, processPasswordResetDelivery, requestCustomerPasswordReset } from "@/lib/auth/password-recovery";
import { PasswordRecoveryEmailError, sendPasswordRecoveryEmail } from "@/lib/email/password-recovery-email";
import { hashPasswordCredential, verifyPasswordCredential } from "@/lib/auth/password-credentials";
import type { AuthSession } from "@/lib/contracts/auth";
const id = "00000000-0000-4000-8000-000000000001", lease = "00000000-0000-4000-8000-000000000002";
const session: AuthSession = { token: "fixture", supabaseAccessToken: "fixture-jwt", user: { id, role: "cliente", name: "Pessoa fixture", email: "pessoa@fixture.invalid", company: "Fixture" }, createdAt: "2026-10-20T10:00:00Z", expiresAt: "2026-10-21T10:00:00Z" };
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("AUTH_SECRET", "x".repeat(32)); vi.stubEnv("RESEND_API_KEY", "fixture"); vi.stubEnv("RESEND_FROM_EMAIL", "DirectScal <conta@fixture.invalid>"); vi.stubEnv("PUBLIC_APP_URL", "https://app.fixture.invalid"); });
describe("recuperação sem segredo persistido em texto", () => {
  it("token forte, criptografia autenticada e vínculo com solicitação/destino", () => {
    const token = createRecoveryToken(id), sealed = sealRecoveryToken(id, token, "https://app.fixture.invalid/recuperar-senha");
    expect(token).toMatch(/\.[A-Za-z0-9_-]{43}$/); expect(hashRecoveryToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(sealed)).not.toContain(token);
    expect(openRecoveryToken(id, sealed).token).toBe(token);
    expect(() => openRecoveryToken(lease, sealed)).toThrow();
    expect(() => openRecoveryToken(id, { ...sealed, url: "https://other.fixture.invalid" })).toThrow();
  });
  it("persiste hash e caixa criptografada antes de aceitar; não envia na solicitação", async () => {
    rpc.mockResolvedValueOnce({ data: id, error: null });
    await requestCustomerPasswordReset(" PESSOA@fixture.invalid ");
    const [name, args] = rpc.mock.calls[0];
    expect(name).toBe("start_customer_password_reset"); expect(args.p_email).toBe("pessoa@fixture.invalid");
    expect(args.p_token_hash).toMatch(/^[a-f0-9]{64}$/); expect(args.p_sealed_token.ciphertext).toBeTruthy();
    expect(args).not.toHaveProperty("token"); expect(sendPasswordRecoveryEmail).not.toHaveBeenCalled();
  });
  it("worker deriva destinatário do banco, usa fragmento e confirma depois do provedor", async () => {
    const token = createRecoveryToken(id);
    rpc.mockResolvedValueOnce({ data: { id, leaseId: lease, email: "pessoa@fixture.invalid", sealedToken: sealRecoveryToken(id, token, "https://app.fixture.invalid/recuperar-senha") }, error: null }).mockResolvedValueOnce({ error: null });
    vi.mocked(sendPasswordRecoveryEmail).mockResolvedValue("provider-fixture");
    expect(await processPasswordResetDelivery(id)).toBe(true);
    expect(sendPasswordRecoveryEmail).toHaveBeenCalledWith(id, "pessoa@fixture.invalid", `https://app.fixture.invalid/recuperar-senha#codigo=${token}`);
    expect(rpc).toHaveBeenLastCalledWith("finish_password_reset_delivery", expect.objectContaining({ p_id: id, p_lease_id: lease, p_message_id: "provider-fixture" }));
  });
  it("falha temporária conserva reentrada com mesma solicitação e Retry-After", async () => {
    rpc.mockResolvedValueOnce({ data: { id, leaseId: lease, email: "pessoa@fixture.invalid", sealedToken: sealRecoveryToken(id, createRecoveryToken(id), "https://app.fixture.invalid/recuperar-senha") }, error: null }).mockResolvedValueOnce({ error: null });
    vi.mocked(sendPasswordRecoveryEmail).mockRejectedValue(new PasswordRecoveryEmailError(true, 120));
    await processPasswordResetDelivery(id);
    expect(rpc).toHaveBeenLastCalledWith("finish_password_reset_delivery", expect.objectContaining({ p_message_id: null, p_retryable: true, p_retry_after: 120 }));
  });
  it("não altera credencial sem senha atual correta nem cria senha Google", async () => {
    const input = { currentPassword: "incorreta", password: "uma senha nova extensa", confirmation: "uma senha nova extensa" };
    rpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(changeCustomerPassword(session, input)).rejects.toThrow("usa Google");
    const oldHash = hashPasswordCredential("senha atual extensa");
    rpc.mockResolvedValueOnce({ data: { passwordHash: oldHash }, error: null }).mockResolvedValueOnce({ data: true, error: null });
    await expect(changeCustomerPassword(session, input)).rejects.toThrow("não confere");
    expect(rpc.mock.calls.some(call => call[0] === "change_customer_password")).toBe(false);
  });
  it("senha nova só é enviada ao banco como hash após contexto válido", async () => {
    const token = createRecoveryToken(id), password = "uma senha nova extensa";
    rpc.mockResolvedValueOnce({ data: { userId: id, passwordHash: "hash-anterior-fixture" }, error: null }).mockResolvedValueOnce({ data: true, error: null });
    await completeCustomerPasswordReset({ token, password, confirmation: password });
    const [name, args] = rpc.mock.calls.at(-1)!;
    expect(name).toBe("complete_customer_password_reset"); expect(args.p_token_hash).toBe(hashRecoveryToken(token));
    expect(args.p_expected_hash).toBe("hash-anterior-fixture"); expect(verifyPasswordCredential(password, args.p_new_hash)).toBe(true);
    expect(JSON.stringify(args)).not.toContain(password); expect(JSON.stringify(args)).not.toContain(token);
  });
  it("token expirado/consumido e falha de confirmação não viram sucesso", async () => {
    const token = createRecoveryToken(id), input = { token, password: "uma senha nova extensa", confirmation: "uma senha nova extensa" };
    rpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(completeCustomerPasswordReset(input)).rejects.toThrow("expirou");
    rpc.mockResolvedValueOnce({ data: { userId: id, passwordHash: "hash-fixture" }, error: null }).mockResolvedValueOnce({ data: false, error: null });
    await expect(completeCustomerPasswordReset(input)).rejects.toThrow("não está mais disponível");
  });
});
