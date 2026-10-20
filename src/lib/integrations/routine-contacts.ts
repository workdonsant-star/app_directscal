import "server-only";
import { z } from "zod";
import type { RoutineContactDisposition } from "@/lib/contracts/routine-contacts";
import type { SlackDeliveryJob } from "@/lib/contracts/slack-delivery";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSlackWorkspaceUser, openSlackDirectConversation, type SlackInstallation } from "@/lib/integrations/slack";
import { escapeSlackText as plain } from "@/lib/integrations/slack-format";

const dispositionSchema = z.discriminatedUnion("disposition", [
  z.object({ disposition: z.literal("cancelar") }),
  z.object({ disposition: z.literal("adiar"), availableAt: z.string().datetime({ offset: true }) }),
  z.object({ disposition: z.literal("enviar"), purpose: z.enum(["inicial", "lembrete"]).optional(), title: z.string(), expectation: z.string(), successIndicator: z.string(), assetTitle: z.string(), assetVersion: z.string(), opensAt: z.string(), dueAt: z.string(), cycleId: z.uuid() }),
]);
export async function getRoutineContactDisposition(job: SlackDeliveryJob, reserve = false): Promise<RoutineContactDisposition> {
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("get_routine_contact_context", { p_job_id: job.id, p_lease_id: job.lease_id, p_reserve: reserve });
  if (error) throw new Error("Não foi possível verificar a regra de contato.");
  return dispositionSchema.parse(data);
}
export async function deferRoutineContact(job: SlackDeliveryJob, availableAt: string) {
  const { error } = await createSupabaseAdminClient().schema("app_private").rpc("defer_slack_delivery", { p_id: job.id, p_lease_id: job.lease_id, p_available_at: availableAt });
  if (error) throw new Error("Não foi possível conservar o contato para a próxima janela.");
}
export async function prepareRoutineContact(job: SlackDeliveryJob, installation: SlackInstallation, context: Extract<RoutineContactDisposition, { disposition: "enviar" }>) {
  const person = await getSlackWorkspaceUser(installation.botToken, job.question.userId);
  if (!person) return null;
  const channel = await openSlackDirectConversation(installation.botToken, person.userId);
  const format = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const deadline = new Date(context.dueAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
  const introduction = context.purpose === "lembrete" ? `Olá, ${plain(person.name)}. Ainda não recebi um relato da rotina ${plain(context.title)}. Este é o único lembrete deste ciclo; se houver uma dificuldade, você pode relatar o bloqueio.` : `Olá, ${plain(person.name)}. Vamos acompanhar a rotina ${plain(context.title)}.`;
  const text = `${introduction}\n\nAtivo: ${plain(context.assetTitle)} · versão ${plain(context.assetVersion)}\nPeríodo: ${format(context.opensAt)} a ${format(context.dueAt)}\nPrazo: ${deadline} (horário de São Paulo)\n\nO que foi acordado: ${plain(context.expectation)}\nEvidência esperada: ${plain(context.successIndicator)}\n\nVocê conseguiu executar a prática neste período? Responda nesta conversa com o relato e a evidência. Uma consulta aos ativos continua sendo uma pergunta; nenhuma mudança é registrada sem sua confirmação.\nReferência da rotina: ${context.cycleId}`;
  return { text, channel };
}
