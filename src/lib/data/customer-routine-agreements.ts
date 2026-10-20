import "server-only";
import { customerRoutineAgreementSchema } from "@/lib/contracts/admin-adherence";
import type { AuthSession } from "@/lib/contracts/auth";
import { createSupabaseAdminClient, createSupabaseRlsClient } from "@/lib/supabase/server";

export async function getCustomerRoutineAgreements(session: AuthSession, organizationId: string, diagnosticId: string) {
  if (session.user.role === "superadmin" || session.acquisition || session.leadershipInvitation || !session.supabaseAccessToken) return [];
  // A policy corrente do diagnóstico governa também o acesso aos acordos privados.
  const visible = await createSupabaseRlsClient(session.supabaseAccessToken).from("diagnostics").select("id").eq("id", diagnosticId).eq("organization_id", organizationId).maybeSingle();
  if (visible.error) throw new Error("Não foi possível consultar os acordos desta coleta.");
  if (!visible.data) return [];
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("get_customer_adherence_agreements", { p_organization_id: organizationId, p_actor_user_id: session.user.id, p_diagnostic_id: diagnosticId });
  if (error) throw new Error("Não foi possível consultar os acordos desta coleta.");
  return customerRoutineAgreementSchema.array().parse(data);
}
