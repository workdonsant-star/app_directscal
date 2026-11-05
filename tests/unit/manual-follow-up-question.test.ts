import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { formatManualFollowupQuestion, manualFollowupQuestionPrompt } from "@/lib/agent/follow-up/manual-follow-up";
import { generateManualFollowupQuestion } from "@/lib/agent/follow-up/manual-follow-up-question-provider";

const input = {
  name: "Mary",
  title: "Matriz de direitos de decisão",
  action: "Toda semana, revisar as decisões abertas, registrar decisão e prazo e tratar os casos vencidos.",
  previousQuestions: ["Mary, como está indo a manutenção da Matriz de direitos de decisão?"],
};
const generated = {
  opening: "Mary, como está o acompanhamento da Matriz de direitos de decisão nesta semana?",
  commitment: "Combinamos que você revisaria semanalmente as decisões abertas, registraria decisão e prazo e trataria os casos vencidos.",
  question: "O que avançou desde a última conversa? Há algo pendente ou bloqueado? Se tiver um registro, pode me contar qual é?",
};

afterEach(() => vi.unstubAllGlobals());

describe("pergunta de acompanhamento manual", () => {
  it("usa o combinado e as perguntas anteriores para pedir uma nova redação", () => {
    const prompt = manualFollowupQuestionPrompt(input);
    expect(prompt).toContain(input.action);
    expect(prompt).toContain(input.previousQuestions[0]);
    expect(prompt).toContain("Varie a formulação");
  });

  it("monta uma conversa sem rótulos técnicos e rejeita a ação errada", () => {
    expect(formatManualFollowupQuestion(generated, input)).toBe(`${generated.opening}\n\n${generated.commitment}\n\n${generated.question}`);
    expect(() => formatManualFollowupQuestion({ ...generated, opening: "Mary, como está a rotina de outra ação?" }, input)).toThrow();
    expect(() => formatManualFollowupQuestion({ ...generated, question: "Responda na thread para registrar seu relato." }, input)).toThrow();
    expect(() => formatManualFollowupQuestion(generated, { ...input, previousQuestions: [`${generated.opening}\n\nPergunta anterior.`] })).toThrow();
  });

  it("gera pelo provedor selecionado antes do envio e não armazena o prompt no provedor", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "completed", output: [{ content: [{ type: "output_text", text: JSON.stringify(generated) }] }] }) });
    vi.stubGlobal("fetch", fetchMock);
    const text = await generateManualFollowupQuestion({ provider: "openai", model: "modelo-ficticio", apiKey: "chave-ficticia" }, input);
    expect(text).toContain(generated.opening);
    expect(text).not.toContain("Referência:");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const request = JSON.parse(String(options.body));
    expect(request).toMatchObject({ model: "modelo-ficticio", store: false });
    expect(request.input).toContain(input.previousQuestions[0]);
  });

  it("pede nova redação quando o modelo repete a abertura anterior", async () => {
    const first = { ...generated, opening: input.previousQuestions[0] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "completed", output: [{ content: [{ type: "output_text", text: JSON.stringify(first) }] }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: "completed", output: [{ content: [{ type: "output_text", text: JSON.stringify(generated) }] }] }) });
    vi.stubGlobal("fetch", fetchMock);
    expect(await generateManualFollowupQuestion({ provider: "openai", model: "modelo-ficticio", apiKey: "chave-ficticia" }, input)).toContain(generated.opening);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("repete uma falha temporária do Gemini e envia a pergunta quando o serviço recupera", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ status: 503, ok: false })
      .mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(generated) }] } }] }) });
    vi.stubGlobal("fetch", fetchMock);
    expect(await generateManualFollowupQuestion({ provider: "gemini", model: "modelo-ficticio", apiKey: "chave-ficticia" }, input)).toContain(generated.opening);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("informa indisponibilidade do Gemini após três respostas 503", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 503, ok: false });
    vi.stubGlobal("fetch", fetchMock);
    await expect(generateManualFollowupQuestion({ provider: "gemini", model: "modelo-ficticio", apiKey: "chave-ficticia" }, input)).rejects.toThrow("Gemini está temporariamente sobrecarregado");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("usa Gemini 3.5 Flash quando o Flash Lite continua sobrecarregado", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ status: 503, ok: false })
      .mockResolvedValueOnce({ status: 503, ok: false })
      .mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(generated) }] } }] }) });
    vi.stubGlobal("fetch", fetchMock);
    expect(await generateManualFollowupQuestion({ provider: "gemini", model: "gemini-3.5-flash-lite", apiKey: "chave-ficticia" }, input)).toContain(generated.opening);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][0]).toContain("models/gemini-3.5-flash:generateContent");
  });
});
