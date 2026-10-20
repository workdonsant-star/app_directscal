import "server-only";

import { getPublicAppUrl, getRequiredServerEnv } from "@/lib/env";
import {
  isValidSlackSignature,
  mapSlackMember,
  SLACK_BOT_SCOPES,
  type SlackConversationMessage,
  type SlackWorkspaceUser,
} from "@/lib/integrations/slack-format";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type SlackApiResponse = {
  ok: boolean;
  error?: string;
};

export type SlackInstallation = {
  teamId: string;
  organizationId: string;
  botToken: string;
  botUserId: string | null;
};

export function verifySlackRequest(request: Request, rawBody: string) {
  return isValidSlackSignature({
    signingSecret: getRequiredServerEnv("SLACK_SIGNING_SECRET"),
    rawBody,
    timestamp: request.headers.get("x-slack-request-timestamp"),
    signature: request.headers.get("x-slack-signature"),
  });
}

export function isSlackOAuthConfigured() {
  return Boolean(
    process.env.SLACK_CLIENT_ID &&
      process.env.SLACK_CLIENT_SECRET &&
      process.env.SLACK_SIGNING_SECRET,
  );
}

export function getSlackRedirectUri() {
  return `${getPublicAppUrl()}/api/integrations/slack/oauth`;
}

export function buildSlackAuthorizeUrl(state: string) {
  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", getRequiredServerEnv("SLACK_CLIENT_ID"));
  url.searchParams.set("scope", SLACK_BOT_SCOPES.join(","));
  url.searchParams.set("redirect_uri", getSlackRedirectUri());
  url.searchParams.set("state", state);

  return url.toString();
}

export async function exchangeSlackOAuthCode(code: string) {
  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getRequiredServerEnv("SLACK_CLIENT_ID"),
      client_secret: getRequiredServerEnv("SLACK_CLIENT_SECRET"),
      code,
      redirect_uri: getSlackRedirectUri(),
    }),
    cache: "no-store",
  });
  const payload = (await response.json()) as SlackApiResponse & {
    access_token?: string;
    bot_user_id?: string;
    scope?: string;
    team?: { id?: string; name?: string };
  };

  if (!response.ok || !payload.ok || !payload.access_token || !payload.team?.id) {
    throw new Error(`Slack OAuth falhou: ${payload.error ?? response.status}`);
  }

  return {
    teamId: payload.team.id,
    teamName: payload.team.name ?? null,
    botToken: payload.access_token,
    botUserId: payload.bot_user_id ?? null,
    scope: payload.scope ?? null,
  };
}

export async function saveSlackInstallation(input: {
  teamId: string;
  teamName: string | null;
  organizationId: string;
  botToken: string;
  botUserId: string | null;
  scope: string | null;
  installedByUserId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .schema("app_private")
    .from("slack_installations")
    .select("organization_id,revoked_at")
    .eq("team_id", input.teamId)
    .maybeSingle();

  if (existingError) throw existingError;

  // Um workspace ativo pertence a uma única empresa; trocar de empresa exige
  // desconectar antes.
  if (
    existing &&
    !existing.revoked_at &&
    existing.organization_id !== input.organizationId
  ) {
    throw new Error("Este workspace do Slack já está conectado a outra empresa.");
  }

  const { error } = await supabase
    .schema("app_private")
    .from("slack_installations")
    .upsert(
      {
        team_id: input.teamId,
        team_name: input.teamName,
        organization_id: input.organizationId,
        bot_token: input.botToken,
        bot_user_id: input.botUserId,
        scope: input.scope,
        installed_by_user_id: input.installedByUserId,
        installed_at: new Date().toISOString(),
        revoked_at: null,
      },
      { onConflict: "team_id" },
    );

  if (error) throw error;
}

// Instalação via OAuth tem prioridade. As variáveis SLACK_BOT_TOKEN e
// SLACK_ORGANIZATION_ID continuam valendo para um workspace único de teste.
export async function getSlackInstallation(teamId: string, options: { allowEnvFallback?: boolean } = {}): Promise<SlackInstallation | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("app_private")
    .from("slack_installations")
    .select("team_id,organization_id,bot_token,bot_user_id")
    .eq("team_id", teamId)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return {
      teamId: data.team_id,
      organizationId: data.organization_id,
      botToken: data.bot_token,
      botUserId: data.bot_user_id,
    };
  }

  if (options.allowEnvFallback === false) return null;
  const envToken = process.env.SLACK_BOT_TOKEN;
  const envOrganizationId = process.env.SLACK_ORGANIZATION_ID;
  const envTeamId = process.env.SLACK_TEAM_ID;

  if (envToken && envOrganizationId && (!envTeamId || envTeamId === teamId)) {
    return {
      teamId,
      organizationId: envOrganizationId,
      botToken: envToken,
      botUserId: null,
    };
  }

  return null;
}

export async function getSlackInstallationForOrganization(organizationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("app_private")
    .from("slack_installations")
    .select("team_id,team_name,installed_at,scope")
    .eq("organization_id", organizationId)
    .is("revoked_at", null)
    .order("installed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data
    ? {
        teamId: data.team_id,
        teamName: data.team_name,
        installedAt: data.installed_at,
        scope: data.scope,
      }
    : null;
}

// Token do bot da empresa, só para uso server-side.
export async function getSlackBotTokenForOrganization(organizationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .schema("app_private")
    .from("slack_installations")
    .select("team_id,bot_token")
    .eq("organization_id", organizationId)
    .is("revoked_at", null)
    .order("installed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data ? { teamId: data.team_id, botToken: data.bot_token } : null;
}

export async function revokeSlackInstallation(teamId: string, organizationId?: string) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .schema("app_private")
    .from("slack_installations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("team_id", teamId)
    .is("revoked_at", null);

  if (organizationId) query = query.eq("organization_id", organizationId);

  const { data, error } = await query.select("bot_token");

  if (error) throw error;

  return data[0]?.bot_token ?? null;
}

export async function revokeSlackToken(token: string) {
  await fetch("https://slack.com/api/auth.revoke", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);
}

// Registra o evento; devolve false quando ele já foi processado (reenvio).
export async function claimSlackEvent(eventId: string, teamId: string | null) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .schema("app_private")
    .from("slack_event_receipts")
    .insert({ event_id: eventId, team_id: teamId });

  if (!error) return true;
  if (error.code === "23505") return false;

  throw error;
}

async function callSlack(token: string, method: string, body: Record<string, unknown>) {
  const response = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = (await response.json()) as SlackApiResponse;

  if (!response.ok || !payload.ok) {
    throw new Error(`Slack ${method} falhou: ${payload.error ?? response.status}`);
  }
}

export class SlackDeliveryError extends Error {
  constructor(public code: "rate_limited" | "missing_scope" | "invalid_auth" | "channel_not_found" | "envio_recusado" | "envio_sem_confirmacao" | "contexto_indisponivel", public retryable: boolean, public uncertain = false, public retryAfter = 60) {
    super("Não foi possível confirmar a entrega no Slack.");
  }
}

export async function postSlackMessage(
  token: string,
  message: { channel: string; threadTs?: string; text: string; blocks?: unknown[]; clientMsgId?: string },
): Promise<{ ts: string; channel: string }> {
  let response: Response;
  try {
    response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ channel: message.channel, ...(message.threadTs ? { thread_ts: message.threadTs } : {}), text: message.text,
        ...(message.blocks ? { blocks: message.blocks } : {}), ...(message.clientMsgId ? { client_msg_id: message.clientMsgId } : {}), unfurl_links: false, unfurl_media: false }),
      cache: "no-store", signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new SlackDeliveryError("envio_sem_confirmacao", false, true);
  }
  if (response.status === 429) {
    const delay = Number(response.headers.get("retry-after"));
    throw new SlackDeliveryError("rate_limited", true, false, Number.isFinite(delay) && delay > 0 ? Math.min(delay, 3600) : 60);
  }
  const payload = await response.json().catch(() => null) as (SlackApiResponse & { ts?: string; channel?: string }) | null;
  if (response.ok && payload?.ok && payload.ts && payload.channel) return { ts: payload.ts, channel: payload.channel };
  // Erros de transporte/servidor podem acontecer depois da publicação: não repetir às cegas.
  if (response.status >= 500 || !payload) throw new SlackDeliveryError("envio_sem_confirmacao", false, true);
  if (["invalid_auth", "token_revoked", "account_inactive", "not_authed"].includes(payload.error ?? "")) throw new SlackDeliveryError("invalid_auth", false);
  if (payload.error === "missing_scope") throw new SlackDeliveryError("missing_scope", false);
  if (payload.error === "channel_not_found") throw new SlackDeliveryError("channel_not_found", false);
  if (["is_archived", "not_in_channel", "msg_too_long", "invalid_blocks"].includes(payload.error ?? "")) throw new SlackDeliveryError("envio_recusado", false);
  throw new SlackDeliveryError("envio_sem_confirmacao", false, true);
}

export async function addSlackReaction(
  token: string,
  reaction: { channel: string; ts: string; name: string },
) {
  try {
    await callSlack(token, "reactions.add", {
      channel: reaction.channel,
      timestamp: reaction.ts,
      name: reaction.name,
    });
  } catch (error) {
    // Reenvio do mesmo evento já deixou a reação.
    if (error instanceof Error && error.message.endsWith("already_reacted")) return;
    throw error;
  }
}

export async function respondToSlackAction(responseUrl: string, body: Record<string, unknown>) {
  // response_url só aceita hosts do Slack.
  if (!/^https:\/\/hooks\.slack\.com\//.test(responseUrl)) return;

  await fetch(responseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  }).catch(() => null);
}

const botUserIdByToken = new Map<string, string>();

// Instalações via OAuth já guardam o usuário do bot; no fallback por variável
// de ambiente ele é descoberto uma vez por processo.
export async function getSlackBotUserId(installation: SlackInstallation) {
  if (installation.botUserId) return installation.botUserId;

  const cached = botUserIdByToken.get(installation.botToken);
  if (cached) return cached;

  const response = await fetch("https://slack.com/api/auth.test", {
    method: "POST",
    headers: { Authorization: `Bearer ${installation.botToken}` },
    cache: "no-store",
  });
  const payload = (await response.json()) as SlackApiResponse & { user_id?: string };

  if (!payload.ok || !payload.user_id) {
    throw new Error(`Slack auth.test falhou: ${payload.error ?? response.status}`);
  }

  botUserIdByToken.set(installation.botToken, payload.user_id);
  return payload.user_id;
}

// Mensagens de uma thread (replies) ou, sem thread, as mais recentes da
// conversa. Usadas para dar contexto às perguntas de continuação.
export async function fetchSlackConversation(
  token: string,
  channel: string,
  threadTs?: string,
): Promise<SlackConversationMessage[]> {
  const method = threadTs ? "conversations.replies" : "conversations.history";
  const params = new URLSearchParams({ channel, limit: "20" });
  if (threadTs) params.set("ts", threadTs);

  const response = await fetch(`https://slack.com/api/${method}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const payload = (await response.json()) as SlackApiResponse & {
    messages?: SlackConversationMessage[];
  };

  if (!payload.ok) {
    throw new Error(`Slack ${method} falhou: ${payload.error ?? response.status}`);
  }

  const messages = payload.messages ?? [];
  // conversations.history devolve do mais recente para o mais antigo.
  return threadTs ? messages : [...messages].reverse();
}

async function readSlack<T extends SlackApiResponse>(
  token: string,
  method: string,
  params: Record<string, string>,
) {
  const response = await fetch(
    `https://slack.com/api/${method}?${new URLSearchParams(params)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  const payload = (await response.json()) as T;

  if (!response.ok || !payload.ok) {
    throw new Error(`Slack ${method} falhou: ${payload.error ?? response.status}`);
  }

  return payload;
}

// Pessoas ativas do workspace, em ordem alfabética.
export async function listSlackWorkspaceUsers(token: string, includeGuests = false) {
  const users: SlackWorkspaceUser[] = [];
  let cursor = "";

  do {
    const page = await readSlack<
      SlackApiResponse & {
        members?: Parameters<typeof mapSlackMember>[0][];
        response_metadata?: { next_cursor?: string };
      }
    >(token, "users.list", { limit: "200", ...(cursor ? { cursor } : {}) });

    for (const member of page.members ?? []) {
      const user = mapSlackMember(member, includeGuests);
      if (user) users.push(user);
    }

    cursor = page.response_metadata?.next_cursor ?? "";
  } while (cursor);

  return users.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

// Nome e foto vêm sempre do Slack, nunca do navegador.
export async function getSlackWorkspaceUser(token: string, userId: string, includeGuests = false) {
  const payload = await readSlack<
    SlackApiResponse & { user?: Parameters<typeof mapSlackMember>[0] }
  >(token, "users.info", { user: userId });

  return payload.user ? mapSlackMember(payload.user, includeGuests) : null;
}

export async function openSlackDirectConversation(token: string, userId: string) {
  let response: Response;
  try { response = await fetch("https://slack.com/api/conversations.open", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ users: userId }), cache: "no-store", signal: AbortSignal.timeout(15000),
  }); } catch { throw new SlackDeliveryError("contexto_indisponivel", true); }
  if (response.status === 429) throw new SlackDeliveryError("rate_limited", true, false, Number(response.headers.get("retry-after")) || 60);
  const payload = await response.json().catch(() => null) as (SlackApiResponse & { channel?: { id?: string } }) | null;
  if (!response.ok || !payload?.ok || !payload.channel?.id?.match(/^D[A-Za-z0-9]+$/)) {
    if (payload?.error === "missing_scope") throw new SlackDeliveryError("missing_scope", false);
    if (["invalid_auth", "token_revoked", "account_inactive"].includes(payload?.error ?? "")) throw new SlackDeliveryError("invalid_auth", false);
    throw new SlackDeliveryError("contexto_indisponivel", true);
  }
  return payload.channel.id;
}
