import "server-only";

import { z } from "zod";
import { adherenceCycleSchema, adherenceFactPayloadSchema, adherenceRuleSchema, type AdherenceCycle } from "@/lib/contracts/asset-adherence";
import { aggregateAssetAdherence } from "@/lib/data/asset-adherence";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";

type RuleRow = Database["app_private"]["Tables"]["asset_adherence_rules"]["Row"];
type CycleRow = Database["app_private"]["Tables"]["asset_adherence_cycles"]["Row"];
type FactRow = Database["app_private"]["Tables"]["asset_adherence_facts"]["Row"];

export class AssetAdherenceError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

function fail(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === "42501") throw new AssetAdherenceError("Acesso restrito à empresa e à operação DirectScal.", 403);
  if (error.code === "PT404") throw new AssetAdherenceError("Ciclo não encontrado.", 404);
  if (["PT409", "23505", "55P03"].includes(error.code ?? "")) throw new AssetAdherenceError("O acordo ou registro mudou. Atualize e revise a tentativa.", 409);
  if (["PT400", "23514", "23503"].includes(error.code ?? "")) throw new AssetAdherenceError("Revise os vínculos e os dados da rotina.", 400);
  throw new AssetAdherenceError("Não foi possível acessar os registros de aderência.", 500);
}

async function authorize(organizationId: string, actorUserId: string) {
  z.uuid().parse(organizationId); z.uuid().parse(actorUserId);
  const { data, error } = await createSupabaseAdminClient().from("organization_members")
    .select("organization_id,role").eq("user_id", actorUserId).in("role", ["cliente", "superadmin"]);
  fail(error);
  if (!data?.some(member => member.role === "superadmin" || (member.role === "cliente" && member.organization_id === organizationId))) throw new AssetAdherenceError("Acesso restrito à empresa e à operação DirectScal.", 403);
}

export function mapAssetAdherenceRule(row: RuleRow) {
  return adherenceRuleSchema.parse({ id: row.id, routineId: row.routine_id, revision: row.revision, organizationId: row.organization_id, diagnosticId: row.diagnostic_id, actionPointId: row.action_point_id, assetId: row.asset_id, assetVersionId: row.asset_version_id, questionId: row.question_id, sectorId: row.sector_id, assignee: { teamId: row.assignee_team_id, userId: row.assignee_user_id }, schedule: row.schedule, expectation: row.expectation, createdAt: row.created_at });
}

const createRuleSchema = adherenceRuleSchema.omit({ id: true, createdAt: true });
export async function createAssetAdherenceRule(actorUserId: string, rawInput: unknown) {
  const input = createRuleSchema.parse(rawInput);
  // A trigger também revalida ator, seleção publicada, versão, pergunta e responsável.
  const { data, error } = await createSupabaseAdminClient().schema("app_private").from("asset_adherence_rules").insert({
    routine_id: input.routineId, revision: input.revision, organization_id: input.organizationId, diagnostic_id: input.diagnosticId,
    action_point_id: input.actionPointId, asset_id: input.assetId, asset_version_id: input.assetVersionId,
    question_id: input.questionId, sector_id: input.sectorId, assignee_team_id: input.assignee.teamId, assignee_user_id: input.assignee.userId,
    schedule: input.schedule as Json, expectation: input.expectation, created_by: z.uuid().parse(actorUserId),
  }).select("*").single();
  fail(error);
  return mapAssetAdherenceRule(data!);
}

const openCycleSchema = z.object({ organizationId: z.uuid(), ruleId: z.uuid(), opportunityKey: z.string().trim().min(1).max(200), opensAt: z.iso.datetime({ offset: true }), dueAt: z.iso.datetime({ offset: true }) }).strict()
  .refine(input => Date.parse(input.dueAt) >= Date.parse(input.opensAt), "O prazo não pode anteceder a abertura.");

export async function openAssetAdherenceCycle(actorUserId: string, rawInput: unknown) {
  const input = openCycleSchema.parse(rawInput);
  await authorize(input.organizationId, actorUserId);
  const db = createSupabaseAdminClient().schema("app_private");
  const rule = await db.from("asset_adherence_rules").select("routine_id").eq("id", input.ruleId).eq("organization_id", input.organizationId).maybeSingle();
  fail(rule.error);
  if (!rule.data) throw new AssetAdherenceError("Acordo não encontrado.", 404);
  const { data, error } = await db.from("asset_adherence_cycles").insert({ organization_id: input.organizationId, rule_id: input.ruleId, routine_id: rule.data.routine_id, opportunity_key: input.opportunityKey, opens_at: input.opensAt, due_at: input.dueAt }).select("id").single();
  fail(error); return data!.id;
}

export async function recordAssetAdherenceFact({ organizationId, cycleId, actorUserId, id, payload }: { organizationId: string; cycleId: string; actorUserId: string; id: string; payload: unknown }) {
  const fact = adherenceFactPayloadSchema.parse(payload);
  for (const value of [organizationId, cycleId, actorUserId, id]) z.uuid().parse(value);
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("record_asset_adherence_fact", {
    p_organization_id: organizationId, p_cycle_id: cycleId, p_actor_user_id: actorUserId, p_id: id, p_payload: fact as Json,
  });
  fail(error);
  return z.object({ id: z.uuid(), sequence: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), recordedAt: z.iso.datetime({ offset: true }) }).parse(data);
}

async function allRows<T>(read: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { code?: string } | null }>) {
  const rows: T[] = [];
  for (let start = 0; ; start += 1000) {
    const page = await read(start, start + 999); fail(page.error);
    rows.push(...(page.data ?? []));
    if ((page.data?.length ?? 0) < 1000) return rows;
  }
}

export function mapAssetAdherenceCycles(rules: RuleRow[], cycles: CycleRow[], facts: FactRow[]): AdherenceCycle[] {
  const byRule = new Map(rules.map(row => [row.id, mapAssetAdherenceRule(row)]));
  const byCycle = new Map<string, FactRow[]>();
  for (const fact of facts) { const group = byCycle.get(fact.cycle_id) ?? []; group.push(fact); byCycle.set(fact.cycle_id, group); }
  return cycles.map(cycle => {
    const rule = byRule.get(cycle.rule_id);
    if (!rule || rule.organizationId !== cycle.organization_id || rule.routineId !== cycle.routine_id) throw new AssetAdherenceError("Vínculo de ciclo inconsistente.", 500);
    return adherenceCycleSchema.parse({ id: cycle.id, rule, opportunityKey: cycle.opportunity_key, opensAt: cycle.opens_at, dueAt: cycle.due_at,
      facts: (byCycle.get(cycle.id) ?? []).map(row => {
        if (row.organization_id !== cycle.organization_id) throw new AssetAdherenceError("Vínculo de fato inconsistente.", 500);
        return { id: row.id, cycleId: row.cycle_id, sequence: row.sequence, recordedAt: row.recorded_at, actorUserId: row.actor_user_id, payload: row.payload,
          origin: row.origin, slackTeamId: row.slack_team_id, slackUserId: row.slack_user_id, slackEventJobId: row.slack_event_job_id };
      }),
    });
  });
}

export async function getAssetAdherenceSummary({ organizationId, actorUserId, from, to, at = new Date() }: { organizationId: string; actorUserId: string; from: Date; to: Date; at?: Date }) {
  if (![from, to, at].every(date => Number.isFinite(date.getTime())) || from >= to) throw new AssetAdherenceError("Período de aderência inválido.", 400);
  await authorize(organizationId, actorUserId);
  const db = createSupabaseAdminClient().schema("app_private");
  const [rules, cycles] = await Promise.all([
    allRows<RuleRow>((start, end) => db.from("asset_adherence_rules").select("*").eq("organization_id", organizationId).order("created_at").order("id").range(start, end)),
    allRows<CycleRow>((start, end) => db.from("asset_adherence_cycles").select("*").eq("organization_id", organizationId).gte("due_at", from.toISOString()).lt("due_at", to.toISOString()).order("due_at").order("id").range(start, end)),
  ]);
  const facts: FactRow[] = [];
  for (let start = 0; start < cycles.length; start += 100) {
    const ids = cycles.slice(start, start + 100).map(cycle => cycle.id);
    facts.push(...await allRows<FactRow>((first, last) => db.from("asset_adherence_facts").select("*").eq("organization_id", organizationId).in("cycle_id", ids).lte("recorded_at", at.toISOString()).order("sequence").range(first, last)));
  }
  return aggregateAssetAdherence(mapAssetAdherenceCycles(rules, cycles, facts), { organizationId, from, to, at });
}

const transitionRoutineSchema = z.object({ organizationId: z.uuid(), routineId: z.uuid(), id: z.uuid(), expectedEventId: z.uuid().nullable(), action: z.enum(["pausar", "retomar"]), reason: z.string().trim().min(1).max(2000) }).strict();

export async function transitionAssetAdherenceRoutine(actorUserId: string, rawInput: unknown) {
  const input = transitionRoutineSchema.parse(rawInput);
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("transition_asset_adherence_routine", {
    p_organization_id: input.organizationId, p_routine_id: input.routineId, p_actor_user_id: z.uuid().parse(actorUserId), p_id: input.id,
    p_expected_event_id: input.expectedEventId, p_action: input.action, p_reason: input.reason,
  });
  if (error?.code === "42501") throw new AssetAdherenceError("Acesso restrito à operação DirectScal.", 403);
  fail(error);
  return z.object({ paused: z.boolean(), eventId: z.uuid(), recordedAt: z.iso.datetime({ offset: true }) }).parse(data);
}
