import { timingSafeEqual } from "node:crypto";
import { AdminCompanyActionPointError } from "@/lib/data/admin-company-action-points";
import { startManualActionPointFollowup } from "@/lib/data/manual-action-point-followups";
import { dueManualActionPointSlot } from "@/lib/data/manual-action-point-schedule";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const supplied = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || secret.length < 32 || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return Response.json({ ok: false }, { status: 401 });
  const now = new Date();
  let sent = 0; let skipped = 0; let failed = 0;
  for (let offset = 0; ; offset += 500) {
    const result = await createSupabaseAdminClient().schema("app_private").from("admin_company_action_points")
      .select("id,organization_id,frequency,weekdays,send_time,schedule_starts_on,deadline")
      .not("send_time", "is", null).order("id").range(offset, offset + 499);
    if (result.error) return Response.json({ message: "Não foi possível consultar toda a agenda.", sent, failed }, { status: 503 });
    for (const point of result.data ?? []) {
      const slot = dueManualActionPointSlot(point, now);
      if (!slot) continue;
      try {
        await startManualActionPointFollowup(`company_${point.organization_id}`, null, point.id, slot);
        sent++;
      } catch (error) {
        if (error instanceof AdminCompanyActionPointError && error.status === 409) skipped++;
        else failed++;
      }
    }
    if ((result.data?.length ?? 0) < 500) break;
  }
  return Response.json({ sent, skipped, failed }, { status: failed ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
