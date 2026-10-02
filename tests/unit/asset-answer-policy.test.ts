import { describe, expect, it } from "vitest";

import {
  buildAnswerUserMessage,
  buildExtractiveAnswer,
  buildRetrievalQuery,
  INSUFFICIENT_EVIDENCE_ANSWER,
  resolveGroundedAnswer,
  selectEvidence,
  type RetrievedChunk,
} from "@/lib/agent/answer-policy";

function chunk(overrides: Partial<RetrievedChunk>): RetrievedChunk {
  return {
    chunkId: "c1",
    assetId: "a1",
    versionId: "v1",
    assetType: "sop",
    title: "Política comercial",
    headingPath: "Alçadas › Descontos",
    content: "Descontos acima de 15% exigem aprovação do Diretor Comercial.",
    versionNumber: "3",
    publishedAt: "2026-09-18T12:00:00.000Z",
    textRank: 0.2,
    vectorSimilarity: null,
    score: 0.03,
    ...overrides,
  };
}

describe("asset answer policy", () => {
  it("drops vector-only neighbours below the similarity floor", () => {
    const evidence = selectEvidence([
      chunk({ chunkId: "texto" }),
      chunk({ chunkId: "vizinho-fraco", textRank: null, vectorSimilarity: 0.41 }),
      chunk({ chunkId: "vizinho-forte", textRank: null, vectorSimilarity: 0.72 }),
    ]);

    expect(evidence.map((item) => [item.chunkId, item.label])).toEqual([
      ["texto", "S1"],
      ["vizinho-forte", "S2"],
    ]);
  });

  it("maps cited labels to traceable sources with section anchors", () => {
    const evidence = selectEvidence([chunk({})]);
    const answer = resolveGroundedAnswer(
      {
        status: "answered",
        answer: "Descontos acima de 15% exigem aprovação do Diretor Comercial.",
        confidence: "alta",
        sources: ["s1", "S1", "S9"],
      },
      evidence,
    );

    expect(answer.status).toBe("answered");
    expect(answer.citations).toEqual([
      expect.objectContaining({
        assetId: "a1",
        versionId: "v1",
        section: "Alçadas › Descontos",
        href: "/ativos-de-gestao/sops/a1#descontos",
      }),
    ]);
  });

  it("turns an answer without a valid source into a refusal", () => {
    const answer = resolveGroundedAnswer(
      { status: "answered", answer: "Sim, pode aprovar.", confidence: "alta", sources: ["S7"] },
      selectEvidence([chunk({})]),
    );

    expect(answer).toMatchObject({
      status: "insufficient_evidence",
      answer: INSUFFICIENT_EVIDENCE_ANSWER,
      citations: [],
    });
  });

  it("keeps the model explanation when it declines", () => {
    const answer = resolveGroundedAnswer(
      {
        status: "insufficient_evidence",
        answer: "Não há regra publicada para reembolso de viagens.",
        confidence: "insuficiente",
        sources: [],
      },
      selectEvidence([chunk({})]),
    );

    expect(answer.refusalReason).toBe("Não há regra publicada para reembolso de viagens.");
  });

  it("answers extractively with citations when no model is configured", () => {
    expect(buildExtractiveAnswer([]).status).toBe("insufficient_evidence");

    const answer = buildExtractiveAnswer(selectEvidence([chunk({})]));
    expect(answer.status).toBe("answered");
    expect(answer.citations).toHaveLength(1);
  });

  it("adds prior turns as context, never as a source", () => {
    const history = [
      { role: "user" as const, text: "Como gero papéis e atribuições?" },
      { role: "assistant" as const, text: "Comece pela call com o líder." },
    ];
    const message = buildAnswerUserMessage("E a reunião?", selectEvidence([chunk({})]), history);

    expect(message).toContain("Conversa anterior (somente para entender a pergunta; não é fonte)");
    expect(message.indexOf("Conversa anterior")).toBeGreaterThan(message.indexOf("</fonte>"));
    expect(buildRetrievalQuery("E a reunião?", history)).toBe(
      "Como gero papéis e atribuições? E a reunião?",
    );
    expect(buildRetrievalQuery("Quem aprova?")).toBe("Quem aprova?");
  });
});
