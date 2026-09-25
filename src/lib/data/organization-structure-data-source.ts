import "server-only";

import { createHash, randomBytes } from "node:crypto";

import {
  organizationSectorSchema,
  type CreateOrganizationSectorInput,
  type LeadershipInviteDisplayStatus,
  type OrganizationAccessLevel,
  type OrganizationSector,
} from "@/lib/contracts";
import { sendLeadershipInvitationEmail } from "@/lib/email/leadership-invitation-email";
import { getPublicAppUrl } from "@/lib/env";
import { maybeCreateSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";

type Supabase = NonNullable<ReturnType<typeof maybeCreateSupabaseAdminClient>>;
type SectorRow = Database["public"]["Tables"]["organization_sectors"]["Row"];
type PersonRow = Database["public"]["Tables"]["organization_people"]["Row"];
type MembershipRow = Database["public"]["Tables"]["organization_sector_memberships"]["Row"];
type InvitationRow = Database["app_private"]["Tables"]["leadership_invitations"]["Row"];

type CreateInvitationResult = {
  invitationId: string;
  personId: string;
  sectorId: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function assertNoSupabaseError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function isMissingStructureRelation(error: { code?: string } | null) {
  return error?.code === "PGRST205";
}

function createInviteToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

function invitationExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt.toISOString();
}

function accessLevelToAuthRole(accessLevel: OrganizationAccessLevel) {
  return accessLevel === "owner" ? ("cliente" as const) : ("admin" as const);
}

function authRoleToAccessLevel(
  role: Database["public"]["Enums"]["auth_role"],
): OrganizationAccessLevel {
  return role === "cliente" ? "owner" : "admin";
}

function parseCreateInvitationResult(value: Json): CreateInvitationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("O banco não retornou os dados do convite.");
  }

  const invitationId = value.invitation_id;
  const personId = value.person_id;
  const sectorId = value.sector_id;

  if (
    typeof invitationId !== "string" ||
    typeof personId !== "string" ||
    typeof sectorId !== "string"
  ) {
    throw new Error("O banco retornou um convite incompleto.");
  }

  return { invitationId, personId, sectorId };
}

function getDisplayStatus(
  sector: SectorRow,
  person: PersonRow,
  invitation: InvitationRow | undefined,
): LeadershipInviteDisplayStatus {
  if (!sector.active || person.status === "inativo") return "inativo";
  if (person.status === "ativo") return "ativo";
  if (invitation?.delivery_status === "falhou") return "envio_falhou";
  if (invitation?.delivery_status === "enviado") return "convite_enviado";
  return "convite_pendente";
}

export async function getOrganizationStructure(
  organizationId: string,
): Promise<OrganizationSector[]> {
  const supabase = maybeCreateSupabaseAdminClient();
  if (!supabase || !isUuid(organizationId)) return [];

  const [sectorsResult, peopleResult, membershipsResult, invitationsResult] =
    await Promise.all([
      supabase
        .from("organization_sectors")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true }),
      supabase
        .from("organization_people")
        .select("*")
        .eq("organization_id", organizationId),
      supabase
        .from("organization_sector_memberships")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("role", "lideranca"),
      supabase
        .schema("app_private")
        .from("leadership_invitations")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
    ]);

  if (
    [
      sectorsResult.error,
      peopleResult.error,
      membershipsResult.error,
      invitationsResult.error,
    ].some(isMissingStructureRelation)
  ) {
    return [];
  }

  assertNoSupabaseError(sectorsResult.error);
  assertNoSupabaseError(peopleResult.error);
  assertNoSupabaseError(membershipsResult.error);
  assertNoSupabaseError(invitationsResult.error);

  const peopleById = new Map(
    (peopleResult.data as PersonRow[]).map((person) => [person.id, person]),
  );
  const leadershipBySectorId = new Map(
    (membershipsResult.data as MembershipRow[]).map((membership) => [
      membership.sector_id,
      membership,
    ]),
  );
  const latestInviteBySectorId = new Map<string, InvitationRow>();

  for (const invitation of invitationsResult.data as InvitationRow[]) {
    if (!latestInviteBySectorId.has(invitation.sector_id)) {
      latestInviteBySectorId.set(invitation.sector_id, invitation);
    }
  }

  return (sectorsResult.data as SectorRow[]).flatMap((sector) => {
    const membership = leadershipBySectorId.get(sector.id);
    const person = membership ? peopleById.get(membership.person_id) : null;
    if (!person) return [];

    const invitation = latestInviteBySectorId.get(sector.id);
    return [
      organizationSectorSchema.parse({
        active: sector.active,
        createdAt: sector.created_at,
        id: sector.id,
        inviteStatus: getDisplayStatus(sector, person, invitation),
        lastInviteSentAt: invitation?.last_sent_at ?? null,
        leader: {
          accessLevel: authRoleToAccessLevel(
            invitation?.access_role ?? "admin",
          ),
          avatarUrl: person.avatar_url,
          email: person.email,
          id: person.id,
          name: person.name,
          position: person.position,
        },
        name: sector.name,
      }),
    ];
  });
}

async function markInvitationDelivery(
  supabase: Supabase,
  invitationId: string,
  result:
    | { ok: true; providerMessageId: string }
    | { ok: false; error: string },
) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .schema("app_private")
    .from("leadership_invitations")
    .update(
      result.ok
        ? {
            delivery_error: null,
            delivery_status: "enviado",
            last_sent_at: now,
            provider_message_id: result.providerMessageId,
          }
        : {
            delivery_error: result.error.slice(0, 500),
            delivery_status: "falhou",
            last_sent_at: now,
          },
    )
    .eq("id", invitationId);

  assertNoSupabaseError(error);
}

async function deliverInvitation({
  companyName,
  input,
  invitationId,
  token,
}: {
  companyName: string;
  input: CreateOrganizationSectorInput;
  invitationId: string;
  token: string;
}) {
  return sendLeadershipInvitationEmail({
    accessLevel: input.accessLevel,
    companyName,
    invitationId,
    invitationUrl: `${getPublicAppUrl()}/convites/lideranca/${token}`,
    leaderEmail: input.leaderEmail,
    leaderPosition: input.leaderPosition,
    sectorName: input.name,
  });
}

export async function createOrganizationSectorAndInvite({
  companyName,
  createdBy,
  input,
  organizationId,
}: {
  companyName: string;
  createdBy: string;
  input: CreateOrganizationSectorInput;
  organizationId: string;
}) {
  const supabase = maybeCreateSupabaseAdminClient();
  if (!supabase || !isUuid(organizationId) || !isUuid(createdBy)) {
    throw new Error("Não foi possível localizar a empresa desta conta.");
  }

  const { token, tokenHash } = createInviteToken();
  const { data, error } = await supabase
    .schema("app_private")
    .rpc("create_leadership_invitation", {
      p_access_role: accessLevelToAuthRole(input.accessLevel),
      p_created_by: createdBy,
      p_expires_at: invitationExpiry(),
      p_leader_email: input.leaderEmail,
      p_organization_id: organizationId,
      p_position: input.leaderPosition,
      p_sector_name: input.name,
      p_token_hash: tokenHash,
    });

  if (error) {
    if (error.code === "PGRST202" || error.code === "PGRST205") {
      throw new Error("A estrutura de setores ainda não foi ativada no banco.");
    }
    if (error.code === "23505") {
      throw new Error("Já existe um setor com esse nome.");
    }
    throw new Error(error.message);
  }

  const created = parseCreateInvitationResult(data);

  try {
    const delivery = await deliverInvitation({
      companyName,
      input,
      invitationId: created.invitationId,
      token,
    });
    await markInvitationDelivery(supabase, created.invitationId, {
      ok: true,
      providerMessageId: delivery.providerMessageId,
    });
    return { deliveryStatus: "enviado" as const, ...created };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível enviar o convite por e-mail.";
    await markInvitationDelivery(supabase, created.invitationId, {
      error: message,
      ok: false,
    });
    return {
      deliveryError: message,
      deliveryStatus: "falhou" as const,
      ...created,
    };
  }
}

export async function resendOrganizationLeadershipInvite({
  companyName,
  createdBy,
  organizationId,
  sectorId,
}: {
  companyName: string;
  createdBy: string;
  organizationId: string;
  sectorId: string;
}) {
  const supabase = maybeCreateSupabaseAdminClient();
  if (
    !supabase ||
    !isUuid(organizationId) ||
    !isUuid(createdBy) ||
    !isUuid(sectorId)
  ) {
    throw new Error("Não foi possível localizar o setor.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_sector_memberships")
    .select("person_id")
    .eq("organization_id", organizationId)
    .eq("sector_id", sectorId)
    .eq("role", "lideranca")
    .maybeSingle<Pick<MembershipRow, "person_id">>();
  assertNoSupabaseError(membershipError);

  if (!membership) throw new Error("O setor não possui uma liderança.");

  const { data: organizationMembership, error: organizationMembershipError } =
    await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", createdBy)
      .maybeSingle<{ role: Database["public"]["Enums"]["auth_role"] }>();
  assertNoSupabaseError(organizationMembershipError);

  if (organizationMembership?.role !== "cliente") {
    throw new Error("Apenas o Superadmin da empresa pode enviar convites.");
  }

  const [{ data: sector, error: sectorError }, { data: person, error: personError }] =
    await Promise.all([
      supabase
        .from("organization_sectors")
        .select("id,name")
        .eq("organization_id", organizationId)
        .eq("id", sectorId)
        .maybeSingle<Pick<SectorRow, "id" | "name">>(),
      supabase
        .from("organization_people")
        .select("id,email,position")
        .eq("organization_id", organizationId)
        .eq("id", membership.person_id)
        .maybeSingle<Pick<PersonRow, "email" | "id" | "position">>(),
    ]);
  assertNoSupabaseError(sectorError);
  assertNoSupabaseError(personError);
  if (!sector || !person) throw new Error("Não foi possível localizar a liderança.");

  const { data: previousInvitation, error: previousInvitationError } =
    await supabase
      .schema("app_private")
      .from("leadership_invitations")
      .select("access_role")
      .eq("organization_id", organizationId)
      .eq("sector_id", sectorId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<Pick<InvitationRow, "access_role">>();
  assertNoSupabaseError(previousInvitationError);

  const accessLevel = authRoleToAccessLevel(
    previousInvitation?.access_role ?? "admin",
  );

  const { token, tokenHash } = createInviteToken();
  const { error: revokeError } = await supabase
    .schema("app_private")
    .from("leadership_invitations")
    .update({ status: "revogado" })
    .eq("organization_id", organizationId)
    .eq("sector_id", sectorId)
    .eq("status", "pendente");
  assertNoSupabaseError(revokeError);

  const { data: invitation, error: invitationError } = await supabase
    .schema("app_private")
    .from("leadership_invitations")
    .insert({
      access_role: accessLevelToAuthRole(accessLevel),
      created_by: createdBy,
      expires_at: invitationExpiry(),
      organization_id: organizationId,
      person_id: person.id,
      sector_id: sector.id,
      token_hash: tokenHash,
    })
    .select("id")
    .single<Pick<InvitationRow, "id">>();
  assertNoSupabaseError(invitationError);
  if (!invitation) throw new Error("Não foi possível gerar um novo convite.");

  const input = {
    accessLevel,
    leaderEmail: person.email,
    leaderPosition: person.position,
    name: sector.name,
  } satisfies CreateOrganizationSectorInput;

  try {
    const delivery = await deliverInvitation({
      companyName,
      input,
      invitationId: invitation.id,
      token,
    });
    await markInvitationDelivery(supabase, invitation.id, {
      ok: true,
      providerMessageId: delivery.providerMessageId,
    });
    return { deliveryStatus: "enviado" as const };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível reenviar o convite por e-mail.";
    await markInvitationDelivery(supabase, invitation.id, {
      error: message,
      ok: false,
    });
    return { deliveryError: message, deliveryStatus: "falhou" as const };
  }
}

export type LeadershipInvitationPreview = {
  accessLevel: OrganizationAccessLevel;
  companyName: string;
  expiresAt: string;
  leaderEmail: string;
  leaderPosition: string;
  sectorName: string;
};

export async function acceptLeadershipInvitation({
  token,
  userId,
}: {
  token: string;
  userId: string;
}) {
  const supabase = maybeCreateSupabaseAdminClient();

  if (
    !supabase ||
    token.length < 32 ||
    token.length > 128 ||
    !isUuid(userId)
  ) {
    throw new Error("Não foi possível confirmar este convite.");
  }

  const { data, error } = await supabase
    .schema("app_private")
    .rpc("accept_leadership_invitation", {
      p_token_hash: createHash("sha256").update(token).digest("hex"),
      p_user_id: userId,
    });

  if (error) {
    if (
      error.code === "PGRST202" ||
      /leadership_invitation_(unavailable|email_mismatch)/i.test(error.message)
    ) {
      throw new Error("O convite expirou ou não corresponde à conta Google.");
    }

    throw new Error(error.message);
  }

  return data;
}

export async function getLeadershipInvitationPreview(
  token: string,
): Promise<LeadershipInvitationPreview | null> {
  const supabase = maybeCreateSupabaseAdminClient();
  if (!supabase || token.length < 32 || token.length > 128) return null;

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data: invitation, error: invitationError } = await supabase
    .schema("app_private")
    .from("leadership_invitations")
    .select("organization_id,sector_id,person_id,access_role,expires_at,status")
    .eq("token_hash", tokenHash)
    .maybeSingle<
      Pick<
        InvitationRow,
        | "access_role"
        | "expires_at"
        | "organization_id"
        | "person_id"
        | "sector_id"
        | "status"
      >
    >();
  assertNoSupabaseError(invitationError);

  if (
    !invitation ||
    invitation.status !== "pendente" ||
    new Date(invitation.expires_at).getTime() <= Date.now()
  ) {
    return null;
  }

  const [organizationResult, sectorResult, personResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("name")
      .eq("id", invitation.organization_id)
      .maybeSingle<{ name: string }>(),
    supabase
      .from("organization_sectors")
      .select("name")
      .eq("organization_id", invitation.organization_id)
      .eq("id", invitation.sector_id)
      .maybeSingle<{ name: string }>(),
    supabase
      .from("organization_people")
      .select("email,position")
      .eq("organization_id", invitation.organization_id)
      .eq("id", invitation.person_id)
      .maybeSingle<{ email: string; position: string }>(),
  ]);
  assertNoSupabaseError(organizationResult.error);
  assertNoSupabaseError(sectorResult.error);
  assertNoSupabaseError(personResult.error);

  if (!organizationResult.data || !sectorResult.data || !personResult.data) {
    return null;
  }

  return {
    accessLevel: authRoleToAccessLevel(invitation.access_role),
    companyName: organizationResult.data.name,
    expiresAt: invitation.expires_at,
    leaderEmail: personResult.data.email,
    leaderPosition: personResult.data.position,
    sectorName: sectorResult.data.name,
  };
}
