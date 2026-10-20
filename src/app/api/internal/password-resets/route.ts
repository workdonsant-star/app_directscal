import { timingSafeEqual } from "node:crypto";
import { processPasswordResetDelivery } from "@/lib/auth/password-recovery";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const secret = process.env.PASSWORD_RESET_WORKER_SECRET;
  const supplied = Buffer.from(request.headers.get("authorization") ?? ""), expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || secret.length < 32 || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return Response.json({ ok: false }, { status: 401 });
  try { return Response.json({ processed: await processPasswordResetDelivery() }, { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ message: "Recuperação de envio indisponível." }, { status: 503 }); }
}
