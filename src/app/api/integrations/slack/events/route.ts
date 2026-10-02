import { after } from "next/server";

import { answerAssetQuestion } from "@/lib/agent/asset-question-service";
import { getPublicAppUrl } from "@/lib/env";
import {
  claimSlackEvent,
  fetchSlackConversation,
  getSlackBotUserId,
  getSlackInstallation,
  postSlackMessage,
  revokeSlackInstallation,
  verifySlackRequest,
} from "@/lib/integrations/slack";
import {
  buildSlackAnswerMessage,
  buildSlackConversationHistory,
  cleanSlackMentionText,
} from "@/lib/integrations/slack-format";

export const runtime = "nodejs";
export const maxDuration = 60;

type SlackEventPayload = {
  type?: string;
  challenge?: string;
  team_id?: string;
  event_id?: string;
  event?: {
    type?: string;
    subtype?: string;
    bot_id?: string;
    user?: string;
    text?: string;
    channel?: string;
    channel_type?: string;
    ts?: string;
    thread_ts?: string;
  };
};

type SlackQuestionEvent = {
  kind: "mention" | "direct" | "thread_reply";
  teamId: string;
  userId: string;
  channel: string;
  ts: string;
  threadTs: string | undefined;
  text: string;
};

// Menções em canais respondem na thread; mensagens diretas ao app respondem
// na própria conversa; respostas sem menção numa thread em que o bot já
// participou continuam a conversa.
function getQuestionEvent(payload: SlackEventPayload): SlackQuestionEvent | null {
  const event = payload.event;

  if (
    payload.type !== "event_callback" ||
    !payload.team_id ||
    !event ||
    event.subtype ||
    event.bot_id ||
    !event.user ||
    !event.channel ||
    !event.ts
  ) {
    return null;
  }

  if (event.type === "app_mention") {
    return {
      kind: "mention",
      ts: event.ts,
      teamId: payload.team_id,
      userId: event.user,
      channel: event.channel,
      threadTs: event.thread_ts ?? event.ts,
      text: event.text ?? "",
    };
  }

  if (event.type === "message" && event.channel_type === "im") {
    return {
      kind: "direct",
      ts: event.ts,
      teamId: payload.team_id,
      userId: event.user,
      channel: event.channel,
      threadTs: event.thread_ts,
      text: event.text ?? "",
    };
  }

  if (
    event.type === "message" &&
    (event.channel_type === "channel" || event.channel_type === "group") &&
    event.thread_ts &&
    event.thread_ts !== event.ts
  ) {
    return {
      kind: "thread_reply",
      ts: event.ts,
      teamId: payload.team_id,
      userId: event.user,
      channel: event.channel,
      threadTs: event.thread_ts,
      text: event.text ?? "",
    };
  }

  return null;
}

async function loadConversationHistory(
  question: SlackQuestionEvent,
  token: string,
  botUserId: string,
) {
  // Uma menção que abre a conversa no canal não tem histórico.
  if (question.kind === "mention" && question.threadTs === question.ts) {
    return { botParticipated: false, history: [] };
  }

  const messages = await fetchSlackConversation(
    token,
    question.channel,
    question.threadTs,
  );

  return buildSlackConversationHistory(messages, {
    botUserId,
    currentTs: question.ts,
  });
}

async function answerSlackQuestion(question: SlackQuestionEvent) {
  const installation = await getSlackInstallation(question.teamId);

  if (!installation) {
    console.error("[slack] event from workspace without installation", question.teamId);
    return;
  }

  const botUserId = await getSlackBotUserId(installation);

  // A menção dentro da thread também chega como app_mention; ela é tratada lá.
  if (question.kind === "thread_reply" && question.text.includes(`<@${botUserId}>`)) {
    return;
  }

  const conversation = await loadConversationHistory(
    question,
    installation.botToken,
    botUserId,
  ).catch((error: unknown) => {
    console.error("[slack] conversation history failed", error);
    return { botParticipated: false, history: [] };
  });

  // Threads em que o bot não entrou continuam sendo só das pessoas.
  if (question.kind === "thread_reply" && !conversation.botParticipated) {
    return;
  }

  const text = cleanSlackMentionText(question.text);

  if (text.length < 3) {
    if (question.kind === "thread_reply") return;

    await postSlackMessage(installation.botToken, {
      channel: question.channel,
      threadTs: question.threadTs,
      text: "Escreva a dúvida depois de mencionar o DirectScal.",
    });
    return;
  }

  const answer = await answerAssetQuestion({
    organizationId: installation.organizationId,
    question: text,
    channel: "slack",
    externalUserId: `${question.teamId}:${question.userId}`,
    history: conversation.history,
  });
  const message = buildSlackAnswerMessage(answer, getPublicAppUrl());

  await postSlackMessage(installation.botToken, {
    channel: question.channel,
    threadTs: question.threadTs,
    ...message,
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifySlackRequest(request, rawBody)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let payload: SlackEventPayload;

  try {
    payload = JSON.parse(rawBody) as SlackEventPayload;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  if (payload.type === "url_verification" && payload.challenge) {
    return Response.json({ challenge: payload.challenge });
  }

  if (
    payload.type === "event_callback" &&
    payload.team_id &&
    (payload.event?.type === "app_uninstalled" || payload.event?.type === "tokens_revoked")
  ) {
    await revokeSlackInstallation(payload.team_id);
    return Response.json({ ok: true });
  }

  const question = getQuestionEvent(payload);

  if (!question || !payload.event_id) {
    return Response.json({ ok: true });
  }

  // O Slack reenvia eventos sem confirmação em 3 segundos. O recibo garante
  // uma única resposta, e o processamento continua depois do 200.
  if (!(await claimSlackEvent(payload.event_id, payload.team_id ?? null))) {
    return Response.json({ ok: true });
  }

  after(async () => {
    try {
      await answerSlackQuestion(question);
    } catch (error) {
      console.error("[slack] failed to answer event", error);
    }
  });

  return Response.json({ ok: true });
}
