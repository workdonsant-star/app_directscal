import "server-only";
import { z } from "zod";
import { routineContactPolicyInputSchema, routineEventInputSchema, type RoutineContactPolicy } from "@/lib/contracts/routine-contacts";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AssetAdherenceError, mapAssetAdherenceRule } from "@/lib/data/asset-adherence-data-source";
import { currentRoutineOpportunity } from "@/lib/data/routine-calendar";
import type { Database, Json } from "@/lib/supabase/database.types";

function organization(companyId: string) {
  const id = companyId.replace(/^company_/, "");
  if (!z.uuid().safeParse(id).success) throw new AssetAdherenceError("Empresa indisponível.", 404);
  return id;
}
function fail(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === "42501") throw new AssetAdherenceError("Acesso restrito à operação DirectScal.", 403);
  if (["PT409", "23505", "55P03"].includes(error.code ?? "")) throw new AssetAdherenceError("A configuração mudou ou o Slack precisa ser reconectado. Atualize antes de ativar o acompanhamento.", 409);
  if (["PT400", "23514", "22P02", "22007", "22008"].includes(error.code ?? "")) throw new AssetAdherenceError("Revise público, dias, horário, ocorrência e limites de contato.", 400);
  throw new AssetAdherenceError("Não foi possível acessar o acompanhamento das rotinas.", 500);
}
export async function getRoutineContactPolicy(companyId: string, actorId: string): Promise<RoutineContactPolicy | null> {
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("get_routine_contact_policy", { p_organization_id: organization(companyId), p_actor_user_id: z.uuid().parse(actorId) });
  fail(error); if (!data) return null;
  const row = data as Record<string, unknown>;
  const input = routineContactPolicyInputSchema.parse({ id: row.id, expectedRevision: Number(row.revision) - 1, enabled: row.enabled, sectorIds: row.sector_ids, weekdays: row.weekdays, startHour: row.start_hour, endHour: row.end_hour, timeZone: row.time_zone, maxCompanyPerDay: row.max_company_per_day, maxPersonPerDay: row.max_person_per_day, reason: row.reason });
  const { expectedRevision: previous, ...policy } = input;
  return { ...policy, revision: previous + 1, createdAt: z.string().parse(row.created_at), enabledAt: z.string().nullable().parse(row.enabled_at) };
}
export async function saveRoutineContactPolicy(companyId: string, actorId: string, input: unknown) {
  const parsed = routineContactPolicyInputSchema.parse(input);
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("save_routine_contact_policy", { p_organization_id: organization(companyId), p_actor_user_id: z.uuid().parse(actorId), p_input: parsed as Json });
  fail(error); return data;
}
export async function scheduleRoutineContacts() {
  const db = createSupabaseAdminClient().schema("app_private");
  const result = await db.rpc("get_routine_contact_schedule"); fail(result.error);
  const entries = z.array(z.object({ policyId: z.uuid(), enabledAt: z.string(), rule: z.unknown() })).parse(result.data);
  let ensured = 0; let failed = 0;
  for (const entry of entries) {
    const rule = mapAssetAdherenceRule(entry.rule as Database["app_private"]["Tables"]["asset_adherence_rules"]["Row"]);
    let error = false;
    try {
      const createdAt = Date.parse(rule.createdAt) > Date.parse(entry.enabledAt) ? rule.createdAt : entry.enabledAt;
      const opportunity = currentRoutineOpportunity({ ...rule, createdAt });
      if (opportunity) {
        const result = await db.rpc("enqueue_routine_contact", { p_organization_id: rule.organizationId, p_policy_id: entry.policyId, p_rule_id: rule.id, p_opportunity_key: opportunity.opportunityKey, p_opens_at: opportunity.opensAt, p_due_at: opportunity.dueAt });
        fail(result.error); if (result.data) ensured++;
      }
    } catch { error = true; failed++; }
    const touched = await db.rpc("touch_routine_contact_schedule", { p_rule_id: rule.id, p_error: error });
    fail(touched.error);
  }
  return { checked: entries.length, ensured, failed };
}

export async function scheduleRoutineReminders() {
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("enqueue_routine_reminders", {});
  fail(error);
  return z.object({ checked: z.number().int().nonnegative(), ensured: z.number().int().nonnegative(), failed: z.number().int().nonnegative() }).parse(data);
}

export async function openRoutineEventContact(companyId: string, actorId: string, input: unknown) {
  const parsed = routineEventInputSchema.parse(input);
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("open_routine_event_contact", { p_organization_id: organization(companyId), p_actor_user_id: z.uuid().parse(actorId), p_input: parsed as Json });
  fail(error); return z.object({ cycleId: z.uuid(), jobId: z.uuid() }).parse(data);
}
