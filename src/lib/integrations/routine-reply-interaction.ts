import { createHash } from "node:crypto";
import { z } from "zod";
import { slackQuestionSchema } from "@/lib/contracts/slack-delivery";

const payloadSchema = z.object({
  type: z.literal("block_actions"), team: z.object({ id: z.string() }), user: z.object({ id: z.string() }),
  channel: z.object({ id: z.string().regex(/^D[A-Za-z0-9]+$/) }),
  actions: z.array(z.object({ action_id: z.enum(["routine_reply_confirm", "routine_reply_cancel"]), value: z.uuid(), action_ts: z.string().regex(/^\d+\.\d+$/) })).length(1),
});
// Recebe somente um payload cuja assinatura já foi verificada pelo handler.
export function getRoutineReplyInteraction(payload: unknown) {
  const result = payloadSchema.safeParse(payload);
  if (!result.success) return null;
  const { team, user, channel, actions } = result.data;
  const action = actions[0];
  const decision = action.action_id === "routine_reply_confirm" ? "confirmar" : "cancelar";
  const question = slackQuestionSchema.parse({ kind: "direct", teamId: team.id, userId: user.id, channel: channel.id, ts: action.action_ts, text: `${decision} ${action.value}` });
  const eventId = `routine-action:${createHash("sha256").update(JSON.stringify([team.id, user.id, channel.id, action.action_id, action.value, action.action_ts])).digest("hex")}`;
  return { eventId, question };
}
