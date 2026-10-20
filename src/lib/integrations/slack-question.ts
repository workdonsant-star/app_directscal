import { slackQuestionSchema, type SlackQuestion } from "@/lib/contracts/slack-delivery";

export type SlackEventPayload = {
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

// Menções em canais respondem na thread; mensagens diretas ao app respondem
// na própria conversa; respostas sem menção numa thread em que o bot já
// participou continuam a conversa.
export function getQuestionEvent(payload: SlackEventPayload): SlackQuestion | null {
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
    return slackQuestionSchema.parse({
      kind: "mention",
      ts: event.ts,
      teamId: payload.team_id,
      userId: event.user,
      channel: event.channel,
      threadTs: event.thread_ts ?? event.ts,
      text: event.text ?? "",
    });
  }

  if (event.type === "message" && event.channel_type === "im") {
    return slackQuestionSchema.parse({
      kind: "direct",
      ts: event.ts,
      teamId: payload.team_id,
      userId: event.user,
      channel: event.channel,
      threadTs: event.thread_ts,
      text: event.text ?? "",
    });
  }

  if (
    event.type === "message" &&
    (event.channel_type === "channel" || event.channel_type === "group") &&
    event.thread_ts &&
    event.thread_ts !== event.ts
  ) {
    return slackQuestionSchema.parse({
      kind: "thread_reply",
      ts: event.ts,
      teamId: payload.team_id,
      userId: event.user,
      channel: event.channel,
      threadTs: event.thread_ts,
      text: event.text ?? "",
    });
  }

  return null;
}

