import { timingSafeEqual } from "node:crypto";
import { scheduleRoutineContacts, scheduleRoutineReminders } from "@/lib/data/routine-contact-data-source";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const secret = process.env.SLACK_DELIVERY_WORKER_SECRET;
  const supplied = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || secret.length < 32 || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return Response.json({ ok: false }, { status: 401 });
  try {
    const contacts = await scheduleRoutineContacts();
    const reminders = await scheduleRoutineReminders();
    return Response.json({ ...contacts, reminders }, { headers: { "Cache-Control": "no-store" } });
  }
  catch { return Response.json({ message: "Agendamento indisponível. As rotinas existentes foram preservadas." }, { status: 503 }); }
}
