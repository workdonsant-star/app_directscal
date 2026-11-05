import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/integrations/slack", () => ({ verifySlackRequest: vi.fn(), getSlackInstallation: vi.fn(), respondToSlackAction: vi.fn() }));
vi.mock("@/lib/agent/asset-question-service", () => ({ recordAssetAnswerFeedback: vi.fn() }));
vi.mock("@/lib/integrations/slack-delivery-store", () => ({ enqueueSlackDelivery: vi.fn() }));
vi.mock("@/lib/integrations/slack-delivery", () => ({ processSlackDelivery: vi.fn() }));
import { after } from "next/server";
import { getSlackInstallation, respondToSlackAction, verifySlackRequest } from "@/lib/integrations/slack";
import { recordAssetAnswerFeedback } from "@/lib/agent/asset-question-service";
import { enqueueSlackDelivery } from "@/lib/integrations/slack-delivery-store";
import { POST } from "@/app/api/integrations/slack/interactions/route";
const id = "00000000-0000-4000-8000-000000000001";
const payload = { type: "block_actions", team: { id: "T1" }, user: { id: "U1" }, channel: { id: "D1" }, actions: [{ action_id: "routine_reply_confirm", action_ts: "100.2", value: id }] };
const request = (body: unknown = payload) => new Request("https://fixture.invalid/api/integrations/slack/interactions", { method: "POST", body: new URLSearchParams({ payload: JSON.stringify(body) }) });
beforeEach(() => { vi.clearAllMocks(); vi.mocked(verifySlackRequest).mockReturnValue(true); vi.mocked(enqueueSlackDelivery).mockResolvedValue(id); });
describe("confirmação assinada e durável", () => {
  it("exige assinatura antes de interpretar ou persistir", async () => {
    vi.mocked(verifySlackRequest).mockReturnValue(false);
    expect((await POST(request())).status).toBe(401);
    expect(enqueueSlackDelivery).not.toHaveBeenCalled(); expect(after).not.toHaveBeenCalled();
  });
  it("persiste o comando vinculado antes do aceite e agenda o mesmo worker", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(enqueueSlackDelivery).toHaveBeenCalledWith(expect.stringMatching(/^routine-action:/), expect.objectContaining({ userId: "U1", channel: "D1", text: `confirmar ${id}` }));
    expect(after).toHaveBeenCalledOnce();
    expect(vi.mocked(enqueueSlackDelivery).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(after).mock.invocationCallOrder[0]);
  });
  it("503 permite reentrega quando falha a persistência, sem aceitar em silêncio", async () => {
    vi.mocked(enqueueSlackDelivery).mockRejectedValue(new Error("detalhe privado"));
    const result = await POST(request());
    expect(result.status).toBe(503); expect(await result.text()).not.toContain("privado"); expect(after).not.toHaveBeenCalled();
  });
  it("payload nulo ou canal público não executa confirmação", async () => {
    expect((await POST(request(null))).status).toBe(400);
    expect((await POST(request({ ...payload, channel: { id: "C1" } }))).status).toBe(200);
    expect(enqueueSlackDelivery).not.toHaveBeenCalled();
  });
});

describe("avaliação de respostas no Slack", () => {
  const feedbackPayload = {
    ...payload,
    response_url: "https://hooks.slack.com/actions/example",
    message: {
      text: "Resposta do agente",
      blocks: [{ type: "actions", block_id: "asset_feedback", elements: [] }],
    },
    actions: [{ action_id: "asset_feedback_util", value: id }],
  };

  it("confirma o clique antes das consultas e atualiza a mensagem após salvar", async () => {
    vi.mocked(getSlackInstallation).mockResolvedValue({ teamId: "T1", organizationId: "org-1", botToken: "token", botUserId: null });
    vi.mocked(recordAssetAnswerFeedback).mockResolvedValue(true);

    expect((await POST(request(feedbackPayload))).status).toBe(200);
    expect(after).toHaveBeenCalledOnce();
    expect(getSlackInstallation).not.toHaveBeenCalled();
    expect(recordAssetAnswerFeedback).not.toHaveBeenCalled();
    expect(respondToSlackAction).not.toHaveBeenCalled();

    const task = vi.mocked(after).mock.calls[0][0];
    if (typeof task !== "function") throw new Error("Callback de after ausente");
    await task();

    expect(recordAssetAnswerFeedback).toHaveBeenCalledWith({
      auditId: id,
      organizationId: "org-1",
      externalUserId: "T1:U1",
      value: "util",
    });
    expect(respondToSlackAction).toHaveBeenCalledWith(feedbackPayload.response_url, expect.objectContaining({
      replace_original: true,
      blocks: [expect.objectContaining({ type: "context" })],
    }));
  });

  it("não altera a mensagem quando a pessoa não é autora da pergunta", async () => {
    vi.mocked(getSlackInstallation).mockResolvedValue({ teamId: "T1", organizationId: "org-1", botToken: "token", botUserId: null });
    vi.mocked(recordAssetAnswerFeedback).mockResolvedValue(false);

    expect((await POST(request(feedbackPayload))).status).toBe(200);
    const task = vi.mocked(after).mock.calls[0][0];
    if (typeof task !== "function") throw new Error("Callback de after ausente");
    await task();

    expect(respondToSlackAction).not.toHaveBeenCalled();
  });
});
