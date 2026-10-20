import "server-only";
import { answerAssetQuestion } from "@/lib/agent/asset-question-service";
import { countPreviousAsks } from "@/lib/agent/repeat-questions";
import { getPublicAppUrl } from "@/lib/env";
import type { SlackQuestion } from "@/lib/contracts/slack-delivery";
import { addSlackReaction, fetchSlackConversation, getSlackBotUserId, type SlackInstallation } from "@/lib/integrations/slack";
import { buildSlackAnswerMessage, buildSlackConversationHistory, cleanSlackMentionText, getSlackRepeatReaction } from "@/lib/integrations/slack-format";

async function loadConversationHistory(
  question: SlackQuestion,
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

export async function prepareSlackQuestion(question: SlackQuestion, installation: SlackInstallation) {
  const botUserId = await getSlackBotUserId(installation);

  // A menção dentro da thread também chega como app_mention; ela é tratada lá.
  if (question.kind === "thread_reply" && question.text.includes(`<@${botUserId}>`)) {
    return null;
  }

  const conversation = await loadConversationHistory(
    question,
    installation.botToken,
    botUserId,
  );

  // Threads em que o bot não entrou continuam sendo só das pessoas.
  if (question.kind === "thread_reply" && !conversation.botParticipated) {
    return null;
  }

  const text = cleanSlackMentionText(question.text);

  if (text.length < 3) {
    if (question.kind === "thread_reply") return;

    return { text: "Escreva a dúvida depois de mencionar o DirectScal." };
  }

  const externalUserId = `${question.teamId}:${question.userId}`;

  // A contagem roda antes de a resposta gravar a pergunta atual na auditoria.
  const reacting = countPreviousAsks({
    organizationId: installation.organizationId,
    externalUserId,
    question: text,
  })
    .then((previousAsks) =>
      addSlackReaction(installation.botToken, {
        channel: question.channel,
        ts: question.ts,
        name: getSlackRepeatReaction(previousAsks),
      }),
    )
    .catch(() => {
      console.error("[slack] reaction failed");
    });

  const answer = await answerAssetQuestion({
    organizationId: installation.organizationId,
    question: text,
    channel: "slack",
    externalUserId,
    history: conversation.history,
  });
  const message = buildSlackAnswerMessage(answer, getPublicAppUrl());

  await reacting;
  return message;
}
