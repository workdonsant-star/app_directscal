import { createSupabaseAdminClient } from "@/lib/supabase/server";

type MemberRoleRow = {
  role: "superadmin" | "admin" | "cliente";
};

type DiagnosticOrganizationRow = {
  organization_id: string;
};

type OrganizationMembershipRow = {
  organization_id: string;
  role: "superadmin" | "admin" | "cliente";
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return uuidPattern.test(value);
}

export async function getAccessibleOrganizationIdsForUser(userId: string) {
  if (!isUuid(userId)) {
    return {
      isSuperadmin: false,
      organizationIds: [],
      primaryOrganizationId: null,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select("organization_id,role")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .returns<OrganizationMembershipRow[]>();

  if (error) throw error;

  const isSuperadmin = memberships.some((item) => item.role === "superadmin");

  if (isSuperadmin) {
    const { data: organizations, error: organizationsError } = await supabase
      .from("organizations")
      .select("id")
      .order("created_at", { ascending: true })
      .returns<{ id: string }[]>();

    if (organizationsError) throw organizationsError;

    return {
      isSuperadmin,
      organizationIds: organizations.map((organization) => organization.id),
      primaryOrganizationId: organizations[0]?.id ?? null,
    };
  }

  return {
    isSuperadmin,
    organizationIds: memberships.map((item) => item.organization_id),
    primaryOrganizationId: memberships[0]?.organization_id ?? null,
  };
}

export async function userCanAccessOrganization(
  userId: string,
  organizationId: string,
) {
  if (!isUuid(userId) || !isUuid(organizationId)) return false;

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
  if (!isUuid(userId) || !isUuid(diagnosticId)) return false;

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
  if (!isUuid(diagnosticId)) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("diagnostics")
    .select("organization_id")
    .eq("id", diagnosticId)
    .maybeSingle<DiagnosticOrganizationRow>();

  if (error) throw error;

  return data?.organization_id ?? null;
}
