import "server-only";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { assistantHistoryCursorSchema, assistantHistoryPageSchema } from "@/lib/contracts/assistant-history";
import { assetQuestionCitationSchema } from "@/lib/contracts";
import { AssetAdherenceError } from "@/lib/data/asset-adherence-data-source";
import { getManagementAssetHref } from "@/lib/data/management-asset-routes";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
export async function getOwnAssistantHistory(cursor?: string) {
 const session = await getCurrentAuthSession();
 if (!session) throw new AssetAdherenceError("Entre para continuar.", 401);
 if (!["cliente", "admin"].includes(session.user.role) || session.acquisition || session.leadershipInvitation || !session.supabaseAccessToken) throw new AssetAdherenceError("Acesso restrito à conta definitiva do cliente.", 403);
 let before: {createdAt: string; id: string} | undefined;
 if (cursor) {
  try { if (cursor.length > 512) throw new Error(); before = assistantHistoryCursorSchema.parse(JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"))); }
  catch { throw new AssetAdherenceError("Página de histórico inválida.", 400); }
 }
 const access = await getAccessibleOrganizationIdsForUser(session.user.id);
 if (!access.primaryOrganizationId) throw new AssetAdherenceError("Empresa indisponível.", 403);
 const query = createSupabaseAdminClient().from("asset_question_audits").select("id,question,answer,answer_status,created_at,citations")
  .eq("organization_id", access.primaryOrganizationId).eq("user_id", session.user.id).eq("channel", "app")
  .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(26);
 if (before) query.or(`created_at.lt.${before.createdAt},and(created_at.eq.${before.createdAt},id.lt.${before.id})`);
 const { data, error } = await query;
 if (error) throw new AssetAdherenceError("Não foi possível consultar o histórico.", 500);
 const page = data.slice(0, 25), last = page.at(-1);
 return assistantHistoryPageSchema.parse({ items: page.map(row => ({ id: row.id, question: row.question, answer: row.answer, status: row.answer_status, createdAt: row.created_at,
   citations: (Array.isArray(row.citations) ? row.citations : []).flatMap(raw => { const parsed = assetQuestionCitationSchema.safeParse(raw); return parsed.success ? [{ ...parsed.data, href: getManagementAssetHref(parsed.data.assetType, parsed.data.assetId) }] : []; }),
  })), nextCursor: data.length > 25 && last ? Buffer.from(JSON.stringify({ createdAt: last.created_at, id: last.id })).toString("base64url") : null });
}
