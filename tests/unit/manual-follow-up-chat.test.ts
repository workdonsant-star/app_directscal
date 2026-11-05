import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/data/agent-provider-data-source", () => ({ getActiveAgentProvider: vi.fn() }));
vi.mock("@/lib/agent/answer-providers", () => ({ generateGroundedAnswer: vi.fn() }));

import { getActiveAgentProvider } from "@/lib/data/agent-provider-data-source";
import { generateGroundedAnswer } from "@/lib/agent/answer-providers";
import { answerManualFollowupQuestion } from "@/lib/agent/follow-up/manual-follow-up-chat";

const input = {
  question: "Por que preciso revisar isso toda semana?",
  title: "Matriz de direitos de decisão",
  reason: "Evitar decisões sem responsável.",
  action: "Revisar as decisões abertas toda semana.",
  continuity: "A matriz preserva as alçadas para a próxima revisão.",
  assetTitle: "Matriz de decisões",
  assetVersion: "2",
  sections: [{ heading_path: "Alçadas", content: "Cada decisão deve ter decisor e prazo registrados." }],
  history: [{ role: "user" as const, text: "Quais ações devo fazer?" }, { role: "assistant" as const, text: "Revise as decisões abertas." }],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getActiveAgentProvider).mockResolvedValue({ provider: "openai", model: "modelo-ficticio", apiKey: "chave-ficticia" } as Awaited<ReturnType<typeof getActiveAgentProvider>>);
});

describe("conversa do Action Point manual", () => {
  it("envia as fontes e a conversa ao modelo e cita somente os rótulos usados", async () => {
    vi.mocked(generateGroundedAnswer).mockResolvedValue({ status: "answered", answer: "Revise semanalmente para evitar decisões sem responsável e manter decisor e prazo registrados.", confidence: "alta", sources: ["AP", "A1"] });

    const answer = await answerManualFollowupQuestion(input);

    expect(answer).toContain("Revise semanalmente");
    expect(answer).toContain("Fonte: Action Point Matriz de direitos de decisão; Matriz de decisões, versão 2, Alçadas");
    expect(generateGroundedAnswer).toHaveBeenCalledWith("openai", "modelo-ficticio", input.question, [], [], "chave-ficticia", expect.objectContaining({
      user: expect.stringContaining("Cada decisão deve ter decisor e prazo registrados."),
    }));
    const prompt = vi.mocked(generateGroundedAnswer).mock.calls[0][6];
    expect(prompt?.user).toContain("Quais ações devo fazer?");
    expect(prompt?.user).toContain("Evitar decisões sem responsável.");
  });

  it("recusa uma resposta sem fonte válida", async () => {
    vi.mocked(generateGroundedAnswer).mockResolvedValue({ status: "answered", answer: "Faça qualquer coisa.", confidence: "alta", sources: ["A99"] });
    const answer = await answerManualFollowupQuestion(input);
    expect(answer).toContain("Não encontrei orientação suficiente");
    expect(answer).not.toContain("Faça qualquer coisa");
  });

  it("usa o esclarecimento contextual do modelo quando as fontes não bastam", async () => {
    vi.mocked(generateGroundedAnswer).mockResolvedValue({ status: "insufficient_evidence", answer: "O Action Point não define qual campanha você deve priorizar. Qual campanha está em dúvida?", confidence: "insuficiente", sources: [] });
    expect(await answerManualFollowupQuestion(input)).toContain("Qual campanha está em dúvida?");
  });
});
