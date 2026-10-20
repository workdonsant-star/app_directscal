import "server-only";
import { z } from "zod";
import { routineReplyOperationSchema } from "@/lib/contracts/routine-replies";
import { routineSupervisionEventSchema, routineSupervisionInputSchema } from "@/lib/contracts/routine-supervision";
import { routineOrganizationId } from "@/lib/data/admin-adherence-data-source";
import { AssetAdherenceError, mapAssetAdherenceCycles } from "@/lib/data/asset-adherence-data-source";
import type { RoutineReviewCycle } from "@/lib/data/routine-supervision";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";
type Tables = Database["app_private"]["Tables"];
// Os campos usados dessas linhas são validados integralmente pelo mapper de ciclos A03.
const row = <T>() => z.custom<T>(value => Boolean(value && typeof value === "object" && !Array.isArray(value)));
const rawSchema = z.object({
  rules: row<Tables["asset_adherence_rules"]["Row"]>().array(), cycles: row<Tables["asset_adherence_cycles"]["Row"]>().array().max(100), facts: row<Tables["asset_adherence_facts"]["Row"]>().array(),
  proposals: z.object({ id: z.uuid(), cycle_id: z.uuid(), status: z.enum(["pendente", "confirmada", "cancelada"]), operation: routineReplyOperationSchema,
    expires_at: z.iso.datetime({ offset: true }), created_at: z.iso.datetime({ offset: true }), fact_id: z.uuid().nullable(), actor_name: z.string() }).array(),
  reviews: z.object({ id: z.uuid(), cycle_id: z.uuid(), sequence: z.number().int().positive(), operation: z.enum(["evidencia", "excecao", "orientar", "prazo"]),
    reason: z.string(), response_due_at: z.iso.datetime({ offset: true }).nullable(), accepted: z.boolean().nullable(), recorded_at: z.iso.datetime({ offset: true }), source_proposal_id: z.uuid().nullable(), actorName: z.string() }).array(),
  contacts: z.object({ cycleId: z.uuid(), deliveredAt: z.iso.datetime({ offset: true }).nullable(), status: z.string() }).array(),
});
function check(error: { code?: string } | null) {
  if (!error) return;
  const status = error.code === "42501" ? 403 : error.code === "PT404" ? 404 : ["PT409", "23505", "55P03"].includes(error.code ?? "") ? 409 : ["PT400", "22P02", "23514"].includes(error.code ?? "") ? 400 : 500;
  throw new AssetAdherenceError(status === 409 ? "A rotina ou revisão mudou. Seu texto foi preservado. Atualize os dados antes de tentar novamente." : "Não foi possível concluir a revisão desta rotina.", status);
}
export async function getRoutineSupervision(companyId: string, actorUserId: string) {
  const organizationId = routineOrganizationId(companyId);
  const result: RoutineReviewCycle[] = [];
  let before: { createdAt: string; id: string } | undefined;
  for (;;) {
    const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("get_admin_routine_cycles", { p_organization_id: organizationId, p_actor_user_id: z.uuid().parse(actorUserId), ...(before ? { p_before_at: before.createdAt, p_before_id: before.id } : {}) });
    check(error);
    const raw = rawSchema.parse(data);
    const cycles = mapAssetAdherenceCycles(raw.rules, raw.cycles, raw.facts);
    for (const cycle of cycles) {
      if (cycle.rule.organizationId !== organizationId) throw new AssetAdherenceError("Ciclo indisponível nesta empresa.", 500);
      result.push({ cycle, title: raw.rules.find(rule => rule.id === cycle.rule.id)?.title ?? "Rotina acordada",
        successIndicator: raw.rules.find(rule => rule.id === cycle.rule.id)?.success_indicator,
        proposals: raw.proposals.filter(proposal => proposal.cycle_id === cycle.id).map(proposal => ({ id: proposal.id, cycleId: cycle.id, status: proposal.status, operation: proposal.operation, expiresAt: proposal.expires_at, createdAt: proposal.created_at, factId: proposal.fact_id, actorName: proposal.actor_name })),
        reviews: raw.reviews.filter(review => review.cycle_id === cycle.id).map(review => ({ ...routineSupervisionEventSchema.parse({ id: review.id, operation: review.operation, reason: review.reason, responseDueAt: review.response_due_at, accepted: review.accepted, recordedAt: review.recorded_at, actorName: review.actorName }), sequence: review.sequence, sourceProposalId: review.source_proposal_id })),
        deliveredAt: raw.contacts.find(contact => contact.cycleId === cycle.id)?.deliveredAt ?? null,
      });
    }
    if (raw.cycles.length < 100) return result;
    const last = raw.cycles.at(-1)!;
    if (before?.id === last.id) throw new AssetAdherenceError("Não foi possível avançar na fila de revisão.", 500);
    before = { createdAt: last.created_at, id: last.id };
  }
}
export async function saveRoutineSupervision(companyId: string, actorUserId: string, rawInput: unknown) {
  const input = routineSupervisionInputSchema.parse(rawInput);
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("save_routine_supervision", { p_organization_id: routineOrganizationId(companyId), p_actor_user_id: z.uuid().parse(actorUserId), p_input: input as Json });
  check(error); return data;
}
