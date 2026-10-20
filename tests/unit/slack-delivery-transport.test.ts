import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { openSlackDirectConversation, postSlackMessage } from "@/lib/integrations/slack";
afterEach(() => vi.unstubAllGlobals());
const send = () => postSlackMessage("token-ficticio", { channel: "D1", text: "Resposta fictícia", clientMsgId: "00000000-0000-4000-8000-000000000001" });
describe("confirmação de envio Slack", () => {
  it("devolve ts/canal e não toma HTTP 200 isolado como sucesso", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ ok: true, channel: "D1", ts: "100.001" })).mockResolvedValueOnce(Response.json({ ok: false, error: "missing_scope" }));
    vi.stubGlobal("fetch", fetcher);
    expect(await send()).toEqual({ channel: "D1", ts: "100.001" });
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({ client_msg_id: "00000000-0000-4000-8000-000000000001", unfurl_links: false });
    await expect(send()).rejects.toMatchObject({ code: "missing_scope", retryable: false, uncertain: false });
  });
  it("token revogado e canal indisponível são falhas confirmadas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json({ ok: false, error: "token_revoked" })).mockResolvedValueOnce(Response.json({ ok: false, error: "channel_not_found" })));
    await expect(send()).rejects.toMatchObject({ code: "invalid_auth", uncertain: false });
    await expect(send()).rejects.toMatchObject({ code: "channel_not_found", uncertain: false });
  });
  it("429 respeita Retry-After sem depender de JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 429, headers: { "Retry-After": "120" } })));
    await expect(send()).rejects.toMatchObject({ code: "rate_limited", retryable: true, retryAfter: 120, uncertain: false });
  });
  it("timeout, resposta inválida e 500 não permitem reenviar automaticamente", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("token privado no erro"))
      .mockResolvedValueOnce(new Response("invalid json"))
      .mockResolvedValueOnce(Response.json({ ok: false, error: "fatal_error" }, { status: 500 })));
    for (let i = 0; i < 3; i++) await expect(send()).rejects.toMatchObject({ code: "envio_sem_confirmacao", retryable: false, uncertain: true, message: "Não foi possível confirmar a entrega no Slack." });
  });
});

describe("abertura de conversa privada", () => {
  it("abre somente DM da pessoa revalidada e confere o retorno", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ ok: true, channel: { id: "D1" } })); vi.stubGlobal("fetch", fetcher);
    expect(await openSlackDirectConversation("token-ficticio", "U1")).toBe("D1");
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ users: "U1" });
  });
  it("não transforma falha de abertura em autorização de envio", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json({ ok: false, error: "missing_scope" })).mockRejectedValueOnce(new Error("detalhe privado")));
    await expect(openSlackDirectConversation("token-ficticio", "U1")).rejects.toMatchObject({ code: "missing_scope", retryable: false });
    await expect(openSlackDirectConversation("token-ficticio", "U1")).rejects.toMatchObject({ code: "contexto_indisponivel", retryable: true, message: "Não foi possível confirmar a entrega no Slack." });
  });
});
