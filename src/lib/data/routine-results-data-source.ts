import "server-only";
import { z } from "zod";
import { requireAgentOperator } from "@/lib/data/agent-operations-data-source";
import { routineOrganizationId } from "@/lib/data/admin-adherence-data-source";
import { AssetAdherenceError } from "@/lib/data/asset-adherence-data-source";
import { captureResultBaselineInputSchema, resultBaselineSchema } from "@/lib/contracts/routine-results";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
function check(error: {code?: string} | null) {
 if (!error) return;
 const status = error.code === "42501" ? 403 : error.code === "PT404" ? 404 : ["PT409", "55P03"].includes(error.code ?? "") ? 409 : 500;
 throw new AssetAdherenceError(status === 409 ? "A coleta precisa estar encerrada e a pergunta vinculada ao acordo." : "Não foi possível acessar a linha de base.", status);
}
export async function getRoutineResultBaselines(companyId: string) {
 const session = await requireAgentOperator();
 const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("get_routine_result_baselines", { p_organization_id: routineOrganizationId(companyId), p_actor_user_id: z.uuid().parse(session.user.id) });
 check(error); return resultBaselineSchema.array().parse(data);
}
export async function captureResultBaseline(companyId: string, rawInput: unknown) {
 const session = await requireAgentOperator(); const input = captureResultBaselineInputSchema.parse(rawInput);
 const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("capture_routine_result_baseline", { p_organization_id: routineOrganizationId(companyId), p_actor_user_id: z.uuid().parse(session.user.id), p_rule_id: input.ruleId });
 check(error); return data;
}
