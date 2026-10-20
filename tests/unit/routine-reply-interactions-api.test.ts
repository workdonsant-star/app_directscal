import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/integrations/slack", () => ({ verifySlackRequest: vi.fn(), getSlackInstallation: vi.fn(), respondToSlackAction: vi.fn() }));
vi.mock("@/lib/agent/asset-question-service", () => ({ recordAssetAnswerFeedback: vi.fn() }));
vi.mock("@/lib/integrations/slack-delivery-store", () => ({ enqueueSlackDelivery: vi.fn() }));
vi.mock("@/lib/integrations/slack-delivery", () => ({ processSlackDelivery: vi.fn() }));
import { after } from "next/server";
import { verifySlackRequest } from "@/lib/integrations/slack";
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
