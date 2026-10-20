import { timingSafeEqual } from "node:crypto";
import { processSlackDelivery } from "@/lib/integrations/slack-delivery";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const secret = process.env.SLACK_DELIVERY_WORKER_SECRET;
  const supplied = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const suppliedBytes = Buffer.from(supplied); const expectedBytes = Buffer.from(expected);
  if (!secret || secret.length < 32 || suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) return Response.json({ ok: false }, { status: 401 });
  try { return Response.json({ processed: await processSlackDelivery() }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ message: "Processamento indisponível; evento conservado na fila." }, { status: 503 }); }
}
