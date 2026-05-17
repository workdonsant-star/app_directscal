import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

import {
  acquisitionCampaignSchema,
  acquisitionSubmissionInputSchema,
  authUserSchema,
  leadSchema,
  type AcquisitionAccountProvider,
  type AcquisitionCampaign,
  type AcquisitionSubmissionInput,
  type AuthUser,
  type Lead,
} from "@/lib/contracts";
import {
  buildAdminDataSnapshot,
  sortAcquisitionFields,
  type AdminDataSnapshot,
} from "@/lib/data/admin-data-source";
import {
  hashPasswordCredential,
  verifyPasswordCredential,
} from "@/lib/auth/password-credentials";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";

type Supabase = ReturnType<typeof createSupabaseAdminClient>;
type CampaignRow = Database["public"]["Tables"]["acquisition_campaigns"]["Row"];
type CampaignFieldRow =
  Database["public"]["Tables"]["acquisition_campaign_fields"]["Row"];
type LeadRow = Database["public"]["Tables"]["acquisition_leads"]["Row"];
type OrganizationRow = Pick<
  Database["public"]["Tables"]["organizations"]["Row"],
  "id" | "name"
>;
type NextAuthUserRow = Pick<
  Database["next_auth"]["Tables"]["users"]["Row"],
  "email" | "id" | "image" | "name"
>;

export const acquisitionOauthIntentCookieName =
  "directscal_campaign_intent";
export const acquisitionOauthIntentMaxAge = 60 * 15;

const accountConflictMessage =
  "Este e-mail já tem acesso ativo. Entre pela tela de login.";
const sessionMismatchMessage =
  "Entre novamente com Google para continuar.";

export class AcquisitionAccountConflictError extends Error {
  constructor(message = accountConflictMessage) {
    super(message);
    this.name = "AcquisitionAccountConflictError";
  }
}

export class AcquisitionSessionMismatchError extends Error {
  constructor(message = sessionMismatchMessage) {
    super(message);
    this.name = "AcquisitionSessionMismatchError";
  }
}

export function isAcquisitionAccountConflictError(
  error: unknown,
): error is AcquisitionAccountConflictError {
  return error instanceof AcquisitionAccountConflictError;
}

export function isAcquisitionSessionMismatchError(
  error: unknown,
): error is AcquisitionSessionMismatchError {
  return error instanceof AcquisitionSessionMismatchError;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getFallbackName(email: string) {
  const [localPart] = email.split("@");

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hashIntentToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createIntentToken() {
  return randomBytes(32).toString("base64url");
}

function assertNoSupabaseError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function jsonToStringArray(value: Json | null): string[] | null {
  if (!Array.isArray(value)) return null;

  const options = value.filter(
    (item): item is string => typeof item === "string" && item.trim() !== "",
  );

  return options.length > 0 ? options : null;
}

function jsonToStringRecord(value: Json): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.entries(value).reduce<Record<string, string>>(
    (acc, [key, entry]) => {
      if (typeof entry === "string") acc[key] = entry;
      return acc;
    },
    {},
  );
}

function normalizeValues(values: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value.trim()]),
  );
}

function toCampaign(
  row: CampaignRow,
  fieldRows: CampaignFieldRow[],
): AcquisitionCampaign {
  const fields = fieldRows
    .filter((field) => field.campaign_id === row.id)
    .map((field) => ({
      id: field.id,
      label: field.label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder,
      options: jsonToStringArray(field.options),
      order: field.order_index,
    }));

  return acquisitionCampaignSchema.parse({
    id: row.id,
    moduleId: row.module_id,
    name: row.name,
    source: row.source,
    status: row.status,
    token: row.token,
    publicPath: row.public_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    visits: row.visits,
    fields: sortAcquisitionFields(fields),
  });
}

function toLead(row: LeadRow, campaign?: AcquisitionCampaign): Lead {
  return leadSchema.parse({
    id: row.id,
    moduleId: row.module_id,
    campaignId: row.campaign_id,
    campaignName: campaign?.name ?? row.campaign_id,
    source: campaign?.source ?? "Origem não informada",
    name: row.name,
    email: normalizeEmail(row.email),
    phone: row.phone,
    role: row.role,
    companyName: row.company_name,
    companySize: row.company_size,
    objective: row.objective,
    createdAt: row.created_at,
    fieldValues: jsonToStringRecord(row.field_values),
    status: row.status,
    accountProvider: row.account_provider,
    userId: row.user_id,
    organizationId: row.organization_id,
  });
}

async function listCampaigns(supabase: Supabase) {
  const { data: campaignRows, error: campaignError } = await supabase
    .from("acquisition_campaigns")
    .select("*")
    .order("updated_at", { ascending: false });

  assertNoSupabaseError(campaignError);

  const campaignIds = (campaignRows ?? []).map((campaign) => campaign.id);
  const { data: fieldRows, error: fieldsError } =
    campaignIds.length > 0
      ? await supabase
          .from("acquisition_campaign_fields")
          .select("*")
          .in("campaign_id", campaignIds)
          .order("order_index", { ascending: true })
      : { data: [], error: null };

  assertNoSupabaseError(fieldsError);

  return (campaignRows ?? []).map((campaign) =>
    toCampaign(campaign, fieldRows ?? []),
  );
}

export async function getAdminAcquisitionSnapshot(): Promise<AdminDataSnapshot> {
  const supabase = createSupabaseAdminClient();
  const campaigns = await listCampaigns(supabase);
  const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));

  const { data: leadRows, error: leadsError } = await supabase
    .from("acquisition_leads")
    .select("*")
    .order("created_at", { ascending: false });

  assertNoSupabaseError(leadsError);

  const leads = (leadRows ?? []).map((lead) =>
    toLead(lead, campaignsById.get(lead.campaign_id)),
  );

  return buildAdminDataSnapshot({ campaigns, leads });
}

export async function getAcquisitionCampaignByToken(token: string) {
  const supabase = createSupabaseAdminClient();
  const normalizedToken = token.trim();

  const { data: campaignRow, error: campaignError } = await supabase
    .from("acquisition_campaigns")
    .select("*")
    .eq("token", normalizedToken)
    .maybeSingle();

  assertNoSupabaseError(campaignError);

  if (!campaignRow) return null;

  const { data: fieldRows, error: fieldsError } = await supabase
    .from("acquisition_campaign_fields")
    .select("*")
    .eq("campaign_id", campaignRow.id)
    .order("order_index", { ascending: true });

  assertNoSupabaseError(fieldsError);

  return toCampaign(campaignRow, fieldRows ?? []);
}

export async function saveAcquisitionCampaignToSupabase(
  campaign: AcquisitionCampaign,
) {
  const parsed = acquisitionCampaignSchema.parse({
    ...campaign,
    publicPath: `/a/${campaign.token}`,
    updatedAt: new Date().toISOString(),
    fields: sortAcquisitionFields(campaign.fields).map((field, index) => ({
      ...field,
      order: index,
    })),
  });
  const supabase = createSupabaseAdminClient();

  const { error: campaignError } = await supabase
    .from("acquisition_campaigns")
    .upsert(
      {
        id: parsed.id,
        module_id: parsed.moduleId,
        name: parsed.name,
        public_path: parsed.publicPath,
        source: parsed.source,
        status: parsed.status,
        token: parsed.token,
        visits: parsed.visits,
      },
      { onConflict: "id" },
    );

  assertNoSupabaseError(campaignError);

  const { error: deleteFieldsError } = await supabase
    .from("acquisition_campaign_fields")
    .delete()
    .eq("campaign_id", parsed.id);

  assertNoSupabaseError(deleteFieldsError);

  const { error: fieldsError } = await supabase
    .from("acquisition_campaign_fields")
    .insert(
      parsed.fields.map((field) => ({
        campaign_id: parsed.id,
        id: field.id,
        label: field.label,
        options: field.options,
        order_index: field.order,
        placeholder: field.placeholder,
        required: field.required,
        type: field.type,
      })),
    );

  assertNoSupabaseError(fieldsError);

  return parsed;
}

function valueByField(
  campaign: AcquisitionCampaign,
  values: Record<string, string>,
  candidates: string[],
) {
  for (const candidate of candidates) {
    const value = values[candidate]?.trim();
    if (value) return value;
  }

  const matchingField = campaign.fields.find((field) =>
    candidates.some((candidate) =>
      field.label.toLowerCase().includes(candidate.replace("_", " ")),
    ),
  );

  return matchingField ? values[matchingField.id]?.trim() || null : null;
}

function validateCampaignValues(
  campaign: AcquisitionCampaign,
  rawValues: Record<string, string>,
) {
  const values = normalizeValues(rawValues);

  for (const field of campaign.fields) {
    const value = values[field.id]?.trim() ?? "";

    if (field.required && !value) {
      throw new Error(`Preencha o campo ${field.label}.`);
    }
  }

  const email = valueByField(campaign, values, ["email", "e-mail"]);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Informe um e-mail profissional válido.");
  }

  const companyName = valueByField(campaign, values, ["empresa", "company"]);
  if (!companyName) {
    throw new Error("Informe o nome da empresa.");
  }

  return {
    companyName,
    companySize: valueByField(campaign, values, [
      "tamanho_empresa",
      "tamanho",
    ]),
    email: normalizeEmail(email),
    name:
      valueByField(campaign, values, ["nome", "name"]) ??
      getFallbackName(email),
    objective: valueByField(campaign, values, ["objetivo", "desafio"]),
    phone: valueByField(campaign, values, ["whatsapp", "telefone", "phone"]),
    role: valueByField(campaign, values, ["cargo", "role"]),
    values,
  };
}

function employeeCountFromCompanySize(companySize: string | null) {
  if (!companySize) return 1;
  if (/mais de\s+500/i.test(companySize)) return 501;

  const numbers = companySize.match(/\d+/g)?.map(Number) ?? [];

  return Math.max(...numbers, 1);
}

async function findOrCreateOrganization({
  companyName,
  companySize,
  supabase,
}: {
  companyName: string;
  companySize: string | null;
  supabase: Supabase;
}) {
  const { data: existingOrganizations, error: organizationSelectError } =
    await supabase
      .from("organizations")
      .select("id,name")
      .eq("name", companyName)
      .limit(1);

  assertNoSupabaseError(organizationSelectError);

  const existingOrganization = existingOrganizations?.[0] as
    | OrganizationRow
    | undefined;

  if (existingOrganization) return existingOrganization.id;

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .insert({
      employee_count: employeeCountFromCompanySize(companySize),
      name: companyName,
    })
    .select("id")
    .single();

  assertNoSupabaseError(organizationError);

  if (!organization) {
    throw new Error("Não foi possível criar a empresa.");
  }

  return organization.id;
}

async function ensureClientMembership({
  organizationId,
  supabase,
  userId,
}: {
  organizationId: string;
  supabase: Supabase;
  userId: string;
}) {
  const { error } = await supabase.from("organization_members").upsert(
    {
      organization_id: organizationId,
      role: "cliente",
      user_id: userId,
    },
    {
      onConflict: "organization_id,user_id",
    },
  );

  assertNoSupabaseError(error);
}

async function findNextAuthUserByEmail({
  email,
  supabase,
}: {
  email: string;
  supabase: Supabase;
}) {
  const normalizedEmail = normalizeEmail(email);
  const { data: users, error } = await supabase
    .schema("next_auth")
    .from("users")
    .select("id,name,email,image")
    .ilike("email", normalizedEmail)
    .limit(2)
    .returns<NextAuthUserRow[]>();

  assertNoSupabaseError(error);

  if ((users?.length ?? 0) > 1) {
    throw new AcquisitionAccountConflictError(
      "Este e-mail já tem cadastros duplicados. Fale com a equipe Directscal.",
    );
  }

  return users?.[0] ?? null;
}

async function updateNextAuthUserProfile({
  email,
  name,
  supabase,
  user,
}: {
  email: string;
  name: string;
  supabase: Supabase;
  user: NextAuthUserRow;
}) {
  const normalizedEmail = normalizeEmail(email);
  const updates: Partial<Pick<NextAuthUserRow, "email" | "name">> = {};

  if (!user.email || user.email !== normalizedEmail) {
    updates.email = normalizedEmail;
  }

  if (!user.name && name.trim()) {
    updates.name = name.trim();
  }

  if (Object.keys(updates).length === 0) return user;

  const { data: updatedUser, error } = await supabase
    .schema("next_auth")
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select("id,name,email,image")
    .single<NextAuthUserRow>();

  assertNoSupabaseError(error);

  return updatedUser ?? { ...user, ...updates };
}

async function findOrCreateNextAuthUser({
  email,
  existingUser,
  name,
  supabase,
}: {
  email: string;
  existingUser?: NextAuthUserRow | null;
  name: string;
  supabase: Supabase;
}) {
  const normalizedEmail = normalizeEmail(email);

  if (existingUser) {
    return updateNextAuthUserProfile({
      email: normalizedEmail,
      name,
      supabase,
      user: existingUser,
    });
  }

  const { data: createdUser, error: createdUserError } = await supabase
    .schema("next_auth")
    .from("users")
    .insert({
      email: normalizedEmail,
      name,
    })
    .select("id,name,email,image")
    .single<NextAuthUserRow>();

  assertNoSupabaseError(createdUserError);

  if (!createdUser) {
    throw new Error("Não foi possível criar o usuário.");
  }

  return createdUser;
}

async function userHasActiveAccess({
  supabase,
  userId,
}: {
  supabase: Supabase;
  userId: string;
}) {
  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  assertNoSupabaseError(memberError);
  if (member?.id) return true;

  const { data: lead, error: leadError } = await supabase
    .from("acquisition_leads")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "account_created")
    .limit(1)
    .maybeSingle();

  assertNoSupabaseError(leadError);

  return Boolean(lead?.id);
}

async function assertNextAuthUserMatchesEmail({
  email,
  name,
  supabase,
  userId,
}: {
  email: string;
  name: string;
  supabase: Supabase;
  userId: string;
}) {
  const normalizedEmail = normalizeEmail(email);
  const { data: user, error } = await supabase
    .schema("next_auth")
    .from("users")
    .select("id,name,email,image")
    .eq("id", userId)
    .maybeSingle<NextAuthUserRow>();

  assertNoSupabaseError(error);

  if (!user?.email || normalizeEmail(user.email) !== normalizedEmail) {
    throw new AcquisitionSessionMismatchError();
  }

  return updateNextAuthUserProfile({
    email: normalizedEmail,
    name,
    supabase,
    user,
  });
}

async function setPasswordCredential({
  password,
  supabase,
  userId,
}: {
  password: string;
  supabase: Supabase;
  userId: string;
}) {
  const { error } = await supabase
    .schema("app_private")
    .from("user_password_credentials")
    .upsert(
      {
        password_hash: hashPasswordCredential(password),
        user_id: userId,
      },
      { onConflict: "user_id" },
    );

  assertNoSupabaseError(error);
}

async function upsertLead({
  accountProvider,
  campaign,
  leadData,
  organizationId,
  status,
  supabase,
  userId,
}: {
  accountProvider: AcquisitionAccountProvider;
  campaign: AcquisitionCampaign;
  leadData: ReturnType<typeof validateCampaignValues>;
  organizationId: string;
  status: "account_created" | "pending_company";
  supabase: Supabase;
  userId: string;
}) {
  const { data: leadRow, error: leadError } = await supabase
    .from("acquisition_leads")
    .upsert(
      {
        account_provider: accountProvider,
        campaign_id: campaign.id,
        company_name: leadData.companyName,
        company_size: leadData.companySize,
        email: leadData.email,
        field_values: leadData.values,
        module_id: campaign.moduleId,
        name: leadData.name,
        objective: leadData.objective,
        organization_id: organizationId,
        phone: leadData.phone,
        role: leadData.role,
        status,
        user_id: userId,
      },
      { onConflict: "campaign_id,normalized_email" },
    )
    .select("*")
    .single();

  assertNoSupabaseError(leadError);

  if (!leadRow) {
    throw new Error("Não foi possível registrar o lead.");
  }

  return toLead(leadRow, campaign);
}

export async function registerAcquisitionPasswordUser(
  input: AcquisitionSubmissionInput & { password: string },
) {
  const parsedInput = acquisitionSubmissionInputSchema
    .extend({ password: z.string().min(8) })
    .parse(input);

  const campaign = await getAcquisitionCampaignByToken(parsedInput.token);
  if (!campaign || campaign.status !== "ativo") {
    throw new Error("Campanha indisponível.");
  }

  const leadData = validateCampaignValues(campaign, parsedInput.values);
  const supabase = createSupabaseAdminClient();
  const existingUser = await findNextAuthUserByEmail({
    email: leadData.email,
    supabase,
  });

  if (
    existingUser &&
    (await userHasActiveAccess({ supabase, userId: existingUser.id }))
  ) {
    throw new AcquisitionAccountConflictError();
  }

  const user = await findOrCreateNextAuthUser({
    email: leadData.email,
    existingUser,
    name: leadData.name,
    supabase,
  });
  const organizationId = await findOrCreateOrganization({
    companyName: leadData.companyName,
    companySize: leadData.companySize,
    supabase,
  });

  await ensureClientMembership({
    organizationId,
    supabase,
    userId: user.id,
  });
  await setPasswordCredential({
    password: parsedInput.password,
    supabase,
    userId: user.id,
  });

  const lead = await upsertLead({
    accountProvider: "password",
    campaign,
    leadData,
    organizationId,
    status: "account_created",
    supabase,
    userId: user.id,
  });

  return { campaign, lead, user };
}

export async function authenticateAcquisitionPasswordUser({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthUser | null> {
  const supabase = createSupabaseAdminClient();
  const user = await findNextAuthUserByEmail({ email, supabase });

  if (!user?.email) return null;

  const { data: credential, error: credentialError } = await supabase
    .schema("app_private")
    .from("user_password_credentials")
    .select("password_hash")
    .eq("user_id", user.id)
    .maybeSingle();

  assertNoSupabaseError(credentialError);

  if (
    !credential?.password_hash ||
    !verifyPasswordCredential(password, credential.password_hash)
  ) {
    return null;
  }

  return resolveAcquisitionAuthUser(user.id, user.email);
}

export async function resolveAcquisitionAuthUser(
  userId?: string | null,
  email?: string | null,
): Promise<AuthUser | null> {
  if (!userId && !email) return null;

  const supabase = createSupabaseAdminClient();
  let resolvedUserId = userId ?? null;
  let resolvedEmail = email ? normalizeEmail(email) : null;
  let resolvedName: string | null = null;
  let resolvedImage: string | null = null;

  if (!resolvedUserId && resolvedEmail) {
    const { data: user, error } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id,name,email,image")
      .eq("email", resolvedEmail)
      .maybeSingle<NextAuthUserRow>();

    assertNoSupabaseError(error);

    resolvedUserId = user?.id ?? null;
    resolvedName = user?.name ?? null;
    resolvedImage = user?.image ?? null;
  } else if (resolvedUserId) {
    const { data: user, error } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id,name,email,image")
      .eq("id", resolvedUserId)
      .maybeSingle<NextAuthUserRow>();

    assertNoSupabaseError(error);

    resolvedEmail = user?.email ? normalizeEmail(user.email) : resolvedEmail;
    resolvedName = user?.name ?? null;
    resolvedImage = user?.image ?? null;
  }

  if (!resolvedUserId || !resolvedEmail) return null;

  const leadQuery = supabase
    .from("acquisition_leads")
    .select("*")
    .eq("status", "account_created")
    .order("updated_at", { ascending: false })
    .limit(1);
  const { data: leadRows, error: leadError } = resolvedUserId
    ? await leadQuery.eq("user_id", resolvedUserId)
    : await leadQuery.eq("email", resolvedEmail);

  assertNoSupabaseError(leadError);

  const lead = leadRows?.[0];
  if (!lead) return null;

  let company = lead.company_name;

  if (lead.organization_id) {
    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .select("id,name")
      .eq("id", lead.organization_id)
      .maybeSingle<OrganizationRow>();

    assertNoSupabaseError(organizationError);

    company = organization?.name ?? company;
  }

  const parsedUser = authUserSchema.safeParse({
    company,
    email: resolvedEmail,
    id: resolvedUserId,
    image: resolvedImage,
    name: resolvedName?.trim() || lead.name || getFallbackName(resolvedEmail),
    role: "cliente",
  });

  return parsedUser.success ? parsedUser.data : null;
}

export async function createAcquisitionOauthIntent(token: string) {
  const campaign = await getAcquisitionCampaignByToken(token);

  if (!campaign || campaign.status !== "ativo") {
    throw new Error("Campanha indisponível.");
  }

  const rawToken = createIntentToken();
  const expiresAt = new Date(
    Date.now() + acquisitionOauthIntentMaxAge * 1000,
  ).toISOString();
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .schema("app_private")
    .from("acquisition_oauth_intents")
    .insert({
      campaign_id: campaign.id,
      expires_at: expiresAt,
      token_hash: hashIntentToken(rawToken),
    });

  assertNoSupabaseError(error);

  await supabase
    .from("acquisition_campaigns")
    .update({ visits: campaign.visits + 1 })
    .eq("id", campaign.id);

  return { campaign, expiresAt, rawToken };
}

export async function getAcquisitionOauthIntent(rawToken?: string | null) {
  if (!rawToken) return null;

  const supabase = createSupabaseAdminClient();
  const { data: intent, error: intentError } = await supabase
    .schema("app_private")
    .from("acquisition_oauth_intents")
    .select("campaign_id,expires_at,used_at")
    .eq("token_hash", hashIntentToken(rawToken))
    .maybeSingle();

  assertNoSupabaseError(intentError);

  if (
    !intent ||
    intent.used_at ||
    new Date(intent.expires_at).getTime() <= Date.now()
  ) {
    return null;
  }

  const campaigns = await listCampaigns(supabase);
  const campaign = campaigns.find((item) => item.id === intent.campaign_id);

  if (!campaign || campaign.status !== "ativo") return null;

  return { campaign };
}

export async function consumeAcquisitionOauthIntent(rawToken?: string | null) {
  if (!rawToken) return;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .schema("app_private")
    .from("acquisition_oauth_intents")
    .update({ used_at: new Date().toISOString() })
    .eq("token_hash", hashIntentToken(rawToken));

  assertNoSupabaseError(error);
}

export async function completeAcquisitionGoogleLead({
  email,
  name,
  token,
  userId,
  values,
}: AcquisitionSubmissionInput & {
  email: string;
  name: string;
  userId: string;
}) {
  const campaign = await getAcquisitionCampaignByToken(token);
  if (!campaign || campaign.status !== "ativo") {
    throw new Error("Campanha indisponível.");
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedName = name.trim() || getFallbackName(normalizedEmail);
  const supabase = createSupabaseAdminClient();

  await assertNextAuthUserMatchesEmail({
    email: normalizedEmail,
    name: normalizedName,
    supabase,
    userId,
  });

  const completeValues = {
    ...values,
    email: normalizedEmail,
    nome: normalizedName,
  };
  const leadData = validateCampaignValues(campaign, completeValues);
  const organizationId = await findOrCreateOrganization({
    companyName: leadData.companyName,
    companySize: leadData.companySize,
    supabase,
  });

  await ensureClientMembership({
    organizationId,
    supabase,
    userId,
  });

  return upsertLead({
    accountProvider: "google",
    campaign,
    leadData,
    organizationId,
    status: "account_created",
    supabase,
    userId,
  });
}
