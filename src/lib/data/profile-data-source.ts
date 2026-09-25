import {
  profileSettingsDataSchema,
  type AuthUser,
  type ProfileSettingsData,
  type UpdateProfileCommercialInput,
} from "@/lib/contracts";
import { mockUserProfile } from "@/lib/mock-data";
import { maybeCreateSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";

type Supabase = NonNullable<ReturnType<typeof maybeCreateSupabaseAdminClient>>;

type OrganizationProfileRow = Pick<
  Database["public"]["Tables"]["organizations"]["Row"],
  "created_at" | "employee_count" | "id" | "name" | "updated_at"
>;

type LeadProfileRow = Pick<
  Database["public"]["Tables"]["acquisition_leads"]["Row"],
  | "company_name"
  | "company_size"
  | "field_values"
  | "objective"
  | "organization_id"
  | "role"
  | "updated_at"
>;

type MemberProfileRow = Pick<
  Database["public"]["Tables"]["organization_members"]["Row"],
  "organization_id"
>;

type LeadCommercialRow = Pick<
  Database["public"]["Tables"]["acquisition_leads"]["Row"],
  "field_values" | "id"
>;

type OrganizationPersonProfileRow = Pick<
  Database["public"]["Tables"]["organization_people"]["Row"],
  "position"
>;

function assertNoSupabaseError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function jsonToStringRecord(value: Json): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1].trim() !== "",
    ),
  );
}

function valueOrNull(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

const lowercaseCompanyNameWords = new Set([
  "a",
  "as",
  "da",
  "das",
  "de",
  "do",
  "dos",
  "e",
]);

export function formatCompanyDisplayName(value: string | null) {
  if (!value) return null;

  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized !== normalized.toLocaleUpperCase("pt-BR")) {
    return normalized;
  }

  return normalized
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((word, index) => {
      if (index > 0 && lowercaseCompanyNameWords.has(word)) return word;
      if (/\d/.test(word)) return word.toLocaleUpperCase("pt-BR");

      return `${word.charAt(0).toLocaleUpperCase("pt-BR")}${word.slice(1)}`;
    })
    .join(" ");
}

const commercialFieldMap = {
  companySize: "tamanho_empresa",
  industry: "nicho_atuacao",
  instagram: "instagram_empresa",
  lastQuarterRevenue: "faturamento_ultimo_trimestre",
  position: "cargo",
  socialName: "nome_fantasia",
  website: "website",
} as const satisfies Record<keyof UpdateProfileCommercialInput, string>;

export function mergeProfileCommercialValues(
  fieldValues: Json,
  input: UpdateProfileCommercialInput,
): Json {
  const nextValues: Record<string, Json | undefined> =
    fieldValues && typeof fieldValues === "object" && !Array.isArray(fieldValues)
      ? { ...fieldValues }
      : {};

  for (const [inputKey, fieldKey] of Object.entries(commercialFieldMap) as Array<
    [keyof UpdateProfileCommercialInput, string]
  >) {
    const value = input[inputKey];

    if (value) {
      nextValues[fieldKey] = value;
    } else {
      delete nextValues[fieldKey];
    }
  }

  return nextValues;
}

export async function updateProfileCommercialData(
  userId: string,
  organizationId: string,
  input: UpdateProfileCommercialInput,
) {
  if (!isUuid(userId) || !isUuid(organizationId)) {
    throw new Error("Não foi possível localizar o cadastro da empresa.");
  }

  const supabase = maybeCreateSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Não foi possível acessar os dados da empresa.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle<{ role: Database["public"]["Enums"]["auth_role"] }>();
  assertNoSupabaseError(membershipError);

  if (membership?.role !== "cliente") {
    throw new Error("Apenas o Superadmin da empresa pode alterar estes dados.");
  }

  const { data: lead, error: leadError } = await supabase
    .from("acquisition_leads")
    .select("id,field_values")
    .eq("organization_id", organizationId)
    .eq("status", "account_created")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<LeadCommercialRow>();

  assertNoSupabaseError(leadError);

  if (!lead) {
    throw new Error("Não foi possível localizar o cadastro da empresa.");
  }

  const { error: updateError } = await supabase
    .from("acquisition_leads")
    .update({
      company_size: input.companySize,
      field_values: mergeProfileCommercialValues(lead.field_values, input),
      role: input.position,
    })
    .eq("id", lead.id)
    .eq("organization_id", organizationId);

  assertNoSupabaseError(updateError);

  return input;
}

export async function updateOrganizationPersonPosition(
  userId: string,
  position: UpdateProfileCommercialInput["position"],
) {
  if (!isUuid(userId)) {
    throw new Error("Não foi possível localizar seu perfil na empresa.");
  }

  const supabase = maybeCreateSupabaseAdminClient();
  if (!supabase) throw new Error("Não foi possível acessar seu perfil.");

  const { data, error } = await supabase
    .from("organization_people")
    .update({ position: position ?? "Liderança" })
    .eq("auth_user_id", userId)
    .select("id")
    .limit(1)
    .maybeSingle<{ id: string }>();

  assertNoSupabaseError(error);
  if (!data) throw new Error("Não foi possível localizar seu perfil na empresa.");

  return position;
}

export function buildProfileSettingsData({
  lead = null,
  organization = null,
  user,
}: {
  lead?: LeadProfileRow | null;
  organization?: OrganizationProfileRow | null;
  user: AuthUser;
}): ProfileSettingsData {
  const values = lead ? jsonToStringRecord(lead.field_values) : {};
  const officialName =
    valueOrNull(values.razao_social) ??
    valueOrNull(lead?.company_name) ??
    valueOrNull(organization?.name) ??
    user.company;
  const socialName = formatCompanyDisplayName(
    valueOrNull(values.nome_fantasia),
  );

  return profileSettingsDataSchema.parse({
    ...mockUserProfile,
    company: socialName ?? officialName,
    companyDetails: {
      activityStartedAt: valueOrNull(values.data_inicio_atividade),
      challenges:
        valueOrNull(values.objetivo) ?? valueOrNull(lead?.objective),
      city: valueOrNull(values.municipio_registro),
      cnaeCode: valueOrNull(values.cnae_fiscal),
      cnaeDescription: valueOrNull(values.cnae_fiscal_descricao),
      cnpj: valueOrNull(values.cnpj),
      companySize:
        valueOrNull(values.tamanho_empresa) ??
        valueOrNull(lead?.company_size),
      industry: valueOrNull(values.nicho_atuacao),
      instagram: valueOrNull(values.instagram_empresa),
      lastQuarterRevenue: valueOrNull(
        values.faturamento_ultimo_trimestre,
      ),
      legalNature: valueOrNull(values.natureza_juridica),
      officialName,
      position: valueOrNull(values.cargo) ?? valueOrNull(lead?.role),
      registeredAddress: valueOrNull(values.endereco_registrado),
      registrationStatus: valueOrNull(values.situacao_cadastral),
      registrySize: valueOrNull(values.porte_receita),
      socialName,
      state: valueOrNull(values.uf_registro),
      website: valueOrNull(values.website),
    },
    createdAt: organization?.created_at ?? mockUserProfile.createdAt,
    email: user.email,
    employeeCount:
      organization?.employee_count ?? mockUserProfile.employeeCount,
    id: user.id,
    name: user.name,
    organizationId: organization?.id ?? mockUserProfile.organizationId,
    updatedAt:
      lead?.updated_at ??
      organization?.updated_at ??
      mockUserProfile.updatedAt,
  });
}

async function getLatestLeadByUser(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from("acquisition_leads")
    .select(
      "company_name,company_size,field_values,objective,organization_id,role,updated_at",
    )
    .eq("user_id", userId)
    .eq("status", "account_created")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<LeadProfileRow>();

  assertNoSupabaseError(error);
  return data;
}

async function getPrimaryOrganizationId(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<MemberProfileRow>();

  assertNoSupabaseError(error);
  return data?.organization_id ?? null;
}

async function getOrganization(
  supabase: Supabase,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("organizations")
    .select("created_at,employee_count,id,name,updated_at")
    .eq("id", organizationId)
    .maybeSingle<OrganizationProfileRow>();

  assertNoSupabaseError(error);
  return data;
}

async function getOrganizationPersonByUser(
  supabase: Supabase,
  userId: string,
) {
  const { data, error } = await supabase
    .from("organization_people")
    .select("position")
    .eq("auth_user_id", userId)
    .limit(1)
    .maybeSingle<OrganizationPersonProfileRow>();

  assertNoSupabaseError(error);
  return data;
}

async function getLatestLeadByOrganization(
  supabase: Supabase,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("acquisition_leads")
    .select(
      "company_name,company_size,field_values,objective,organization_id,role,updated_at",
    )
    .eq("organization_id", organizationId)
    .eq("status", "account_created")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<LeadProfileRow>();

  assertNoSupabaseError(error);
  return data;
}

export async function getProfileSettingsData(
  user: AuthUser,
): Promise<ProfileSettingsData> {
  const supabase = maybeCreateSupabaseAdminClient();

  if (!isUuid(user.id) || !supabase) {
    return buildProfileSettingsData({ user });
  }

  let lead = await getLatestLeadByUser(supabase, user.id);
  const organizationId =
    lead?.organization_id ??
    (await getPrimaryOrganizationId(supabase, user.id));
  const organization = organizationId
    ? await getOrganization(supabase, organizationId)
    : null;

  if (!lead && organizationId) {
    lead = await getLatestLeadByOrganization(supabase, organizationId);
  }

  const organizationPerson = await getOrganizationPersonByUser(
    supabase,
    user.id,
  );

  const profile = buildProfileSettingsData({ lead, organization, user });

  return organizationPerson
    ? {
        ...profile,
        companyDetails: {
          ...profile.companyDetails,
          position: organizationPerson.position,
        },
      }
    : profile;
}
