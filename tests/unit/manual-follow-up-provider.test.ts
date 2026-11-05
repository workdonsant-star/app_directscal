import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/data/agent-provider-data-source", () => ({ getActiveAgentProvider: vi.fn().mockResolvedValue({ provider: "openai", model: "modelo-de-teste", apiKey: "chave-ficticia" }) }));

import { extractManualFollowupReport } from "@/lib/agent/follow-up/manual-follow-up-provider";

const input = {
  title: "Matriz de decisões",
  action: "Revisar as decisões e registrar os prazos",
  question: "O que foi executado?",
  history: [{ role: "person" as const, text: "Já fiz tudo sem impedimento" }, { role: "assistant" as const, text: "Quando fez isso?" }],
  reply: "Fiz ontem, eu fiz todas as partes",
};

afterEach(() => vi.unstubAllGlobals());

describe("extração contextual do acompanhamento manual", () => {
  it("envia somente o contexto fornecido e conserva uma citação literal da pessoa", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "completed", output: [{ content: [{ type: "output_text", text: JSON.stringify({
      status: "executado_relato", summary: "A pessoa declarou conclusão ontem.", evidence: null,
      followUpQuestion: null, supportingQuote: "Já fiz tudo sem impedimento",
    }) }] }] }) });
    vi.stubGlobal("fetch", fetch);
    const result = await extractManualFollowupReport(input);
    expect(result.supportingQuote).toBe("Já fiz tudo sem impedimento");
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.input).toContain("Já fiz tudo sem impedimento");
    expect(body.input).toContain("Fiz ontem, eu fiz todas as partes");
    expect(body.input).toContain("Revisar as decisões e registrar os prazos");
  });

  it("remove uma citação atribuída à pessoa que só apareceu na fala do bot", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "completed", output: [{ content: [{ type: "output_text", text: JSON.stringify({
      status: "executado_relato", summary: "Conclusão declarada.", evidence: null,
      followUpQuestion: null, supportingQuote: "Quando fez isso?",
    }) }] }] }) }));
    expect((await extractManualFollowupReport(input)).supportingQuote).toBeNull();
  });
});
