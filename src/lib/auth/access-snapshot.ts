import "server-only";

import { cache } from "react";
import { z } from "zod";

import type { OrganizationMemberRow, OrganizationRow } from "@/lib/auth/supabase-auth";
import { maybeCreateSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Tudo o que uma página autenticada precisa saber sobre o usuário antes de
 * renderizar: versão de sessão, conta, vínculos, empresa da sessão, perfil,
 * módulos, onboarding e conexão Slack. Memoizado somente por request (`cache` do React);
 * nada aqui sobrevive entre requests.
 *
 * Caminho principal: uma ida ao banco via `app_private.get_user_access_snapshot`.
 * Se a migração ainda não foi aplicada, cai em duas rodadas paralelas com as
 * mesmas consultas de antes.
 */
export type UserAccessSnapshot = {
  sessionVersion: string;
  user: { id: string; email: string | null; name: string | null; image: string | null } | null;
  memberships: OrganizationMemberRow[];
  /** Empresa do papel da sessão: superadmin primeiro, senão o vínculo mais antigo. */
  organization: OrganizationRow | null;
  profile: { name: string; avatarUrl: string | null; profilePersisted: boolean } | null;
  /** `null` quando a tabela de módulos não existe: todos liberados, como antes. */
  moduleAccess: { organization_id: string; module_id: string; enabled: boolean }[] | null;
  /** Conclusão do onboarding da empresa principal (vínculo mais antigo). */
  onboardingCompleted: boolean;
  /** Instalação Slack não revogada da empresa principal. */
  slackConnected: boolean;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const role = z.enum(["superadmin", "admin", "cliente"]);

const rpcSnapshotSchema = z.object({
  session_version: z.union([z.uuid(), z.literal("initial")]),
  user: z.object({
    id: z.string(),
    email: z.string().nullable(),
    name: z.string().nullable(),
    image: z.string().nullable(),
  }).nullable(),
  memberships: z.array(z.object({ organization_id: z.string(), role })),
  organization: z.object({ id: z.string(), name: z.string(), employee_count: z.number() }).nullable(),
  profile: z.object({ name: z.string(), avatar_url: z.string().nullable() }).nullable(),
  module_access: z.array(z.object({ organization_id: z.string(), module_id: z.string(), enabled: z.boolean() })),
  onboarding_completed: z.boolean(),
  slack_connected: z.boolean(),
});

function isMissingFunctionError(error: { code?: string; message?: string } | null) {
  return Boolean(error) && (error?.code === "PGRST202" || /get_user_access_snapshot/i.test(error?.message ?? ""));
}

function isMissingModuleAccessTableError(error: { message: string } | null) {
  return Boolean(error) && /organization_module_access|schema cache|could not find the table/i.test(error?.message ?? "");
}

let rpcUnavailable = false;

export const getUserAccessSnapshot = cache(async (userId: string): Promise<UserAccessSnapshot | null> => {
  if (!uuidPattern.test(userId)) return null;
  const supabase = maybeCreateSupabaseAdminClient();
  if (!supabase) return null;

  if (!rpcUnavailable) {
    const { data, error } = await supabase.schema("app_private").rpc("get_user_access_snapshot", { p_user_id: userId });
    if (!error) return fromRpc(rpcSnapshotSchema.parse(data));
    if (!isMissingFunctionError(error)) throw new Error("Não foi possível validar a sessão.");
    // Migração ainda não aplicada neste ambiente: não tentar de novo neste processo.
    rpcUnavailable = true;
  }

  return loadWithQueries(supabase, userId);
});

function fromRpc(data: z.infer<typeof rpcSnapshotSchema>): UserAccessSnapshot {
  return {
    sessionVersion: data.session_version,
    user: data.user,
    memberships: data.memberships,
    organization: data.organization,
    profile: data.profile
      ? { name: data.profile.name, avatarUrl: data.profile.avatar_url, profilePersisted: true }
      : data.user?.name
        ? { name: data.user.name, avatarUrl: data.user.image, profilePersisted: false }
        : null,
    moduleAccess: data.module_access,
    onboardingCompleted: data.onboarding_completed,
    slackConnected: data.slack_connected,
  };
}

async function loadWithQueries(
  supabase: NonNullable<ReturnType<typeof maybeCreateSupabaseAdminClient>>,
  userId: string,
): Promise<UserAccessSnapshot> {
  const [version, account, members, profile] = await Promise.all([
    supabase.schema("app_private").rpc("get_user_session_version", { p_user_id: userId }),
    supabase.schema("next_auth").from("users").select("id,name,email,image").eq("id", userId).maybeSingle(),
    supabase.from("organization_members").select("organization_id,role")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .order("organization_id", { ascending: true })
      .returns<OrganizationMemberRow[]>(),
    supabase.from("account_profiles").select("name,avatar_url").eq("user_id", userId).maybeSingle(),
  ]);
  if (version.error) throw new Error("Não foi possível validar a sessão.");
  if (account.error) throw account.error;
  if (members.error) throw members.error;
  if (profile.error) throw profile.error;

  const memberships = members.data;
  const organizationIds = memberships.map((item) => item.organization_id);
  const sessionMember = memberships.find((item) => item.role === "superadmin") ?? memberships[0];
  const primaryOrganizationId = memberships[0]?.organization_id ?? null;

  const [organization, moduleAccess, onboarding, slack] = await Promise.all([
    sessionMember
      ? supabase.from("organizations").select("id,name,employee_count").eq("id", sessionMember.organization_id).maybeSingle<OrganizationRow>()
      : null,
    organizationIds.length
      ? supabase.from("organization_module_access").select("organization_id,module_id,enabled").in("organization_id", organizationIds)
      : null,
    primaryOrganizationId
      ? supabase.schema("app_private").from("client_onboarding_completions").select("organization_id").eq("organization_id", primaryOrganizationId).maybeSingle()
      : null,
    primaryOrganizationId
      ? supabase.schema("app_private").from("slack_installations").select("team_id")
        .eq("organization_id", primaryOrganizationId).is("revoked_at", null).limit(1).maybeSingle()
      : null,
  ]);
  if (organization?.error) throw organization.error;
  if (moduleAccess?.error && !isMissingModuleAccessTableError(moduleAccess.error)) throw moduleAccess.error;
  if (onboarding?.error) throw new Error("Não foi possível consultar a configuração inicial da empresa.");
  if (slack?.error) throw slack.error;

  const user = account.data;
  return {
    sessionVersion: z.union([z.uuid(), z.literal("initial")]).parse(version.data),
    user,
    memberships,
    organization: organization?.data ?? null,
    profile: profile.data
      ? { name: profile.data.name, avatarUrl: profile.data.avatar_url, profilePersisted: true }
      : user?.name
        ? { name: user.name, avatarUrl: user.image, profilePersisted: false }
        : null,
    moduleAccess: moduleAccess?.error ? null : (moduleAccess?.data ?? []),
    onboardingCompleted: Boolean(onboarding?.data),
    slackConnected: Boolean(slack?.data),
  };
}
