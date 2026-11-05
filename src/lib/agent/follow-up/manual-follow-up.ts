import { z } from "zod";
import type { SlackConversationMessage } from "@/lib/integrations/slack-format";

export const manualFollowupReportSchema = z.object({
  status: z.enum(["executado_relato", "parcial", "nao_executado", "bloqueado", "duvida", "inconclusivo"]),
  summary: z.string().trim().min(1).max(1000),
  evidence: z.string().trim().max(1000).nullable(),
  followUpQuestion: z.string().trim().min(1).max(300).nullable(),
  supportingQuote: z.string().trim().min(1).max(500).nullable(),
}).strict();
export type ManualFollowupReport = z.infer<typeof manualFollowupReportSchema>;

export type ManualFollowupTurn = { role: "person" | "assistant"; text: string };

export function buildManualFollowupHistory(messages: SlackConversationMessage[], input: { userId: string; botUserId: string | null; currentTs: string; rootTs: string }): ManualFollowupTurn[] {
  return messages
    .filter(message => message.ts && Number(message.ts) > Number(input.rootTs) && Number(message.ts) < Number(input.currentTs) && message.text && !message.subtype)
    .sort((a, b) => Number(a.ts) - Number(b.ts))
    .flatMap<ManualFollowupTurn>(message => {
      if (message.user === input.userId) return [{ role: "person", text: message.text!.trim().slice(0, 1200) }];
      if (input.botUserId && message.user === input.botUserId) return [{ role: "assistant", text: message.text!.trim().slice(0, 1200) }];
      return [];
    })
    .filter(turn => turn.text.length > 0)
    .slice(-20);
}

export function isSelfReportedComplete(reply: string) {
  const normalized = reply.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[,.;!?]+/g, " ").replace(/\s+/g, " ").trim();
  return /^(?:sim )?(?:eu )?(?:ja )?(?:fiz|conclui|terminei|executei) (?:tudo|todas?|todas as partes|todas as etapas|a acao|a atividade)(?:(?: e)? (?:nao tenho|sem) (?:nenhum |qualquer )?(?:impedimento|bloqueio|problema)s?)?(?: esta certo)?$/.test(normalized)
    || /^(?:eu )?fiz (?:ontem|hoje) (?:e )?(?:eu )?fiz todas as partes(?: sem (?:nenhum )?(?:impedimento|bloqueio))?$/.test(normalized);
}

export function isManualFollowupQuestion(reply: string) {
  const text = reply.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return /[?？]\s*$/.test(text)
    || /^(?:o que|qual|quais|como|por que|porque|quando|onde|quem|me explica|me explique|me lembra|pode me explicar)\b/.test(text);
}

export function contradictsReportedCompletion(reply: string) {
  const normalized = reply.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return /\b(?:nao fiz|nao executei|nao conclui|nao consegui|nao registrei|faltou|falta|pendente|ainda nao)\b/.test(normalized);
}

export function buildManualFollowupQuestion(input: { title: string; action: string; assetTitle: string; runId: string }) {
  return `Vamos acompanhar o action point *${input.title}*.\n\nAtivo vinculado: ${input.assetTitle}.\nO que foi combinado: ${input.action}\n\nO que você conseguiu fazer até agora? Conte o que foi executado, o que falta e qualquer bloqueio. Se houver um registro ou documento, indique qual é. Use *Responder na thread* desta mensagem para vincular seu relato a este action point. Seu relato será registrado como informação declarada e poderá ser revisado pela operação.\n\nReferência: ${input.runId}`;
}

export function manualFollowupPrompt(input: { title: string; action: string; question: string; history: ManualFollowupTurn[]; reply: string }) {
  return `Action Point: ${input.title}\nPrática combinada: ${input.action}\nPergunta inicial: ${input.question}\nHistórico anterior desta thread (somente pessoa responsável e assistente): ${JSON.stringify(input.history)}\nMensagem atual da pessoa: ${JSON.stringify(input.reply)}\n\nLeia a mensagem atual à luz do histórico. Mensagens da pessoa são declarações, não provas de execução. Se ela afirma de forma clara que fez toda a ação, inclusive com frases como "já fiz tudo sem impedimento" ou "fiz ontem, todas as partes", classifique como executado_relato mesmo sem documento ou detalhes adicionais. Não invente etapas, datas ou evidências. Se houver contradição ou disser que falta algo, não classifique como execução integral. Use parcial para avanço incompleto, nao_executado para não execução, bloqueado para impedimento, duvida para pergunta e inconclusivo somente quando a intenção ainda não puder ser entendida depois de considerar a thread. Resuma o que a pessoa declarou em até 1000 caracteres. Evidence é apenas uma referência concreta citada pela pessoa, ou null. Para executado_relato, supportingQuote deve ser um trecho literal de uma mensagem da pessoa que sustenta a conclusão; nos demais casos use null. Para inconclusivo, followUpQuestion deve ser uma única pergunta específica sobre o que ainda falta esclarecer, sem repetir uma pergunta já feita; nos demais casos use null. Responda apenas JSON com status, summary, evidence, followUpQuestion e supportingQuote.`;
}
