import "server-only";

import { companyDeletionInputSchema, companyDeletionResultSchema } from "@/lib/contracts/company-deletion";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export class CompanyDeletionError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function deleteAdminCompanies(actorUserId: string, rawInput: unknown) {
  const input = companyDeletionInputSchema.parse(rawInput);
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("delete_admin_companies", {
    p_actor_user_id: actorUserId,
    p_organization_ids: input.companyIds.map((id) => id.slice(8)),
    p_confirmation: input.confirmation,
  });
  if (error) {
    if (error.code === "PGRST202") throw new CompanyDeletionError("A exclusão de empresas ainda não foi ativada neste ambiente.", 503);
    if (error.code === "42501") throw new CompanyDeletionError("Acesso restrito ao superadmin.", 403);
    if (error.code === "PT403") throw new CompanyDeletionError("O registro interno de acesso administrativo não pode ser excluído por esta operação.", 403);
    if (error.code === "PT404") throw new CompanyDeletionError("Uma empresa selecionada não existe mais. Atualize a página e revise a seleção.", 404);
    if (error.code === "PT400") throw new CompanyDeletionError("Revise a seleção e digite EXCLUIR para confirmar.", 400);
    if (["PT409", "55P03", "40P01", "23503"].includes(error.code)) throw new CompanyDeletionError("Há uma operação em andamento ou um vínculo que impede a exclusão. Nenhuma empresa foi excluída. Atualize a página e tente novamente.", 409);
    throw new CompanyDeletionError("Não foi possível excluir as empresas. Tente novamente.", 500);
  }
  return companyDeletionResultSchema.parse(data);
}
