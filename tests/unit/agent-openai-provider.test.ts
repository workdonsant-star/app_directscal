import { afterEach, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generateGroundedAnswer } from "@/lib/agent/answer-providers";

afterEach(() => vi.unstubAllGlobals());

test("OpenAI recebe fontes isoladas e devolve resposta estruturada sem armazenar a conversa", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ status: "answered", answer: "O marcador é azul.", confidence: "alta", sources: ["S1"] }) }] }] }),
  });
  vi.stubGlobal("fetch", fetchMock);

  const answer = await generateGroundedAnswer("openai", "gpt-6-luna", "Qual é a cor do marcador?", [{
    label: "S1", chunkId: "ficticio", assetId: "ficticio", versionId: "ficticio", assetType: "sop",
    title: "Marcador fictício", headingPath: "Teste", content: "O marcador é azul.",
    versionNumber: "1", publishedAt: "2026-01-01T00:00:00.000Z", textRank: 1,
    vectorSimilarity: null, score: 1,
  }], [], "chave-ficticia");

  expect(answer.sources).toEqual(["S1"]);
  expect(fetchMock).toHaveBeenCalledOnce();
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toBe("https://api.openai.com/v1/responses");
  expect((init.headers as Record<string, string>).Authorization).toBe("Bearer chave-ficticia");
  const body = JSON.parse(String(init.body));
  expect(body.store).toBe(false);
  expect(body.input).toContain("O marcador é azul.");
  expect(body.text.format.type).toBe("json_schema");
});
