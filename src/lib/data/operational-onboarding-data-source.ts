import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";

import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { getCurrentAuthSession } from "@/lib/auth/session";
import {
  operationalMemberRegistrationInputSchema,
  operationalMemberRegistrationWorkspaceSchema,
  operationalMemberSchema,
  operationalOnboardingWorkspaceSchema,
  type OperationalMember,
  type OperationalMemberRegistrationWorkspace,
  type OperationalOnboardingWorkspace,
} from "@/lib/contracts";
import { getPublicAppUrl } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type OrganizationRow =
  Database["public"]["Tables"]["organizations"]["Row"];
type OperationalOnboardingLinkRow =
  Database["public"]["Tables"]["operational_onboarding_links"]["Row"];
type OperationalMemberRow =
  Database["public"]["Tables"]["operational_members"]["Row"];

type Supabase = ReturnType<typeof createSupabaseAdminClient>;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return uuidPattern.test(value);
}

export class OperationalOnboardingRequiredError extends Error {
  constructor() {
    super("Cadastre as pessoas da operação antes de iniciar o diagnóstico.");
    this.name = "OperationalOnboardingRequiredError";
  }
}

export class OperationalMemberDomainError extends Error {
  constructor() {
    super("Este link aceita apenas e-mails com o domínio autorizado da empresa.");
    this.name = "OperationalMemberDomainError";
  }
}

export function isOperationalOnboardingRequiredError(
  error: unknown,
): error is OperationalOnboardingRequiredError {
  return error instanceof OperationalOnboardingRequiredError;
}

function assertNoSupabaseError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function isMissingOperationalOnboardingSchemaError(
  error: { message: string } | null,
) {
  return (
    Boolean(error) &&
    /operational_onboarding|operational_members|schema cache|could not find|column .*operational_/i.test(
      error?.message ?? "",
    )
  );
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getEmailDomain(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const match = normalizedEmail.match(/^[^\s@]+@([^\s@]+\.[^\s@]+)$/);

  return match?.[1]?.trim().toLowerCase() ?? null;
}

function normalizeDomain(domain: string | null | undefined) {
  const normalized = domain?.trim().toLowerCase() ?? "";

  return normalized || null;
}

function createOnboardingToken(organizationId: string) {
  const entropy = randomBytes(24).toString("base64url");
  const digest = createHash("sha256")
    .update(`${organizationId}:${entropy}`)
    .digest("base64url")
    .slice(0, 18);

  return `op_${digest}_${entropy}`;
}

function toOperationalMember(row: OperationalMemberRow): OperationalMember {
  return operationalMemberSchema.parse({
    area: row.area,
    email: normalizeEmail(row.email),
    id: row.id,
    name: row.name,
    operationalRole: row.operational_role,
    organizationId: row.organization_id,
    participatesInAreaDecisions: row.participates_in_area_decisions,
    perceivedResponsibilities: row.perceived_responsibilities,
    status: row.status,
    submittedAt: row.submitted_at,
  });
}

function hasMinimumApprovedOperationalMember({
  authorizedDomain,
  members,
}: {
  authorizedDomain: string | null;
  members: OperationalMember[];
}) {
  if (!authorizedDomain) return false;

  return members.some(
    (member) =>
      member.status === "aprovado" &&
      Boolean(member.name.trim()) &&
      Boolean(member.email.trim()) &&
      Boolean(member.area.trim()) &&
      Boolean(member.operationalRole.trim()),
  );
}

async function getOrganizationForUser(
  userId: string,
): Promise<OrganizationRow | null> {
  const access = await getAccessibleOrganizationIdsForUser(userId);
  const organizationId = access.primaryOrganizationId;

  if (!organizationId) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("organizations")
    .select(
      "id,name,employee_count,domain,operational_onboarding_required,operational_onboarding_completed_at,created_at,updated_at",
    )
    .eq("id", organizationId)
    .maybeSingle<OrganizationRow>();

  if (isMissingOperationalOnboardingSchemaError(error)) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("organizations")
      .select("id,name,employee_count,domain,created_at,updated_at")
      .eq("id", organizationId)
      .maybeSingle<
        Omit<
          OrganizationRow,
          | "operational_onboarding_completed_at"
          | "operational_onboarding_required"
        >
      >();

    assertNoSupabaseError(fallbackError);

    return fallbackData
      ? {
          ...fallbackData,
          operational_onboarding_completed_at: null,
          operational_onboarding_required: false,
        }
      : null;
  }

  assertNoSupabaseError(error);

  return data ?? null;
}

async function getActiveLink({
  organizationId,
  supabase,
}: {
  organizationId: string;
  supabase: Supabase;
}) {
  const { data, error } = await supabase
    .from("operational_onboarding_links")
    .select("id,organization_id,token,created_by,created_at,disabled_at")
    .eq("organization_id", organizationId)
    .is("disabled_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<OperationalOnboardingLinkRow>();

  if (isMissingOperationalOnboardingSchemaError(error)) return null;

  assertNoSupabaseError(error);

  return data ?? null;
}

async function ensureActiveLink({
  organizationId,
  supabase,
  userId,
}: {
  organizationId: string;
  supabase: Supabase;
  userId: string;
}) {
  const existingLink = await getActiveLink({ organizationId, supabase });

  if (existingLink) return existingLink;

  const missingSchemaError = new Error(
    "A migration do onboarding operacional ainda não foi aplicada.",
  );

  const { data, error } = await supabase
    .from("operational_onboarding_links")
    .insert({
      created_by: userId,
      organization_id: organizationId,
      token: createOnboardingToken(organizationId),
    })
    .select("id,organization_id,token,created_by,created_at,disabled_at")
    .single<OperationalOnboardingLinkRow>();

  if (isMissingOperationalOnboardingSchemaError(error)) throw missingSchemaError;

  assertNoSupabaseError(error);

  if (!data) {
    throw new Error("Não foi possível gerar o link de cadastro.");
  }

  return data;
}

async function listOperationalMembers({
  organizationId,
  supabase,
}: {
  organizationId: string;
  supabase: Supabase;
}) {
  const { data, error } = await supabase
    .from("operational_members")
    .select(
      "id,organization_id,onboarding_link_id,name,email,normalized_email,area,operational_role,perceived_responsibilities,participates_in_area_decisions,status,submitted_at,reviewed_at,reviewed_by,rejection_reason",
    )
    .eq("organization_id", organizationId)
    .order("submitted_at", { ascending: false })
    .returns<OperationalMemberRow[]>();

  if (isMissingOperationalOnboardingSchemaError(error)) return [];

  assertNoSupabaseError(error);

  return (data ?? []).map(toOperationalMember);
}

export async function getOperationalMembersForOrganization(
  organizationId: string,
) {
  if (!isUuid(organizationId)) return [];

  const supabase = createSupabaseAdminClient();

  return listOperationalMembers({ organizationId, supabase });
}

export const getCurrentOperationalOnboardingWorkspace = cache(
  async function getCurrentOperationalOnboardingWorkspace(): Promise<OperationalOnboardingWorkspace | null> {
    const session = await getCurrentAuthSession();

    if (!session || session.user.role === "superadmin") return null;

    const organization = await getOrganizationForUser(session.user.id);

    if (!organization) return null;

    const supabase = createSupabaseAdminClient();
    const authorizedDomain =
      normalizeDomain(organization.domain) ?? getEmailDomain(session.user.email);

    if (!normalizeDomain(organization.domain) && authorizedDomain) {
      await supabase
        .from("organizations")
        .update({ domain: authorizedDomain })
        .eq("id", organization.id)
        .is("domain", null);
    }

    let link: OperationalOnboardingLinkRow | null = null;
    const members = await listOperationalMembers({
      organizationId: organization.id,
      supabase,
    });

    try {
      link = await ensureActiveLink({
        organizationId: organization.id,
        supabase,
        userId: session.user.id,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        /migration do onboarding operacional/i.test(error.message)
      ) {
        return null;
      }

      throw error;
    }

    const publicUrl = `${getPublicAppUrl()}/o/${link.token}`;

    return operationalOnboardingWorkspaceSchema.parse({
      authorizedDomain: authorizedDomain ?? "",
      hasMinimumApprovedMember: hasMinimumApprovedOperationalMember({
        authorizedDomain,
        members,
      }),
      members,
      organizationId: organization.id,
      organizationName: organization.name,
      previewPath: `/o/${link.token}`,
      publicUrl,
      required: organization.operational_onboarding_required,
    });
  },
);

export async function getOperationalOnboardingGateForCurrentUser() {
  const workspace = await getCurrentOperationalOnboardingWorkspace();

  return {
    required:
      Boolean(workspace?.required) && !workspace?.hasMinimumApprovedMember,
    workspace,
  };
}

export async function assertOperationalOnboardingAllowsAssessment(
  organizationId: string,
) {
  const supabase = createSupabaseAdminClient();
  const { data: organization, error } = await supabase
    .from("organizations")
    .select(
      "id,name,employee_count,domain,operational_onboarding_required,operational_onboarding_completed_at,created_at,updated_at",
    )
    .eq("id", organizationId)
    .maybeSingle<OrganizationRow>();

  if (isMissingOperationalOnboardingSchemaError(error)) return;

  assertNoSupabaseError(error);

  if (!organization?.operational_onboarding_required) return;

  const authorizedDomain = normalizeDomain(organization.domain);
  const members = await listOperationalMembers({ organizationId, supabase });

  if (
    !hasMinimumApprovedOperationalMember({
      authorizedDomain,
      members,
    })
  ) {
    throw new OperationalOnboardingRequiredError();
  }
}

export async function deleteCurrentOperationalMember(memberId: string) {
  const session = await getCurrentAuthSession();

  if (!session || session.user.role === "superadmin") {
    throw new Error("Sessão necessária.");
  }

  const organization = await getOrganizationForUser(session.user.id);

  if (!organization) {
    throw new Error("Organização não encontrada para este usuário.");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("operational_members")
    .delete()
    .eq("id", memberId)
    .eq("organization_id", organization.id)
    .select("id")
    .maybeSingle<{ id: string }>();

  assertNoSupabaseError(error);

  if (!data) {
    throw new Error("Pessoa não encontrada.");
  }

  return { memberId: data.id };
}

export async function getOperationalMemberRegistrationWorkspace(
  token: string,
): Promise<OperationalMemberRegistrationWorkspace | null> {
  const supabase = createSupabaseAdminClient();
  const { data: link, error: linkError } = await supabase
    .from("operational_onboarding_links")
    .select("id,organization_id,token,created_by,created_at,disabled_at")
    .eq("token", token)
    .is("disabled_at", null)
    .maybeSingle<OperationalOnboardingLinkRow>();

  if (isMissingOperationalOnboardingSchemaError(linkError)) return null;

  assertNoSupabaseError(linkError);

  if (!link) return null;

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select(
      "id,name,employee_count,domain,operational_onboarding_required,operational_onboarding_completed_at,created_at,updated_at",
    )
    .eq("id", link.organization_id)
    .maybeSingle<OrganizationRow>();

  if (isMissingOperationalOnboardingSchemaError(organizationError)) return null;

  assertNoSupabaseError(organizationError);

  const authorizedDomain = normalizeDomain(organization?.domain);

  if (!organization || !authorizedDomain) return null;

  return operationalMemberRegistrationWorkspaceSchema.parse({
    authorizedDomain,
    organizationName: organization.name,
    token: link.token,
  });
}

export async function submitOperationalMemberRegistration(
  input: unknown,
) {
  const parsed = operationalMemberRegistrationInputSchema.parse(input);
  const workspace = await getOperationalMemberRegistrationWorkspace(parsed.token);

  if (!workspace) {
    throw new Error("Este link não é válido ou foi desativado.");
  }

  if (getEmailDomain(parsed.email) !== workspace.authorizedDomain) {
    throw new OperationalMemberDomainError();
  }

  const supabase = createSupabaseAdminClient();
  const { data: link, error: linkError } = await supabase
    .from("operational_onboarding_links")
    .select("id,organization_id,token,created_by,created_at,disabled_at")
    .eq("token", parsed.token)
    .is("disabled_at", null)
    .single<OperationalOnboardingLinkRow>();

  assertNoSupabaseError(linkError);

  if (!link) {
    throw new Error("Este link não é válido ou foi desativado.");
  }

  const { data, error } = await supabase
    .from("operational_members")
    .upsert(
      {
        area: parsed.area,
        email: normalizeEmail(parsed.email),
        name: parsed.name,
        onboarding_link_id: link.id,
        operational_role: parsed.operationalRole,
        organization_id: link.organization_id,
        participates_in_area_decisions: parsed.participatesInAreaDecisions,
        perceived_responsibilities: parsed.perceivedResponsibilities,
        status: "aprovado",
      },
      { onConflict: "organization_id,normalized_email" },
    )
    .select(
      "id,organization_id,onboarding_link_id,name,email,normalized_email,area,operational_role,perceived_responsibilities,participates_in_area_decisions,status,submitted_at,reviewed_at,reviewed_by,rejection_reason",
    )
    .single<OperationalMemberRow>();

  assertNoSupabaseError(error);

  if (!data) {
    throw new Error("Não foi possível registrar a pessoa.");
  }

  return toOperationalMember(data);
}
