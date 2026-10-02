import { describe, expect, it } from "vitest";

import {
  buildSlackAnswerMessage,
  buildSlackConversationHistory,
  cleanSlackMentionText,
  computeSlackSignature,
  isValidSlackSignature,
  replaceSlackFeedbackBlock,
  signSlackInstallState,
  verifySlackInstallState,
} from "@/lib/integrations/slack-format";

describe("slack signature", () => {
  it("accepts a fresh signature and rejects tampering or replay", () => {
    const body = '{"type":"event_callback"}';
    const timestamp = "1790000000";
    const signature = computeSlackSignature("segredo", timestamp, body);

    expect(
      isValidSlackSignature({ signingSecret: "segredo", rawBody: body, timestamp, signature, nowSeconds: 1790000010 }),
    ).toBe(true);
    expect(
      isValidSlackSignature({ signingSecret: "segredo", rawBody: `${body} `, timestamp, signature, nowSeconds: 1790000010 }),
    ).toBe(false);
    expect(
      isValidSlackSignature({ signingSecret: "segredo", rawBody: body, timestamp, signature, nowSeconds: 1790001000 }),
    ).toBe(false);
  });
});

describe("slack install state", () => {
  it("round-trips and expires", () => {
    const state = signSlackInstallState("chave", { organizationId: "org", userId: "user" }, 1000);

    expect(verifySlackInstallState("chave", state, 1100)).toMatchObject({ organizationId: "org", userId: "user" });
    expect(verifySlackInstallState("outra", state, 1100)).toBeNull();
    expect(verifySlackInstallState("chave", state, 1000 + 11 * 60)).toBeNull();
    expect(verifySlackInstallState("chave", `${state}x`, 1100)).toBeNull();
  });
});

describe("slack message", () => {
  it("removes mentions from the question", () => {
    expect(cleanSlackMentionText("<@U123ABC>   quem aprova   desconto?")).toBe("quem aprova desconto?");
  });

  it("renders answer, escaped sources and feedback buttons", () => {
    const message = buildSlackAnswerMessage(
      {
        auditId: "audit-1",
        status: "answered",
        answer: "Acima de 15% <exige> aprovação.",
        confidence: "alta",
        citations: [
          {
            chunkId: "c1",
            assetId: "a1",
            versionId: "v1",
            assetType: "sop",
            title: "Política | comercial",
            section: "Alçadas",
            versionNumber: "3",
            publishedAt: "2026-09-18T12:00:00.000Z",
            href: "/ativos-de-gestao/sops/a1#alcadas",
          },
        ],
      },
      "https://app.directscal.com",
    );

    expect(message.blocks[0]).toMatchObject({
      text: { text: "Acima de 15% &lt;exige&gt; aprovação." },
    });
    expect(JSON.stringify(message.blocks[1])).toContain(
      "<https://app.directscal.com/ativos-de-gestao/sops/a1#alcadas|Política ¦ comercial — Alçadas>",
    );
    expect(message.blocks[2]).toMatchObject({ type: "actions", block_id: "asset_feedback" });
    expect(message.text).toContain("Fonte: Política | comercial — Alçadas, versão 3");

    const replaced = replaceSlackFeedbackBlock(message.blocks, "nao_util");
    expect(replaced[2]).toMatchObject({ type: "context" });
  });
});

describe("slack conversation history", () => {
  it("keeps prior turns, strips the source footer and detects the bot", () => {
    const { botParticipated, history } = buildSlackConversationHistory(
      [
        { ts: "100.1", user: "UPESSOA", text: "<@UBOT> Como gero papéis?" },
        { ts: "100.2", user: "UBOT", bot_id: "B1", text: "Faça a call com o líder.\n\nFonte: Papéis — Objetivo, versão 2" },
        { ts: "100.3", user: "UOUTRO", bot_id: "B9", text: "mensagem de outro bot" },
        { ts: "100.4", user: "UPESSOA", text: "Como deve ser a reunião?" },
        { ts: "100.5", user: "UPESSOA", text: "posterior" },
      ],
      { botUserId: "UBOT", currentTs: "100.4" },
    );

    expect(botParticipated).toBe(true);
    expect(history).toEqual([
      { role: "user", text: "Como gero papéis?" },
      { role: "assistant", text: "Faça a call com o líder." },
    ]);
  });

  it("reports threads the bot never joined", () => {
    expect(
      buildSlackConversationHistory(
        [
          { ts: "1.1", user: "UA", text: "oi" },
          { ts: "1.2", user: "UB", text: "tudo bem" },
        ],
        { botUserId: "UBOT", currentTs: "1.2" },
      ).botParticipated,
    ).toBe(false);
  });
});
