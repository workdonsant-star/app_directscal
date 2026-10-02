import { createHmac, timingSafeEqual } from "node:crypto";

import type { AssetQuestionAnswer } from "@/lib/contracts";

// Funções puras do adaptador Slack: assinatura, state do OAuth e Block Kit.

export const SLACK_BOT_SCOPES = [
  "app_mentions:read",
  "chat:write",
  "im:history",
  "channels:history",
  "groups:history",
];
export const SLACK_FEEDBACK_ACTIONS = {
  util: "asset_feedback_util",
  nao_util: "asset_feedback_nao_util",
} as const;

const STATE_TTL_SECONDS = 10 * 60;

function constantTimeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function computeSlackSignature(
  signingSecret: string,
  timestamp: string,
  rawBody: string,
) {
  return `v0=${createHmac("sha256", signingSecret)
    .update(`v0:${timestamp}:${rawBody}`)
    .digest("hex")}`;
}

export function isValidSlackSignature(input: {
  signingSecret: string;
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
  nowSeconds?: number;
}) {
  if (!input.timestamp || !input.signature) return false;

  const timestamp = Number(input.timestamp);
  const now = input.nowSeconds ?? Date.now() / 1000;

  if (!Number.isFinite(timestamp) || Math.abs(now - timestamp) > 60 * 5) return false;

  return constantTimeEquals(
    computeSlackSignature(input.signingSecret, input.timestamp, input.rawBody),
    input.signature,
  );
}

export type SlackInstallState = {
  organizationId: string;
  userId: string;
  expiresAt: number;
};

export function signSlackInstallState(
  secret: string,
  state: Omit<SlackInstallState, "expiresAt">,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  const payload = Buffer.from(
    JSON.stringify({ ...state, expiresAt: nowSeconds + STATE_TTL_SECONDS }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");

  return `${payload}.${signature}`;
}

export function verifySlackInstallState(
  secret: string,
  value: string | null,
  nowSeconds = Math.floor(Date.now() / 1000),
): SlackInstallState | null {
  if (!value) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (!constantTimeEquals(expected, signature)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as
      Partial<SlackInstallState>;

    if (
      typeof parsed.organizationId !== "string" ||
      typeof parsed.userId !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt < nowSeconds
    ) {
      return null;
    }

    return {
      organizationId: parsed.organizationId,
      userId: parsed.userId,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export function cleanSlackMentionText(text: string) {
  return text
    .replace(/<@[A-Z0-9]+(\|[^>]+)?>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeSlackText(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeSlackLinkLabel(text: string) {
  return escapeSlackText(text).replace(/\|/g, "¦");
}

type SlackBlock = Record<string, unknown>;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export function buildSlackAnswerMessage(answer: AssetQuestionAnswer, appUrl: string) {
  const blocks: SlackBlock[] = [
    {
      type: "section",
      text: { type: "mrkdwn", text: escapeSlackText(answer.answer).slice(0, 2900) },
    },
  ];

  if (answer.citations.length > 0) {
    blocks.push({
      type: "context",
      elements: answer.citations.slice(0, 5).map((citation) => ({
        type: "mrkdwn",
        text: `Fonte: <${appUrl}${citation.href}|${escapeSlackLinkLabel(
          `${citation.title} — ${citation.section}`,
        )}>, versão ${escapeSlackText(citation.versionNumber)}, atualizada em ${dateFormatter.format(
          new Date(citation.publishedAt),
        )}`,
      })),
    });
  }

  if (answer.auditId && answer.status !== "error") {
    blocks.push({
      type: "actions",
      block_id: "asset_feedback",
      elements: [
        {
          type: "button",
          action_id: SLACK_FEEDBACK_ACTIONS.util,
          text: { type: "plain_text", text: "Útil" },
          value: answer.auditId,
        },
        {
          type: "button",
          action_id: SLACK_FEEDBACK_ACTIONS.nao_util,
          text: { type: "plain_text", text: "Não útil" },
          value: answer.auditId,
        },
      ],
    });
  }

  const fallbackSources = answer.citations
    .map((citation) => `${citation.title} — ${citation.section}, versão ${citation.versionNumber}`)
    .join("; ");

  return {
    text: fallbackSources ? `${answer.answer}\n\nFonte: ${fallbackSources}` : answer.answer,
    blocks,
  };
}

// Depois da avaliação, os botões dão lugar a uma confirmação discreta.
export function replaceSlackFeedbackBlock(
  blocks: SlackBlock[],
  value: "util" | "nao_util",
) {
  return blocks.map((block) =>
    block.block_id === "asset_feedback"
      ? {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text:
                value === "util"
                  ? "Avaliada como útil. Obrigado."
                  : "Avaliada como não útil. A Directscal vai revisar esta lacuna.",
            },
          ],
        }
      : block,
  );
}

export type SlackConversationMessage = {
  ts?: string;
  user?: string;
  bot_id?: string;
  subtype?: string;
  text?: string;
};

// Converte mensagens do Slack em turnos de conversa para o agente. A resposta
// do bot perde o rodapé de fontes; a mensagem atual e as posteriores ficam fora.
export function buildSlackConversationHistory(
  messages: SlackConversationMessage[],
  options: { botUserId: string; currentTs: string },
) {
  const current = Number(options.currentTs);
  let botParticipated = false;
  const history: Array<{ role: "user" | "assistant"; text: string }> = [];

  for (const message of messages) {
    if (!message.ts || Number(message.ts) >= current || !message.text) continue;

    if (message.user === options.botUserId) {
      botParticipated = true;
      const text = message.text.split("\n\nFonte:")[0].trim();
      if (text) history.push({ role: "assistant", text });
      continue;
    }

    if (message.bot_id || (message.subtype && message.subtype !== "thread_broadcast")) continue;

    const text = cleanSlackMentionText(message.text);
    if (text) history.push({ role: "user", text });
  }

  return { botParticipated, history };
}
