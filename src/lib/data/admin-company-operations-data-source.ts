import "server-only";

import { z } from "zod";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { companyOperationsSchema, companySpecialistAssignmentSchema, companySpecialistInputSchema } from "@/lib/contracts/admin-operations";
import { getAdminAcquisitionSnapshot } from "@/lib/data/acquisition-data-source";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function getOrganizationSpecialistAssignment(organizationId: string) {
  const { data, error } = await createSupabaseAdminClient().schema("app_private")
    .from("organization_specialist_assignments").select("specialist_id,updated_at")
    .eq("organization_id", organizationId).maybeSingle();
  if (error) throw new Error("Não foi possível consultar a atribuição da empresa.");
  return companySpecialistAssignmentSchema.parse({ specialistId: data?.specialist_id ?? null, updatedAt: data?.updated_at ?? null });
}

export async function getAdminCompanyContext(companyId: string) {
  const session = await getCurrentAuthSession();
  if (!session || session.user.role !== "superadmin") return null;
  const snapshot = await getAdminAcquisitionSnapshot();
  const company = snapshot.companies.find(item => item.id === companyId);
  if (!company) return null;
  if (!company.organizationId) {
    return { company, modules: snapshot.modules, operations: companyOperationsSchema.parse({ assignment: { specialistId: null, updatedAt: null }, deliveries: [] }) };
  }
  return { company, modules: snapshot.modules, operations: await getOrganizationOperations(company.organizationId, session.user.id) };
}

export async function getOrganizationOperations(organizationId: string, actorUserId: string) {
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("get_organization_operations", {
    p_organization_id: organizationId, p_actor_user_id: actorUserId,
  });
  if (error) throw new Error("Não foi possível consultar a operação da empresa.");
  return companyOperationsSchema.parse(data);
}

export type AdminCompanyContext = NonNullable<Awaited<ReturnType<typeof getAdminCompanyContext>>>;

export class CompanyAssignmentError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function saveCompanySpecialistAssignment(companyId: string, actorUserId: string, rawInput: unknown) {
  const organizationId = companyId.startsWith("company_") ? companyId.slice(8) : "";
  if (!z.uuid().safeParse(organizationId).success) throw new CompanyAssignmentError("Esta empresa ainda não tem organização cadastrada.", 400);
  const input = companySpecialistInputSchema.parse(rawInput);
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("assign_organization_specialist", {
    p_organization_id: organizationId, p_actor_user_id: actorUserId,
    p_specialist_id: input.specialistId, p_expected_updated_at: input.expectedUpdatedAt,
  });
  if (error) {
    if (error.code === "PT409") throw new CompanyAssignmentError("A atribuição mudou em outra sessão. Atualize a página e revise a seleção.", 409);
    if (error.code === "PT404") throw new CompanyAssignmentError("Empresa não encontrada.", 404);
    if (error.code === "PT400") throw new CompanyAssignmentError("Selecione um especialista ativo.", 400);
    if (error.code === "42501") throw new CompanyAssignmentError("Acesso restrito à operação.", 403);
    throw new CompanyAssignmentError("Não foi possível salvar a atribuição.", 500);
  }
  return companySpecialistAssignmentSchema.parse(data);
}
