import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getPasswordRecoveryConfiguration, renderPasswordRecoveryEmail, sendPasswordRecoveryEmail } from "@/lib/email/password-recovery-email";
beforeEach(() => { vi.unstubAllGlobals(); vi.stubEnv("AUTH_SECRET", "x".repeat(32)); vi.stubEnv("RESEND_API_KEY", "fixture"); vi.stubEnv("RESEND_FROM_EMAIL", "conta@fixture.invalid"); vi.stubEnv("PUBLIC_APP_URL", "https://app.fixture.invalid"); });
describe("e-mail transacional de recuperação", () => {
  it("usa HTML acessível, texto e link de uso único sem registro de token", () => {
    const content = renderPasswordRecoveryEmail("https://app.fixture.invalid/recuperar-senha#codigo=fixture");
    expect(content.html).toContain('lang="pt-BR"'); expect(content.text).toContain("uma hora"); expect(content.text).toContain("uma única vez");
    expect(content.subject).toBe("Redefina sua senha na DirectScal");
  });
  it("envio repete a mesma chave do provedor, sem usar host da requisição", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "provider-fixture" }), { status: 200 })); vi.stubGlobal("fetch", fetcher);
    await sendPasswordRecoveryEmail("request-fixture", "pessoa@fixture.invalid", "https://app.fixture.invalid/recuperar-senha#codigo=fixture");
    expect(fetcher).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({ headers: expect.objectContaining({ "Idempotency-Key": "password-reset-request-fixture" }) }));
  });
  it("recusa origem insegura e classifica 429 sem expor resposta do provedor", async () => {
    vi.stubEnv("PUBLIC_APP_URL", "http://other.fixture.invalid"); expect(getPasswordRecoveryConfiguration).toThrow();
    vi.stubEnv("PUBLIC_APP_URL", "https://app.fixture.invalid");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "detalhe privado" }), { status: 429, headers: { "retry-after": "120" } })));
    await expect(sendPasswordRecoveryEmail("fixture", "pessoa@fixture.invalid", "https://app.fixture.invalid")).rejects.toMatchObject({ retryable: true, retryAfter: 120, message: "Não foi possível enviar as instruções." });
  });
});
