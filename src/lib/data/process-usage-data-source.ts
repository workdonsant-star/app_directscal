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

// Pessoas que podem consultar os processos: lideranças ativas da estrutura e
// time aprovado no cadastro operacional.
async function getTeamSize(organizationId: string) {
  const supabase = createSupabaseAdminClient();
  const [people, operational] = await Promise.all([
    supabase
      .from("organization_people")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "ativo"),
    supabase
      .from("operational_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "aprovado"),
  ]);

  if (people.error) throw people.error;
  if (operational.error) throw operational.error;

  return (people.count ?? 0) + (operational.count ?? 0);
}

export async function getProcessUsageOverview() {
  const session = await getCurrentAuthSession();

  if (!session || !canAccessCustomerApp(session.user)) return null;

  const access = await getAccessibleOrganizationIdsForUser(session.user.id);
  const organizationId = access.primaryOrganizationId;

  if (!organizationId) return null;

  const lookbackDays = Math.max(2 * PROCESS_USAGE_PERIOD_DAYS, PROCESS_USAGE_WEEKS * 7);
  const since = new Date(Date.now() - lookbackDays * DAY_MS).toISOString();
  const supabase = createSupabaseAdminClient();
  const [{ data: audits, error }, teamSize] = await Promise.all([
    supabase
      .from("asset_question_audits")
      .select("id,created_at,answer_status,user_id,external_user_id,citations")
      .eq("organization_id", organizationId)
      .gte("created_at", since)
      // Mais recentes primeiro: se o limite de linhas cortar, perde-se o passado.
      .order("created_at", { ascending: false })
      .limit(5000),
    getTeamSize(organizationId),
  ]);

  if (error) throw error;

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
      askerKey: audit.user_id ?? audit.external_user_id,
      citations: parseCitations(audit.citations),
    })),
    feedback,
    teamSize,
  });
}
