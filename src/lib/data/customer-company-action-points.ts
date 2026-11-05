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
  followupCounts: { eligible: number; executed: number; partial: number };
  messages: Array<{ actor: "agente" | "pessoa"; text: string; at: string; status?: string; originalAvailable?: boolean }>;
};

function slackTime(value: string | null | undefined, fallback: string) {
  const milliseconds = value ? Number(value) * 1000 : NaN;
  return Number.isFinite(milliseconds) ? new Date(milliseconds).toISOString() : fallback;
}

function messageText(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value) || !("text" in value)) return null;
  return typeof value.text === "string" ? value.text : null;
}

export async function getCustomerCompanyActionPoints(session: AuthSession): Promise<CustomerCompanyActionPoint[]> {
  const access = await getAccessibleOrganizationIdsForUser(session.user.id);
  if (access.isSuperadmin || access.organizationIds.length === 0) return [];

  const db = createSupabaseAdminClient();
  const [points, organizations, assets, followups, reports] = await Promise.all([
    db.schema("app_private").from("admin_company_action_points").select("*").in("organization_id", access.organizationIds).order("created_at", { ascending: false }),
    db.from("organizations").select("id,name").in("id", access.organizationIds),
    db.from("management_assets").select("id,organization_id,title,status,archived_at,current_published_version_id").in("organization_id", access.organizationIds),
    db.schema("app_private").from("manual_action_point_followups").select("id,action_point_id,organization_id,question,message_ts,created_at,status,slack_team_id,slack_user_id,channel_id").in("organization_id", access.organizationIds),
    db.schema("app_private").from("manual_action_point_reports").select("followup_id,organization_id,slack_event_job_id,confirmation_job_id,status,registered_at,confirmed_at").in("organization_id", access.organizationIds).order("registered_at", { ascending: true }),
  ]);
  if (points.error || organizations.error || assets.error || followups.error || reports.error) throw new Error("Não foi possível consultar os action points da empresa.");
  if (!points.data?.length) return [];

  const sentFollowups = (followups.data ?? []).filter(followup => ["enviado", "respondido"].includes(followup.status) && followup.message_ts && followup.channel_id);
  const jobIds = [...new Set((reports.data ?? []).flatMap(report => [report.slack_event_job_id, report.confirmation_job_id].filter((id): id is string => Boolean(id))))];
  const [linkedJobs, threadJobs] = await Promise.all([
    jobIds.length ? db.schema("app_private").from("slack_delivery_jobs")
      .select("id,organization_id,team_id,question,reply,delivered_ts").in("organization_id", access.organizationIds).in("id", jobIds) : Promise.resolve(null),
    Promise.all(sentFollowups.map(followup => db.schema("app_private").from("slack_delivery_jobs")
      .select("id,organization_id,team_id,question,reply,delivered_ts")
      .eq("organization_id", followup.organization_id).eq("team_id", followup.slack_team_id)
      .contains("question", { threadTs: followup.message_ts }))),
  ]);
  if (linkedJobs?.error || threadJobs.some(result => result.error)) throw new Error("Não foi possível consultar as mensagens dos action points.");
  const jobsById = new Map([...linkedJobs?.data ?? [], ...threadJobs.flatMap(result => result.data ?? [])].map(job => [job.id, job]));

  const companyNames = new Map((organizations.data ?? []).map(row => [row.id, row.name]));
  const assetById = new Map((assets.data ?? []).map(row => [row.id, row]));
  const reportsByFollowup = new Map<string, NonNullable<typeof reports.data>>();
  for (const report of reports.data ?? []) {
    const current = reportsByFollowup.get(report.followup_id) ?? [];
    current.push(report);
    reportsByFollowup.set(report.followup_id, current);
  }
  const messagesByAction = new Map<string, CustomerCompanyActionPoint["messages"]>();
  const countsByAction = new Map<string, CustomerCompanyActionPoint["followupCounts"]>();
  const seenJobs = new Set<string>();
  const now = Date.now();
  const windowStart = now - 30 * 24 * 60 * 60 * 1000;
  for (const followup of sentFollowups) {
    const sentAt = slackTime(followup.message_ts, followup.created_at);
    const messages: CustomerCompanyActionPoint["messages"] = [{ actor: "agente", text: followup.question, at: sentAt }];
    const linkedReports = (reportsByFollowup.get(followup.id) ?? []).filter(report => report.organization_id === followup.organization_id);
    const sentTime = Date.parse(sentAt);
    const confirmed = linkedReports.filter(report => report.confirmed_at && Date.parse(report.confirmed_at) <= now)
      .sort((a, b) => Date.parse(b.confirmed_at!) - Date.parse(a.confirmed_at!))[0];
    if (sentTime >= windowStart && sentTime <= now && (confirmed || sentTime + 24 * 60 * 60 * 1000 <= now)) {
      const counts = countsByAction.get(followup.action_point_id) ?? { eligible: 0, executed: 0, partial: 0 };
      counts.eligible += 1;
      if (confirmed?.status === "executado_relato") counts.executed += 1;
      if (confirmed?.status === "parcial") counts.partial += 1;
      countsByAction.set(followup.action_point_id, counts);
    }
    const reportByJobId = new Map(linkedReports.map(report => [report.slack_event_job_id, report]));
    const relevantJobs = [...jobsById.values()].filter(job => {
      if (job.organization_id !== followup.organization_id || job.team_id !== followup.slack_team_id) return false;
      const inbound = job.question;
      if (!inbound || typeof inbound !== "object" || Array.isArray(inbound)) return false;
      return inbound.userId === followup.slack_user_id && inbound.channel === followup.channel_id && (
        inbound.threadTs === followup.message_ts ||
        linkedReports.some(report => job.id === report.slack_event_job_id || job.id === report.confirmation_job_id)
      );
    });
    if (relevantJobs.length === 0 && followup.status === "enviado") {
      messages[0].status = Date.now() - Date.parse(sentAt) >= 24 * 60 * 60 * 1000 ? "nao_respondido" : "aguardando";
    }
    for (const job of relevantJobs) {
      const jobId = job.id;
        if (!jobId || seenJobs.has(jobId)) continue;
        const inbound = job.question;
        if (!inbound || typeof inbound !== "object" || Array.isArray(inbound)) continue;
        seenJobs.add(jobId);
        const report = reportByJobId.get(jobId);
        messages.push({ actor: "pessoa", text: messageText(inbound) ?? "Mensagem original indisponível.", at: slackTime(typeof inbound.ts === "string" ? inbound.ts : null, report?.registered_at ?? followup.created_at), ...(report ? { status: report.status === "duvida" || report.confirmed_at ? report.status : "aguardando_confirmacao" } : {}), originalAvailable: messageText(inbound) !== null });
        const outgoing = job.delivered_ts ? messageText(job.reply) : null;
        if (outgoing !== null) messages.push({ actor: "agente", text: outgoing, at: slackTime(job.delivered_ts, report?.registered_at ?? followup.created_at) });
    }
    const current = messagesByAction.get(followup.action_point_id) ?? [];
    current.push(...messages);
    messagesByAction.set(followup.action_point_id, current);
  }
  for (const messages of messagesByAction.values()) messages.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
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
      followupCounts: countsByAction.get(point.id) ?? { eligible: 0, executed: 0, partial: 0 },
      messages: messagesByAction.get(point.id) ?? [],
    };
  });
}
