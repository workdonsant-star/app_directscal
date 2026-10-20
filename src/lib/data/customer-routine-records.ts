import "server-only";
import type { AuthSession } from "@/lib/contracts/auth";
import { routineExecutionRecordSchema, type RoutineExecutionRecord } from "@/lib/contracts/routine-replies";
import { createSupabaseAdminClient, createSupabaseRlsClient } from "@/lib/supabase/server";

export async function getCustomerRoutineRecords(session: AuthSession, organizationId: string, diagnosticId: string) {
  if (session.user.role === "superadmin" || session.acquisition || session.leadershipInvitation || !session.supabaseAccessToken) return [];
  const visible = await createSupabaseRlsClient(session.supabaseAccessToken).from("diagnostics").select("id").eq("id", diagnosticId).eq("organization_id", organizationId).maybeSingle();
  if (visible.error) throw new Error("Não foi possível consultar os registros desta coleta.");
  if (!visible.data) return [];
  const records: RoutineExecutionRecord[] = [];
  let before: RoutineExecutionRecord | undefined;
  for (;;) {
    const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("get_customer_routine_records", {
      p_organization_id: organizationId, p_actor_user_id: session.user.id, p_diagnostic_id: diagnosticId,
      ...(before ? { p_before_at: before.createdAt, p_before_id: before.cycle.id } : {}),
    });
    if (error) throw new Error("Não foi possível consultar os registros desta coleta.");
    const page = routineExecutionRecordSchema.array().max(100).parse(data);
    records.push(...page);
    if (page.length < 100) return records;
    const last = page.at(-1)!;
    if (before && last.cycle.id === before.cycle.id) throw new Error("Não foi possível avançar nos registros desta coleta.");
    before = last;
  }
}
