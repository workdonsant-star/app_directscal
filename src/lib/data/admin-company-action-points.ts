import "server-only";

import type { AdminCompanyActionPoint, AdminCompanyActionPointAsset, AdminCompanyActionPointInput } from "@/lib/contracts/admin-company-action-points";
import { getSlackBotTokenForOrganization, getSlackWorkspaceUser, listSlackWorkspaceUsers } from "@/lib/integrations/slack";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { routineOrganizationId } from "@/lib/data/admin-adherence-data-source";

export class AdminCompanyActionPointError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409 | 500 = 400) { super(message); }
}

async function company(organizationId: string) {
  const { data, error } = await createSupabaseAdminClient().from("organizations").select("id,name").eq("id", organizationId).maybeSingle();
  if (error) throw new AdminCompanyActionPointError("Não foi possível consultar a empresa.", 500);
  if (!data) throw new AdminCompanyActionPointError("Empresa não encontrada.", 404);
  return data;
}

export async function getAdminCompanyActionPoints(companyId: string): Promise<{ items: AdminCompanyActionPoint[]; assets: AdminCompanyActionPointAsset[]; leaders: { userId: string; name: string; avatarUrl: string | null }[]; slackConnected: boolean }> {
  const organizationId = routineOrganizationId(companyId);
  await company(organizationId);
  const db = createSupabaseAdminClient();
  const [points, assetsResult, installation, followups, reports] = await Promise.all([
    db.schema("app_private").from("admin_company_action_points").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    db.from("management_assets").select("id,title,current_published_version_id,status,archived_at").eq("organization_id", organizationId),
    getSlackBotTokenForOrganization(organizationId),
    db.schema("app_private").from("manual_action_point_followups").select("id,action_point_id,status,created_at").eq("organization_id", organizationId).order("created_at", { ascending: false }),
    db.schema("app_private").from("manual_action_point_reports").select("followup_id,status,summary,evidence,registered_at,confirmed_at").eq("organization_id", organizationId).order("registered_at", { ascending: false }),
  ]);
  if (points.error || assetsResult.error || followups.error || reports.error) throw new AdminCompanyActionPointError("Não foi possível carregar os action points.", 500);
  const assets = (assetsResult.data ?? []).filter(asset => asset.current_published_version_id && asset.status === "publicado" && !asset.archived_at);
  const allAssets = new Map((assetsResult.data ?? []).map(asset => [asset.id, asset.title]));
  const leaders = installation ? await listSlackWorkspaceUsers(installation.botToken, true).catch(() => []) : [];
  const people = new Map(leaders.map(leader => [leader.userId, leader]));
  const latestFollowup = new Map<string, NonNullable<typeof followups.data>[number]>();
  for (const item of followups.data ?? []) if (!latestFollowup.has(item.action_point_id)) latestFollowup.set(item.action_point_id, item);
  const followupIdsByAction = new Map<string, Set<string>>();
  for (const item of followups.data ?? []) {
    const ids = followupIdsByAction.get(item.action_point_id) ?? new Set<string>();
    ids.add(item.id);
    followupIdsByAction.set(item.action_point_id, ids);
  }
  return {
    items: (points.data ?? []).map(point => ({
      id: point.id, title: point.title, assetId: point.asset_id, assetTitle: allAssets.get(point.asset_id) ?? "Ativo indisponível",
      leaderUserId: point.slack_user_id, leaderName: point.slack_team_id === installation?.teamId ? (people.get(point.slack_user_id)?.name ?? "Pessoa indisponível no Slack") : "Pessoa indisponível no Slack",
      leaderAvatarUrl: point.slack_team_id === installation?.teamId ? (people.get(point.slack_user_id)?.avatarUrl ?? null) : null,
      deadline: point.deadline, frequency: point.frequency, reason: point.reason, action: point.action, continuity: point.continuity, updatedAt: point.updated_at,
      followup: latestFollowup.has(point.id) ? (() => {
        const item = latestFollowup.get(point.id)!;
        return { id: item.id, status: item.status, createdAt: item.created_at, reports: (reports.data ?? []).filter(report => followupIdsByAction.get(point.id)?.has(report.followup_id)).map(report => ({ status: report.status, summary: report.summary, evidence: report.evidence, registeredAt: report.registered_at, confirmedAt: report.confirmed_at })) };
      })() : null,
    })),
    assets: assets.map(asset => ({ id: asset.id, title: asset.title })),
    leaders, slackConnected: Boolean(installation),
  };
}

export async function saveAdminCompanyActionPoint(companyId: string, actorId: string, input: AdminCompanyActionPointInput) {
  const organizationId = routineOrganizationId(companyId);
  const db = createSupabaseAdminClient();
  const [organization, assetResult, installation] = await Promise.all([
    company(organizationId),
    db.from("management_assets").select("id,organization_id,current_published_version_id,status,archived_at").eq("id", input.assetId).maybeSingle(),
    getSlackBotTokenForOrganization(organizationId),
  ]);
  void organization;
  if (assetResult.error) throw new AdminCompanyActionPointError("Não foi possível consultar o ativo.", 500);
  const asset = assetResult.data;
  if (!asset || asset.organization_id !== organizationId || !asset.current_published_version_id || asset.status !== "publicado" || asset.archived_at) {
    throw new AdminCompanyActionPointError("Selecione um ativo publicado desta empresa.");
  }
  if (!installation) throw new AdminCompanyActionPointError("Conecte o Slack da empresa antes de escolher o líder.", 409);
  const leader = await getSlackWorkspaceUser(installation.botToken, input.leaderUserId, true).catch(() => null);
  if (!leader || leader.userId !== input.leaderUserId) throw new AdminCompanyActionPointError("Selecione uma pessoa ativa no Slack da empresa.");
  const values = {
    asset_id: asset.id, asset_version_id: asset.current_published_version_id, slack_team_id: installation.teamId, slack_user_id: leader.userId,
    title: input.title, deadline: input.deadline, frequency: input.frequency, reason: input.reason, action: input.action, continuity: input.continuity,
    updated_by: actorId,
  };
  if (input.expectedUpdatedAt) {
    const { data, error } = await db.schema("app_private").from("admin_company_action_points")
      .update({ ...values, updated_at: new Date().toISOString() }).eq("id", input.id).eq("organization_id", organizationId).eq("updated_at", input.expectedUpdatedAt).select("id").maybeSingle();
    if (error) throw new AdminCompanyActionPointError("Não foi possível salvar o action point.", 500);
    if (!data) throw new AdminCompanyActionPointError("O action point mudou. Recarregue antes de salvar novamente.", 409);
  } else {
    const { error } = await db.schema("app_private").from("admin_company_action_points").insert({ id: input.id, organization_id: organizationId, created_by: actorId, ...values });
    if (error?.code === "23505") throw new AdminCompanyActionPointError("O action point já foi salvo. Recarregue a página.", 409);
    if (error) throw new AdminCompanyActionPointError("Não foi possível salvar o action point.", 500);
  }
  return { id: input.id };
}
