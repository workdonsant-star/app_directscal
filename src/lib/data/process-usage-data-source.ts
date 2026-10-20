import "server-only";

import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { managementAssetTypeSchema } from "@/lib/contracts";
import {
  buildProcessUsageAnalytics,
  PROCESS_USAGE_PERIOD_DAYS,
  PROCESS_USAGE_WEEKS,
  type ProcessUsageAuditInput,
  type ProcessUsageFeedbackInput,
} from "@/lib/data/process-usage-analytics";
import { buildUsagePopulation, readAllUsageRows } from "@/lib/data/process-usage-population";
import { getSlackSectorLeaders } from "@/lib/data/slack-leadership-data-source";
import { getVerifiedSlackIdentities } from "@/lib/data/slack-identity-data-source";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const DAY_MS = 24 * 60 * 60 * 1000;
const FEEDBACK_BATCH_SIZE = 200;

function parseCitations(value: unknown): ProcessUsageAuditInput["citations"] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const citation = item as Record<string, unknown>;
    const assetType = managementAssetTypeSchema.safeParse(citation.assetType);

    return typeof citation.assetId === "string" &&
      typeof citation.title === "string" &&
      assetType.success
      ? [{ assetId: citation.assetId, title: citation.title, assetType: assetType.data }]
      : [];
  });
}

// Lideranças ativas (incluindo referências Slack) e time aprovado, sem copiar diretório.
async function getPopulation(organizationId: string) {
  const supabase = createSupabaseAdminClient();
  const [people, operational, slack, identities] = await Promise.all([
    readAllUsageRows((start, end) => supabase.from("organization_people")
      .select("id,auth_user_id,email").eq("organization_id", organizationId).eq("status", "ativo")
      .order("id").range(start, end)),
    readAllUsageRows((start, end) => supabase.from("operational_members")
      .select("id,email").eq("organization_id", organizationId).eq("status", "aprovado")
      .order("id").range(start, end)),
    getSlackSectorLeaders(organizationId),
    getVerifiedSlackIdentities(organizationId),
  ]);
  return buildUsagePopulation([
    ...people.map(person => ({key:`person:${person.id}`,appUserId:person.auth_user_id,email:person.email})),
    ...operational.map(person => ({key:`operational:${person.id}`,email:person.email})),
    ...slack.filter(sector => sector.active && sector.inviteStatus === "ativo" && sector.leader?.slackTeamId && sector.leader.slackUserId)
      .map(sector => ({key:`leader:${sector.id}`,slackIdentity:`${sector.leader!.slackTeamId}:${sector.leader!.slackUserId}`})),
  ], identities);
}

export async function getProcessUsageOverview() {
  const session = await getCurrentAuthSession();

  if (!session || !canAccessCustomerApp(session.user)) return null;

  const access = await getAccessibleOrganizationIdsForUser(session.user.id);
  const organizationId = access.primaryOrganizationId;

  if (!organizationId) return null;

  const lookbackDays = Math.max(2 * PROCESS_USAGE_PERIOD_DAYS, PROCESS_USAGE_WEEKS * 7);
  const now = new Date();
  const since = new Date(now.getTime() - lookbackDays * DAY_MS).toISOString();
  const supabase = createSupabaseAdminClient();
  const [audits, population] = await Promise.all([
    readAllUsageRows((start, end) => supabase.from("asset_question_audits")
      .select("id,created_at,answer_status,user_id,external_user_id,citations")
      .eq("organization_id", organizationId).gte("created_at", since).lt("created_at", now.toISOString())
      .order("created_at", { ascending: false }).order("id").range(start, end)),
    getPopulation(organizationId),
  ]);

  const feedback: ProcessUsageFeedbackInput[] = [];

  for (let start = 0; start < audits.length; start += FEEDBACK_BATCH_SIZE) {
    const ids = audits.slice(start, start + FEEDBACK_BATCH_SIZE).map((audit) => audit.id);
    const { data, error: feedbackError } = await supabase
      .from("asset_answer_feedback")
      .select("question_audit_id,value")
      .eq("organization_id", organizationId)
      .in("question_audit_id", ids);

    if (feedbackError) throw feedbackError;

    feedback.push(
      ...data.map((item) => ({ auditId: item.question_audit_id, value: item.value })),
    );
  }

  return buildProcessUsageAnalytics({
    audits: audits.map((audit) => ({
      id: audit.id,
      createdAt: audit.created_at,
      status: audit.answer_status,
      askerKey: population.resolveAsker(audit.user_id, audit.external_user_id),
      citations: parseCitations(audit.citations),
    })),
    feedback,
    teamSize: population.size,
    adoptionUnavailableReason: population.unresolved
      ? "Identidades de app e Slack ainda não conciliadas. Sem percentual de adoção."
      : audits.some(audit => !population.resolveAsker(audit.user_id, audit.external_user_id))
        ? "Há consultas sem vínculo confirmado com a população elegível. Sem percentual de adoção." : undefined,
    now,
  });
}
