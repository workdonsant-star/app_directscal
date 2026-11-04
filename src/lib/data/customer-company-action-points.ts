import "server-only";

import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import type { AuthSession } from "@/lib/contracts";
import { getSlackBotTokenForOrganization, listSlackWorkspaceUsers } from "@/lib/integrations/slack";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type CustomerCompanyActionPoint = {
  id: string;
  organizationId: string;
  companyName: string;
  title: string;
  assetId: string;
  assetTitle: string;
  assetAvailable: boolean;
  leaderUserId: string;
  leaderName: string;
  leaderAvatarUrl: string | null;
  deadline: string | null;
  frequency: "diaria" | "semanal" | "quinzenal" | "mensal" | null;
  reason: string;
  action: string;
  continuity: string;
  reports: Array<{ summary: string; status: string; registeredAt: string }>;
};

export async function getCustomerCompanyActionPoints(session: AuthSession): Promise<CustomerCompanyActionPoint[]> {
  const access = await getAccessibleOrganizationIdsForUser(session.user.id);
  if (access.isSuperadmin || access.organizationIds.length === 0) return [];

  const db = createSupabaseAdminClient();
  const [points, organizations, assets, followups, reports] = await Promise.all([
    db.schema("app_private").from("admin_company_action_points").select("*").in("organization_id", access.organizationIds).order("created_at", { ascending: false }),
    db.from("organizations").select("id,name").in("id", access.organizationIds),
    db.from("management_assets").select("id,organization_id,title,status,archived_at,current_published_version_id").in("organization_id", access.organizationIds),
    db.schema("app_private").from("manual_action_point_followups").select("id,action_point_id,organization_id").in("organization_id", access.organizationIds),
    db.schema("app_private").from("manual_action_point_reports").select("followup_id,organization_id,status,summary,registered_at,confirmed_at").in("organization_id", access.organizationIds).not("confirmed_at", "is", null).order("registered_at", { ascending: false }),
  ]);
  if (points.error || organizations.error || assets.error || followups.error || reports.error) throw new Error("Não foi possível consultar os action points da empresa.");
  if (!points.data?.length) return [];

  const companyNames = new Map((organizations.data ?? []).map(row => [row.id, row.name]));
  const assetById = new Map((assets.data ?? []).map(row => [row.id, row]));
  const actionByFollowup = new Map((followups.data ?? []).map(row => [row.id, row.action_point_id]));
  const reportsByAction = new Map<string, Array<{ summary: string; status: string; registeredAt: string }>>();
  for (const report of reports.data ?? []) {
    const actionId = actionByFollowup.get(report.followup_id);
    if (!actionId) continue;
    const current = reportsByAction.get(actionId) ?? [];
    current.push({ summary: report.summary, status: report.status, registeredAt: report.registered_at });
    reportsByAction.set(actionId, current);
  }
  const organizationIds = [...new Set(points.data.map(point => point.organization_id))];
  const peopleByOrganization = new Map<string, Map<string, { name: string; avatarUrl: string | null }>>();
  await Promise.all(organizationIds.map(async organizationId => {
    const installation = await getSlackBotTokenForOrganization(organizationId).catch(() => null);
    if (!installation) return;
    const users = await listSlackWorkspaceUsers(installation.botToken, true).catch(() => []);
    peopleByOrganization.set(`${organizationId}:${installation.teamId}`, new Map(users.map(user => [user.userId, { name: user.name, avatarUrl: user.avatarUrl }])));
  }));

  return points.data.map(point => {
    const asset = assetById.get(point.asset_id);
    const person = peopleByOrganization.get(`${point.organization_id}:${point.slack_team_id}`)?.get(point.slack_user_id);
    return {
      id: point.id, organizationId: point.organization_id, companyName: companyNames.get(point.organization_id) ?? "Empresa",
      title: point.title, assetId: point.asset_id, assetTitle: asset?.title ?? "Ativo indisponível",
      assetAvailable: Boolean(asset && asset.status === "publicado" && !asset.archived_at && asset.current_published_version_id),
      leaderUserId: point.slack_user_id, leaderName: person?.name ?? "Pessoa indisponível no Slack", leaderAvatarUrl: person?.avatarUrl ?? null,
      deadline: point.deadline, frequency: point.frequency, reason: point.reason, action: point.action, continuity: point.continuity,
      reports: reportsByAction.get(point.id) ?? [],
    };
  });
}
