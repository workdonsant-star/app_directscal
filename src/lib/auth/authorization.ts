import { createSupabaseAdminClient } from "@/lib/supabase/server";

type MemberRoleRow = {
  role: "superadmin" | "admin" | "cliente";
};

type DiagnosticOrganizationRow = {
  organization_id: string;
};

export async function userCanAccessOrganization(
  userId: string,
  organizationId: string,
) {
  const supabase = createSupabaseAdminClient();

  const { data: superadminMembership, error: superadminError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "superadmin")
    .limit(1)
    .maybeSingle<MemberRoleRow>();

  if (superadminError) throw superadminError;
  if (superadminMembership?.role === "superadmin") return true;

  const { data: membership, error } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .limit(1)
    .maybeSingle<MemberRoleRow>();

  if (error) throw error;

  return Boolean(membership);
}

export async function userCanAccessDiagnostic(userId: string, diagnosticId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: diagnostic, error } = await supabase
    .from("diagnostics")
    .select("organization_id")
    .eq("id", diagnosticId)
    .maybeSingle<DiagnosticOrganizationRow>();

  if (error) throw error;
  if (!diagnostic) return false;

  return userCanAccessOrganization(userId, diagnostic.organization_id);
}

export async function getDiagnosticOrganizationId(diagnosticId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("diagnostics")
    .select("organization_id")
    .eq("id", diagnosticId)
    .maybeSingle<DiagnosticOrganizationRow>();

  if (error) throw error;

  return data?.organization_id ?? null;
}
