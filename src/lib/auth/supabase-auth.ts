import jwt from "jsonwebtoken";

import { isSupabaseConfigured } from "@/lib/env";
import type { AuthRole, AuthUser } from "@/lib/contracts";
import { authUserSchema } from "@/lib/contracts";
import { resolveAuthUserFromEmail } from "@/lib/auth/access-control";
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

function getEmailDomain(email: string) {
  const [, domain] = email.toLowerCase().split("@");

  return domain ?? "";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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

export function getSupabaseAdapterConfig() {
  if (!isSupabaseConfigured()) return null;

  return {
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    url: process.env.SUPABASE_URL ?? "",
  };
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

  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id,role")
    .eq("user_id", resolvedUserId)
    .order("created_at", { ascending: true })
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
