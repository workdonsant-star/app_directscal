import jwt from "jsonwebtoken";
import { timingSafeEqual } from "node:crypto";

import { isSupabaseConfigured } from "@/lib/env";
import type { AuthRole, AuthUser } from "@/lib/contracts";
import { authUserSchema } from "@/lib/contracts";
import {
  isSuperadminEmail,
  isSuperadminPasswordLoginEnabled,
  resolveAuthUserFromEmail,
} from "@/lib/auth/access-control";
import {
  hashPasswordCredential,
  verifyPasswordCredential,
} from "@/lib/auth/password-credentials";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type ProvisionUserInput = {
  id?: string;
  email?: string | null;
  image?: string | null;
  name?: string | null;
};

type OrganizationMemberRow = {
  organization_id: string;
  role: AuthRole;
};

type OrganizationRow = {
  employee_count: number;
  id: string;
  name: string;
};

type PasswordCredentialRow = {
  password_hash: string;
};

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

type NextAuthUserRow = {
  email: string | null;
  id: string;
  image: string | null;
  name: string | null;
};

function getEmailDomain(email: string) {
  const [, domain] = email.toLowerCase().split("@");

  return domain ?? "";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getConfiguredSuperadminPassword() {
  const password = process.env.AUTH_SUPERADMIN_PASSWORD;

  return password && password.length > 0 ? password : null;
}

function safeCompareText(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function buildSupabaseAccessToken({
  email,
  expires,
  userId,
}: {
  email?: string | null;
  expires: string;
  userId: string;
}) {
  const signingSecret = process.env.SUPABASE_JWT_SECRET;

  if (!signingSecret) return undefined;

  return jwt.sign(
    {
      aud: "authenticated",
      email,
      exp: Math.floor(new Date(expires).getTime() / 1000),
      role: "authenticated",
      sub: userId,
    },
    signingSecret,
  );
}

async function getNextAuthUserByEmail(
  supabase: SupabaseAdminClient,
  email: string,
) {
  const { data: user, error } = await supabase
    .schema("next_auth")
    .from("users")
    .select("id,name,email,image")
    .ilike("email", normalizeEmail(email))
    .maybeSingle<NextAuthUserRow>();

  if (error) throw error;

  return user;
}

async function ensureSuperadminUserRow({
  email,
  supabase,
}: {
  email: string;
  supabase: SupabaseAdminClient;
}) {
  const normalizedEmail = normalizeEmail(email);
  const seedUser = resolveAuthUserFromEmail(normalizedEmail);
  const emailVerified = new Date().toISOString();
  const existingUser = await getNextAuthUserByEmail(supabase, normalizedEmail);

  const { data: user, error } = existingUser?.id
    ? await supabase
        .schema("next_auth")
        .from("users")
        .update({
          email: normalizedEmail,
          emailVerified,
          name: existingUser.name?.trim() || seedUser.name,
        })
        .eq("id", existingUser.id)
        .select("id,name,email,image")
        .single<NextAuthUserRow>()
    : await supabase
        .schema("next_auth")
        .from("users")
        .insert({
          email: normalizedEmail,
          emailVerified,
          name: seedUser.name,
        })
        .select("id,name,email,image")
        .single<NextAuthUserRow>();

  if (error) throw error;
  if (!user?.id || !user.email) return null;

  await ensureSupabaseAuthUserProvisioned({
    email: user.email,
    id: user.id,
    image: user.image,
    name: user.name,
  });

  return user;
}

async function ensureSuperadminPasswordCredential({
  password,
  supabase,
  userId,
}: {
  password: string;
  supabase: SupabaseAdminClient;
  userId: string;
}) {
  const { data: credential, error: credentialError } = await supabase
    .schema("app_private")
    .from("user_password_credentials")
    .select("password_hash")
    .eq("user_id", userId)
    .maybeSingle<PasswordCredentialRow>();

  if (credentialError) throw credentialError;

  if (
    credential?.password_hash &&
    verifyPasswordCredential(password, credential.password_hash)
  ) {
    return credential.password_hash;
  }

  const passwordHash = hashPasswordCredential(password);
  const { data: savedCredential, error: upsertError } = await supabase
    .schema("app_private")
    .from("user_password_credentials")
    .upsert(
      {
        password_hash: passwordHash,
        user_id: userId,
      },
      { onConflict: "user_id" },
    )
    .select("password_hash")
    .single<PasswordCredentialRow>();

  if (upsertError) throw upsertError;

  return savedCredential?.password_hash ?? passwordHash;
}

async function resolveSupabaseSuperadminAuthUser({
  email,
  supabase,
  userId,
}: {
  email: string;
  supabase: SupabaseAdminClient;
  userId: string;
}): Promise<AuthUser | null> {
  const normalizedEmail = normalizeEmail(email);
  const { data: user, error: userError } = await supabase
    .schema("next_auth")
    .from("users")
    .select("id,name,email,image")
    .eq("id", userId)
    .maybeSingle<NextAuthUserRow>();

  if (userError) throw userError;

  const resolvedEmail = user?.email ? normalizeEmail(user.email) : normalizedEmail;

  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id,role")
    .eq("user_id", userId)
    .eq("role", "superadmin")
    .limit(1)
    .maybeSingle<OrganizationMemberRow>();

  if (memberError) throw memberError;
  if (!member) return null;

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id,name,employee_count")
    .eq("id", member.organization_id)
    .single<OrganizationRow>();

  if (organizationError) throw organizationError;

  const parsedUser = authUserSchema.safeParse({
    company: organization.name,
    email: resolvedEmail,
    id: userId,
    image: user?.image ?? null,
    name:
      user?.name?.trim() ||
      resolveAuthUserFromEmail(resolvedEmail, undefined, userId).name,
    role: "superadmin",
  });

  return parsedUser.success ? parsedUser.data : null;
}

export async function checkUserHasActiveAccess(email: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = createSupabaseAdminClient();
  const normalizedEmail = normalizeEmail(email);
  const { data: user, error: userError } = await supabase
    .schema("next_auth")
    .from("users")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (userError) throw userError;
  if (!user?.id) return false;

  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (memberError) throw memberError;
  if (member?.id) return true;

  const { data: lead, error: leadError } = await supabase
    .from("acquisition_leads")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "account_created")
    .limit(1)
    .maybeSingle();

  if (leadError) throw leadError;

  return Boolean(lead?.id);
}

export function getSupabaseAdapterConfig() {
  if (!isSupabaseConfigured()) return null;

  return {
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    url: process.env.SUPABASE_URL ?? "",
  };
}

export async function authenticateSuperadminPasswordUser({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthUser | null> {
  if (!isSupabaseConfigured() || !isSuperadminPasswordLoginEnabled()) {
    return null;
  }

  const normalizedEmail = normalizeEmail(email);
  const configuredPassword = getConfiguredSuperadminPassword();

  if (
    !configuredPassword ||
    !isSuperadminEmail(normalizedEmail) ||
    !safeCompareText(password, configuredPassword)
  ) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const user = await ensureSuperadminUserRow({
    email: normalizedEmail,
    supabase,
  });

  if (!user?.id || !user.email) return null;

  const passwordHash = await ensureSuperadminPasswordCredential({
    password: configuredPassword,
    supabase,
    userId: user.id,
  });

  if (!verifyPasswordCredential(password, passwordHash)) return null;

  return resolveSupabaseSuperadminAuthUser({
    email: user.email,
    supabase,
    userId: user.id,
  });
}

export async function ensureSupabaseAuthUserProvisioned(
  user: ProvisionUserInput,
) {
  if (!isSupabaseConfigured() || !user.id || !user.email) return null;

  const seedUser = resolveAuthUserFromEmail(
    user.email,
    user.name?.trim() || undefined,
    user.id,
  );
  const domain = getEmailDomain(seedUser.email);
  const supabase = createSupabaseAdminClient();

  const { data: existingOrganization, error: organizationSelectError } =
    await supabase
      .from("organizations")
      .select("id")
      .eq("domain", domain)
      .maybeSingle();

  if (organizationSelectError) throw organizationSelectError;

  const organizationId = existingOrganization?.id;

  const { data: organization, error: organizationError } = organizationId
    ? await supabase
        .from("organizations")
        .update({ name: seedUser.company })
        .eq("id", organizationId)
        .select("id")
        .single()
    : await supabase
        .from("organizations")
        .insert({
          domain,
          employee_count: 1,
          name: seedUser.company,
        })
        .select("id")
        .single();

  if (organizationError) throw organizationError;

  const { error: memberError } = await supabase
    .from("organization_members")
    .upsert(
      {
        organization_id: organization.id,
        role: seedUser.role,
        user_id: user.id,
      },
      {
        onConflict: "organization_id,user_id",
      },
    );

  if (memberError) throw memberError;

  return resolveSupabaseAuthUser(user.id, user.email);
}

export async function resolveSupabaseAuthUser(
  userId?: string | null,
  email?: string | null,
): Promise<AuthUser | null> {
  if (!isSupabaseConfigured() || (!userId && !email)) return null;

  const supabase = createSupabaseAdminClient();
  let resolvedUserId = userId ?? null;
  let resolvedEmail = email ? normalizeEmail(email) : null;
  let resolvedName: string | null = null;
  let resolvedImage: string | null = null;

  if (!resolvedUserId && resolvedEmail) {
    const { data: authUser, error: userError } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id,name,email,image")
      .eq("email", resolvedEmail)
      .maybeSingle();

    if (userError) throw userError;

    resolvedUserId = authUser?.id ?? null;
    resolvedName = authUser?.name ?? null;
    resolvedImage = authUser?.image ?? null;
  } else if (resolvedUserId) {
    const { data: authUser, error: userError } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id,name,email,image")
      .eq("id", resolvedUserId)
      .maybeSingle();

    if (userError) throw userError;

    resolvedEmail = authUser?.email ? normalizeEmail(authUser.email) : resolvedEmail;
    resolvedName = authUser?.name ?? null;
    resolvedImage = authUser?.image ?? null;
  }

  if (!resolvedUserId || !resolvedEmail) return null;

  const { data: memberships, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id,role")
    .eq("user_id", resolvedUserId)
    .order("created_at", { ascending: true })
    .returns<OrganizationMemberRow[]>();

  if (memberError) throw memberError;

  const member =
    memberships.find((membership) => membership.role === "superadmin") ??
    memberships[0];

  if (!member) return null;

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id,name,employee_count")
    .eq("id", member.organization_id)
    .single<OrganizationRow>();

  if (organizationError) throw organizationError;

  const parsedUser = authUserSchema.safeParse({
    company: organization.name,
    email: resolvedEmail,
    id: resolvedUserId,
    image: resolvedImage,
    name:
      resolvedName?.trim() ||
      resolveAuthUserFromEmail(resolvedEmail, undefined, resolvedUserId).name,
    role: member.role,
  });

  return parsedUser.success ? parsedUser.data : null;
}

export function attachSupabaseAccessTokenToSession({
  email,
  expires,
  session,
  userId,
}: {
  email?: string | null;
  expires: string;
  session: { supabaseAccessToken?: string };
  userId?: string | null;
}) {
  if (!userId) return session;

  session.supabaseAccessToken = buildSupabaseAccessToken({
    email,
    expires,
    userId,
  });

  return session;
}
