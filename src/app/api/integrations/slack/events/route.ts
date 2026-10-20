import { after } from "next/server";
import { verifySlackRequest, revokeSlackInstallation } from "@/lib/integrations/slack";
import { getQuestionEvent, type SlackEventPayload } from "@/lib/integrations/slack-question";
import { enqueueSlackDelivery } from "@/lib/integrations/slack-delivery-store";
import { processSlackDelivery } from "@/lib/integrations/slack-delivery";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifySlackRequest(request, rawBody)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let payload: SlackEventPayload;

  try {
    payload = JSON.parse(rawBody) as SlackEventPayload;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Payload inválido");
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

  let question;
  try { question = getQuestionEvent(payload); } catch { return Response.json({ ok: false }, { status: 400 }); }
  if (!question || !payload.event_id) return Response.json({ ok: true });
  let id: string | null;
  try { id = await enqueueSlackDelivery(payload.event_id, question); }
  catch { return Response.json({ ok: false }, { status: 503 }); }
  if (id) after(async () => {
    try { await processSlackDelivery(id); }
    catch { console.error("[slack] durable processing unavailable"); }
  });
  return Response.json({ ok: true });
}
