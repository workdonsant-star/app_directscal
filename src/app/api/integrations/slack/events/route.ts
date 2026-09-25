import {
  answerSlackQuestion,
  getSlackQuestion,
  postSlackMessage,
  verifySlackSignature,
} from "@/lib/integrations/slack";
import { getRequiredServerEnv } from "@/lib/env";

export const runtime = "nodejs";

type SlackEventPayload = {
  type?: string;
  challenge?: string;
  team_id?: string;
  event?: {
    type?: string;
    subtype?: string;
    bot_id?: string;
    text?: string;
    channel?: string;
    ts?: string;
    thread_ts?: string;
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const validSignature = verifySlackSignature(
    rawBody,
    request.headers.get("x-slack-request-timestamp"),
    request.headers.get("x-slack-signature"),
  );

  if (!validSignature) {
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

  if (request.headers.get("x-slack-retry-num")) {
    return Response.json({ ok: true });
  }

  const configuredTeamId = process.env.SLACK_TEAM_ID;
  if (configuredTeamId && payload.team_id !== configuredTeamId) {
    return Response.json({ ok: false }, { status: 403 });
  }

  const event = payload.event;
  if (
    payload.type !== "event_callback" ||
    event?.type !== "app_mention" ||
    event.subtype ||
    event.bot_id ||
    !event.channel ||
    !event.ts
  ) {
    return Response.json({ ok: true });
  }

  const question = getSlackQuestion(event.text ?? "");
  if (!question) {
    await postSlackMessage(
      event.channel,
      event.thread_ts ?? event.ts,
      "Escreva a dúvida depois de mencionar o DirectScal.",
    );
    return Response.json({ ok: true });
  }

  try {
    const answer = await answerSlackQuestion(question);
    await postSlackMessage(event.channel, event.thread_ts ?? event.ts, answer);
  } catch {
    await postSlackMessage(
      event.channel,
      event.thread_ts ?? event.ts,
      "Não consegui consultar os SOPs publicados agora. Tente novamente em alguns instantes.",
    );
  }

  return Response.json({ ok: true });
}
