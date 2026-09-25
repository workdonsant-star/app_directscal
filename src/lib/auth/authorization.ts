import { cache } from "react";

import { getDiagnosticAccessDecision } from "@/lib/auth/diagnostic-access";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { adminModules } from "@/lib/mock-data";
import type { AuthSession } from "@/lib/contracts";

type MemberRoleRow = {
  role: "superadmin" | "admin" | "cliente";
};

type DiagnosticOrganizationRow = {
  created_by_user_id: string | null;
  organization_id: string;
};

type OrganizationMembershipRow = {
  organization_id: string;
  role: "superadmin" | "admin" | "cliente";
};

type OrganizationModuleAccessRow = {
  organization_id: string;
  module_id: string;
  enabled: boolean;
};

function isMissingModuleAccessTableError(error: { message: string } | null) {
  return (
    Boolean(error) &&
    /organization_module_access|schema cache|could not find the table/i.test(
      error?.message ?? "",
    )
  );
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return uuidPattern.test(value);
}

export const getAccessibleOrganizationIdsForUser = cache(
  async function getAccessibleOrganizationIdsForUser(userId: string) {
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
      return {
        isSuperadmin,
        organizationIds: [],
        primaryOrganizationId: null,
      };
    }

    return {
      isSuperadmin,
      organizationIds: memberships.map((item) => item.organization_id),
      primaryOrganizationId: memberships[0]?.organization_id ?? null,
    };
  },
);

export async function userCanAccessOrganization(
  userId: string,
  organizationId: string,
) {
  if (!isUuid(userId) || !isUuid(organizationId)) return false;

  const access = await getAccessibleOrganizationIdsForUser(userId);

  if (access.isSuperadmin) return false;

  const supabase = createSupabaseAdminClient();

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
    .select("organization_id,created_by_user_id")
    .eq("id", diagnosticId)
    .maybeSingle<DiagnosticOrganizationRow>();

  if (error) throw error;
  if (!diagnostic) return false;

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", diagnostic.organization_id)
    .maybeSingle<MemberRoleRow>();

  if (membershipError) throw membershipError;
  if (!membership) return false;
  const directAccess = getDiagnosticAccessDecision({
    assignedToViewer: false,
    creatorUserId: diagnostic.created_by_user_id,
    viewerRole: membership.role,
    viewerUserId: userId,
  });

  if (directAccess.canView) return true;

  const { data: person, error: personError } = await supabase
    .from("organization_people")
    .select("id")
    .eq("organization_id", diagnostic.organization_id)
    .eq("auth_user_id", userId)
    .eq("status", "ativo")
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (personError) throw personError;
  if (!person) return false;

  const { data: assignments, error: assignmentsError } = await supabase
    .from("diagnostic_leader_assignments")
    .select("diagnostic_sector_scope_id")
    .eq("organization_id", diagnostic.organization_id)
    .eq("person_id", person.id)
    .returns<Array<{ diagnostic_sector_scope_id: string }>>();

  if (assignmentsError) throw assignmentsError;
  if (assignments.length === 0) return false;

  const { count, error: scopesError } = await supabase
    .from("diagnostic_sector_scopes")
    .select("id", { count: "exact", head: true })
    .eq("diagnostic_id", diagnosticId)
    .in(
      "id",
      assignments.map((assignment) => assignment.diagnostic_sector_scope_id),
    );

  if (scopesError) throw scopesError;

  return getDiagnosticAccessDecision({
    assignedToViewer: (count ?? 0) > 0,
    creatorUserId: diagnostic.created_by_user_id,
    viewerRole: membership.role,
    viewerUserId: userId,
  }).canView;
}

export async function userCanManageDiagnostic(
  userId: string,
  diagnosticId: string,
) {
  if (!isUuid(userId) || !isUuid(diagnosticId)) return false;

  const supabase = createSupabaseAdminClient();
  const { data: diagnostic, error } = await supabase
    .from("diagnostics")
    .select("organization_id,created_by_user_id")
    .eq("id", diagnosticId)
    .maybeSingle<DiagnosticOrganizationRow>();

  if (error) throw error;
  if (!diagnostic) return false;

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", diagnostic.organization_id)
    .maybeSingle<MemberRoleRow>();

  if (membershipError) throw membershipError;

  return getDiagnosticAccessDecision({
    assignedToViewer: false,
    creatorUserId: diagnostic.created_by_user_id,
    viewerRole: membership?.role ?? null,
    viewerUserId: userId,
  }).canManage;
}

export async function getDiagnosticOrganizationId(diagnosticId: string) {
  if (!isUuid(diagnosticId)) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("diagnostics")
    .select("organization_id,created_by_user_id")
    .eq("id", diagnosticId)
    .maybeSingle<DiagnosticOrganizationRow>();

  if (error) throw error;

  return data?.organization_id ?? null;
}

export async function userCanAccessModule(userId: string, moduleId: string) {
  if (!isUuid(userId)) return false;

  const access = await getAccessibleOrganizationIdsForUser(userId);

  if (access.isSuperadmin) return false;
  if (access.organizationIds.length === 0) return false;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("organization_module_access")
    .select("organization_id,module_id,enabled")
    .eq("module_id", moduleId)
    .in("organization_id", access.organizationIds)
    .returns<OrganizationModuleAccessRow[]>();

  if (isMissingModuleAccessTableError(error)) return true;
  if (error) throw error;

  const explicitAccess = new Map(
    (data ?? []).map((row) => [row.organization_id, row.enabled]),
  );

  return access.organizationIds.some(
    (organizationId) => explicitAccess.get(organizationId) ?? true,
  );
}

async function getEnabledModuleIdsForAccess(
  access: {
    isSuperadmin: boolean;
    organizationIds: string[];
  },
) {

  if (access.isSuperadmin) return [];

  if (access.organizationIds.length === 0) return [];

  const moduleIds = adminModules.map((module) => module.id);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("organization_module_access")
    .select("organization_id,module_id,enabled")
    .in("module_id", moduleIds)
    .in("organization_id", access.organizationIds)
    .returns<OrganizationModuleAccessRow[]>();

  if (isMissingModuleAccessTableError(error)) return moduleIds;
  if (error) throw error;

  const explicitAccess = new Map(
    (data ?? []).map((row) => [
      `${row.organization_id}:${row.module_id}`,
      row.enabled,
    ]),
  );

  return moduleIds.filter((moduleId) =>
    access.organizationIds.some(
      (organizationId) =>
        explicitAccess.get(`${organizationId}:${moduleId}`) ?? true,
    ),
  );
}

export async function getEnabledModuleIdsForUser(userId: string) {
  if (!isUuid(userId)) return [];

  const access = await getAccessibleOrganizationIdsForUser(userId);

  return getEnabledModuleIdsForAccess(access);
}

export const getCurrentAppAccessContext = cache(
  async function getCurrentAppAccessContext(): Promise<{
    access: {
      isSuperadmin: boolean;
      organizationIds: string[];
      primaryOrganizationId: string | null;
    } | null;
    enabledModuleIds: string[] | undefined;
    session: AuthSession;
  } | null> {
    const session = await getCurrentAuthSession();

    if (!session) return null;
    if (session.leadershipInvitation === true) return null;

    if (session.user.role === "superadmin") {
      return {
        access: null,
        enabledModuleIds: undefined,
        session,
      };
    }

    const access = await getAccessibleOrganizationIdsForUser(session.user.id);
    const enabledModuleIds = await getEnabledModuleIdsForAccess(access);

    return {
      access,
      enabledModuleIds,
      session,
    };
  },
);
