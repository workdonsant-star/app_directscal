import "server-only";
import { slackReplySchema } from "@/lib/contracts/slack-delivery";
import { claimSlackDelivery, transitionSlackDelivery } from "@/lib/integrations/slack-delivery-store";
import { getSlackInstallation, getSlackWorkspaceUser, postSlackMessage, SlackDeliveryError } from "@/lib/integrations/slack";
import { completeSlackIdentity } from "@/lib/data/slack-identity-data-source";
import { prepareSlackQuestion } from "@/lib/integrations/slack-question-service";
import type { Json } from "@/lib/supabase/database.types";
import { deferRoutineContact, getRoutineContactDisposition, prepareRoutineContact } from "@/lib/integrations/routine-contacts";
import { prepareRoutineReply } from "@/lib/integrations/routine-replies";

export async function processSlackDelivery(id?: string) {
  const job = await claimSlackDelivery(id);
  if (!job) return false;
  const transition = (operation: Parameters<typeof transitionSlackDelivery>[2], value?: Json) => transitionSlackDelivery(job.id, job.lease_id, operation, value);
  const installation = await getSlackInstallation(job.team_id, { allowEnvFallback: false }).catch(() => null);
  if (!installation || installation.organizationId !== job.organization_id) {
    await transition("falhar", { code: "instalacao_indisponivel", retryable: false });
    return true;
  }
  const routine = job.question.kind === "rotina";
  let context;
  if (routine) {
    context = await getRoutineContactDisposition(job);
    if (context.disposition === "cancelar") { await transition("ignorar"); return true; }
    if (context.disposition === "adiar") { await deferRoutineContact(job, context.availableAt); return true; }
  }
  let reply = job.reply;
  if (!reply) {
    try {
      let prepared;
      if (job.question.kind === "rotina" && context?.disposition === "enviar") {
        prepared = await prepareRoutineContact(job, installation, context);
      } else if (job.question.kind === "direct" && /^vincular\b/i.test(job.question.text.trim())) {
        const person = await getSlackWorkspaceUser(installation.botToken, job.question.userId);
        const confirmed = person && await completeSlackIdentity(job.id, job.lease_id);
        prepared = { text: confirmed ? "Sua identidade no app e no Slack foi confirmada. Volte ao perfil e verifique a confirmação." : "Não foi possível confirmar este código. Gere um novo no seu perfil e envie nesta conversa privada. Um vínculo anterior precisa ser desvinculado pelo próprio perfil." };
      } else {
        if (job.question.kind === "rotina") throw new Error("Contato sem contexto.");
        prepared = await prepareRoutineReply(job, installation) ?? await prepareSlackQuestion(job.question, installation);
      }
      if (!prepared) { await transition("ignorar"); return true; }
      reply = slackReplySchema.parse(prepared);
    } catch (error) {
      const failure = error instanceof SlackDeliveryError ? error : null;
      await transition("falhar", failure ? { code: failure.code, retryable: failure.retryable, retryAfter: failure.retryAfter } : { code: "provedor_indisponivel", retryable: true });
      return true;
    }
    // A persistência precisa terminar antes de qualquer tentativa de envio.
    await transition("preparar", reply as Json);
  }
  if (routine) {
    const person = await getSlackWorkspaceUser(installation.botToken, job.question.userId);
    if (!person) { await transition("ignorar"); return true; }
    const latest = await getRoutineContactDisposition(job, true);
    if (latest.disposition === "cancelar") { await transition("ignorar"); return true; }
    if (latest.disposition === "adiar") { await deferRoutineContact(job, latest.availableAt); return true; }
  }
  const channel = routine ? reply.channel : job.question.channel;
  if (!channel || (routine && !channel.startsWith("D"))) throw new Error("Conversa privada indisponível.");
  await transition("enviar");
  let delivered;
  try {
    delivered = await postSlackMessage(installation.botToken, { channel, threadTs: job.question.kind === "rotina" ? undefined : job.question.threadTs, clientMsgId: job.id, text: reply.text, blocks: reply.blocks });
    if (delivered.channel !== channel || !/^\d+\.\d+$/.test(delivered.ts)) throw new SlackDeliveryError("envio_sem_confirmacao", false, true);
  } catch (error) {
    const failure = error instanceof SlackDeliveryError ? error : new SlackDeliveryError("envio_sem_confirmacao", false, true);
    await transition(failure.uncertain ? "incerto" : "falhar", { code: failure.code, retryable: failure.retryable, retryAfter: failure.retryAfter });
    return true;
  }
  // Se esta confirmação falhar, o lease expira como incerto. Não repetir o envio.
  await transition("concluir", { ts: delivered.ts });
  return true;
}
