import { createHmac, timingSafeEqual } from "node:crypto";

import { getRequiredServerEnv } from "@/lib/env";

type SlackSearchResult = {
  chunk_id: string;
  title: string;
  heading_path: string;
  content: string;
  version_number: string;
  published_at: string;
  rank: number;
};

type SlackApiResponse = {
  ok: boolean;
  error?: string;
};

function constantTimeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function verifySlackSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
) {
  if (!timestamp || !signature) return false;

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber)) return false;
  if (Math.abs(Date.now() / 1000 - timestampNumber) > 60 * 5) return false;

  const signingSecret = getRequiredServerEnv("SLACK_SIGNING_SECRET");
  const baseString = `v0:${timestamp}:${rawBody}`;
  const expected = `v0=${createHmac("sha256", signingSecret)
    .update(baseString)
    .digest("hex")}`;

  return constantTimeEquals(expected, signature);
}

function cleanMentionText(text: string) {
  return text
    .replace(/<@[A-Z0-9]+>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, limit = 700) {
  return text.length > limit ? `${text.slice(0, limit - 1).trim()}…` : text;
}

export async function searchPublishedSlackSop(question: string) {
  const supabaseUrl = getRequiredServerEnv("SUPABASE_URL");
  const serviceRoleKey = getRequiredServerEnv("SUPABASE_SERVICE_ROLE_KEY");
  const organizationId = getRequiredServerEnv("SLACK_ORGANIZATION_ID");

  const response = await fetch(
    `${supabaseUrl}/rest/v1/rpc/search_management_asset_chunks_for_organization`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query_text: question,
        target_organization_id: organizationId,
        result_limit: 3,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Supabase search failed with status ${response.status}`);
  }

  return (await response.json()) as SlackSearchResult[];
}

export async function answerSlackQuestion(question: string) {
  const results = await searchPublishedSlackSop(question);

  if (results.length === 0) {
    return "Não encontrei uma regra publicada para essa pergunta. Consulte o responsável pelo ativo ou solicite uma definição à liderança da área.";
  }

  const references = results
    .map(
      (result) =>
        `*${result.title}* — ${result.heading_path}, versão ${result.version_number}\n${truncate(result.content)}`,
    )
    .join("\n\n");

  return `Encontrei estas orientações publicadas:\n\n${references}\n\nFonte: DirectScal, versão publicada vigente.`;
}

export async function postSlackMessage(channel: string, threadTs: string, text: string) {
  const token = getRequiredServerEnv("SLACK_BOT_TOKEN");
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ channel, thread_ts: threadTs, text }),
    cache: "no-store",
  });
  const payload = (await response.json()) as SlackApiResponse;

  if (!response.ok || !payload.ok) {
    throw new Error(`Slack message failed: ${payload.error ?? response.status}`);
  }
}

export function getSlackQuestion(text: string) {
  return cleanMentionText(text);
}
