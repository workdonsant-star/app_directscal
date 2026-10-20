import "server-only";
import { slackDeliveryJobSchema, slackQuestionSchema, type SlackQuestion } from "@/lib/contracts/slack-delivery";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export async function enqueueSlackDelivery(eventId: string, input: SlackQuestion) {
  const question = slackQuestionSchema.parse(input);
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("enqueue_slack_delivery", { p_event_id: eventId, p_team_id: question.teamId, p_question: question });
  if (error) throw new Error("Não foi possível registrar o evento do Slack.");
  return data;
}
export async function claimSlackDelivery(id?: string) {
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("claim_slack_delivery", { p_job_id: id ?? null });
  if (error) throw new Error("Não foi possível iniciar o processamento do Slack.");
  return data ? slackDeliveryJobSchema.parse(data) : null;
}
export async function transitionSlackDelivery(id: string, lease: string, operation: "preparar" | "enviar" | "concluir" | "ignorar" | "falhar" | "incerto", value: Json = {}) {
  const { error } = await createSupabaseAdminClient().schema("app_private").rpc("transition_slack_delivery", { p_id: id, p_lease_id: lease, p_operation: operation, p_value: value });
  if (error) throw new Error("Não foi possível registrar o processamento do Slack.");
}
