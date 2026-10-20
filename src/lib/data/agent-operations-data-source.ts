import "server-only";
import { z } from "zod";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { agentGapInputSchema, agentOperationsSchema, type AgentOperations } from "@/lib/contracts/agent-operations";
import { routineOrganizationId } from "@/lib/data/admin-adherence-data-source";
import { AssetAdherenceError } from "@/lib/data/asset-adherence-data-source";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export async function requireAgentOperator() {
  const session = await getCurrentAuthSession();
  if (!session || session.user.role !== "superadmin" || session.acquisition || session.leadershipInvitation) throw new AssetAdherenceError("Acesso restrito à operação DirectScal.", session ? 403 : 401);
  return session;
}
function check(error: { code?: string } | null) {
  if (!error) return;
  const status = error.code === "42501" ? 403 : error.code === "PT404" ? 404 : ["PT409", "23505", "55P03"].includes(error.code ?? "") ? 409 : ["PT400", "22P02", "23514"].includes(error.code ?? "") ? 400 : 500;
  throw new AssetAdherenceError(status === 409 ? "A revisão mudou. Preserve seu texto e atualize os dados antes de tentar novamente." : "Não foi possível concluir o acompanhamento da lacuna.", status);
}
export async function getAgentOperations(companyId: string, auditIds: string[]) {
  const session = await requireAgentOperator();
  let result: AgentOperations | undefined;
  for (let offset = 0; offset < Math.max(auditIds.length, 1); offset += 200) {
    const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("get_agent_operations", { p_organization_id: routineOrganizationId(companyId), p_actor_user_id: z.uuid().parse(session.user.id), p_audit_ids: auditIds.slice(offset, offset + 200) });
    check(error); const batch = agentOperationsSchema.parse(data);
    if (!result) result = batch; else result.reviews.push(...batch.reviews);
  }
  return result!;
}
export async function saveAgentGap(companyId: string, rawInput: unknown) {
  const session = await requireAgentOperator(); const input = agentGapInputSchema.parse(rawInput);
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("save_agent_gap_review", { p_organization_id: routineOrganizationId(companyId), p_actor_user_id: z.uuid().parse(session.user.id), p_input: input as Json });
  check(error); return data;
}
