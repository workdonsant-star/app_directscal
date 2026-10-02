import { recordAssetAnswerFeedback } from "@/lib/agent/asset-question-service";
import {
  getSlackInstallation,
  respondToSlackAction,
  verifySlackRequest,
} from "@/lib/integrations/slack";
import {
  replaceSlackFeedbackBlock,
  SLACK_FEEDBACK_ACTIONS,
} from "@/lib/integrations/slack-format";

export const runtime = "nodejs";

type SlackInteractionPayload = {
  type?: string;
  team?: { id?: string };
  user?: { id?: string };
  response_url?: string;
  message?: { blocks?: Array<Record<string, unknown>>; text?: string };
  actions?: Array<{ action_id?: string; value?: string }>;
};

const feedbackByAction = new Map<string, "util" | "nao_util">([
  [SLACK_FEEDBACK_ACTIONS.util, "util"],
  [SLACK_FEEDBACK_ACTIONS.nao_util, "nao_util"],
]);

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifySlackRequest(request, rawBody)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let payload: SlackInteractionPayload;

  try {
    payload = JSON.parse(
      new URLSearchParams(rawBody).get("payload") ?? "",
    ) as SlackInteractionPayload;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const action = payload.actions?.[0];
  const value = action?.action_id ? feedbackByAction.get(action.action_id) : undefined;
  const teamId = payload.team?.id;
  const userId = payload.user?.id;

  if (payload.type !== "block_actions" || !value || !action?.value || !teamId || !userId) {
    return new Response(null, { status: 200 });
  }

  const installation = await getSlackInstallation(teamId);

  if (!installation) {
    return new Response(null, { status: 200 });
  }

  // Só a pessoa que perguntou avalia a resposta; os demais cliques são ignorados.
  const saved = await recordAssetAnswerFeedback({
    auditId: action.value,
    organizationId: installation.organizationId,
    externalUserId: `${teamId}:${userId}`,
    value,
  }).catch((error: unknown) => {
    console.error("[slack] feedback failed", error);
    return false;
  });

  if (saved && payload.response_url && payload.message?.blocks) {
    await respondToSlackAction(payload.response_url, {
      replace_original: true,
      text: payload.message.text ?? "Resposta do DirectScal",
      blocks: replaceSlackFeedbackBlock(payload.message.blocks, value),
    });
  }

  return new Response(null, { status: 200 });
}
