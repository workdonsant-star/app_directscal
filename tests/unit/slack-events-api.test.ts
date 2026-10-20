import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/integrations/slack", () => ({ verifySlackRequest: vi.fn(), revokeSlackInstallation: vi.fn() }));
vi.mock("@/lib/integrations/slack-delivery-store", () => ({ enqueueSlackDelivery: vi.fn() }));
vi.mock("@/lib/integrations/slack-delivery", () => ({ processSlackDelivery: vi.fn() }));
import { after } from "next/server";
import { verifySlackRequest } from "@/lib/integrations/slack";
import { enqueueSlackDelivery } from "@/lib/integrations/slack-delivery-store";
import { POST } from "@/app/api/integrations/slack/events/route";
const payload = { type: "event_callback", team_id: "T1", event_id: "Ev1", event: { type: "message", channel_type: "im", user: "U1", channel: "D1", ts: "100.001", text: "Qual é a prática?" } };
const request = (body: unknown = payload) => new Request("https://fixture.test/api/integrations/slack/events", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); vi.mocked(verifySlackRequest).mockReturnValue(true); vi.mocked(enqueueSlackDelivery).mockResolvedValue("job"); });
describe("ingresso Slack durável", () => {
  it("valida assinatura antes de qualquer persistência", async () => {
    vi.mocked(verifySlackRequest).mockReturnValue(false);
    expect((await POST(request())).status).toBe(401);
    expect(enqueueSlackDelivery).not.toHaveBeenCalled(); expect(after).not.toHaveBeenCalled();
  });
  it("não aceita o evento se a persistência falhar", async () => {
    vi.mocked(enqueueSlackDelivery).mockRejectedValue(new Error("falha com segredo"));
    const response = await POST(request());
    expect(response.status).toBe(503); expect(await response.text()).not.toContain("segredo"); expect(after).not.toHaveBeenCalled();
  });
  it("responde após persistir e agenda processamento recuperável", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(enqueueSlackDelivery).toHaveBeenCalledWith("Ev1", expect.objectContaining({ teamId: "T1", userId: "U1", text: "Qual é a prática?" }));
    expect(after).toHaveBeenCalledOnce();
    expect(vi.mocked(enqueueSlackDelivery).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(after).mock.invocationCallOrder[0]);
  });
  it("preserva verificação URL, ignora bots e recibos anteriores sem processar", async () => {
    expect(await (await POST(request({ type: "url_verification", challenge: "ficticio" }))).json()).toEqual({ challenge: "ficticio" });
    await POST(request({ ...payload, event: { ...payload.event, bot_id: "B1" } }));
    expect(enqueueSlackDelivery).not.toHaveBeenCalled();
    vi.mocked(enqueueSlackDelivery).mockResolvedValue(null);
    expect((await POST(request())).status).toBe(200); expect(after).not.toHaveBeenCalled();
  });
  it("recusa payload inválido sem aceitar evento silenciosamente", async () => {
    expect((await POST(request(null))).status).toBe(400);
    expect((await POST(request({ ...payload, event: { ...payload.event, ts: "inválido" } }))).status).toBe(400);
    expect(enqueueSlackDelivery).not.toHaveBeenCalled();
  });
});
