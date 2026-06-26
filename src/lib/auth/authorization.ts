import { cache } from "react";

import { getCurrentAuthSession } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { adminModules } from "@/lib/mock-data";
import type { AuthSession } from "@/lib/contracts";

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
  },
);

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

export async function userCanAccessModule(userId: string, moduleId: string) {
  if (!isUuid(userId)) return false;

  const access = await getAccessibleOrganizationIdsForUser(userId);

  if (access.isSuperadmin) return true;
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

  if (access.isSuperadmin) {
    return adminModules.map((module) => module.id);
  }

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
