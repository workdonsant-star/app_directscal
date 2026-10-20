import "server-only";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export class SlackOperationsError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const cursorSchema = z.object({ at: z.iso.datetime({ offset: true }), id: z.uuid() }).strict();
async function authorize(companyId: string, actorId: string) {
  const organizationId = companyId.replace(/^company_/, "");
  if (!z.uuid().safeParse(organizationId).success || !z.uuid().safeParse(actorId).success) throw new SlackOperationsError(404, "Empresa indisponível.");
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("organization_members").select("id").eq("user_id", actorId).eq("role", "superadmin").limit(1);
  if (error) throw new SlackOperationsError(500, "Não foi possível verificar o acesso.");
  if (!data?.length) throw new SlackOperationsError(403, "Acesso restrito à operação DirectScal.");
  return { db, organizationId };
}
export async function listSlackDeliveries(companyId: string, actorId: string, cursor?: string | null) {
  const { db, organizationId } = await authorize(companyId, actorId);
  let query = db.schema("app_private").from("slack_delivery_jobs").select("id,event_id,status,attempts,retryable,available_at,question,reply,delivered_ts,error_code,received_at,updated_at").eq("organization_id", organizationId).order("received_at", { ascending: false }).order("id", { ascending: false }).limit(101);
  if (cursor) {
    let parsed;
    try { if (cursor.length > 1000) throw new Error(); parsed = cursorSchema.parse(JSON.parse(Buffer.from(cursor, "base64url").toString())); }
    catch { throw new SlackOperationsError(400, "Página inválida."); }
    query = query.or(`received_at.lt.${parsed.at},and(received_at.eq.${parsed.at},id.lt.${parsed.id})`);
  }
  const { data, error } = await query;
  if (error) throw new SlackOperationsError(500, "Não foi possível consultar as entregas do Slack.");
  const rows = data ?? []; const page = rows.slice(0, 100); const last = page.at(-1);
  return { items: page.map(row => {
    const question = row.question as { channel?: string; ts?: string; kind?: string; cycleId?: string };
    const reply = row.reply as { channel?: string } | null;
    const routine = question.kind === "rotina";
    return { id: row.id, eventId: row.event_id, source: routine ? "rotina" : "consulta", cycleId: question.cycleId ?? null, status: row.status, attempts: row.attempts, retryable: row.retryable, nextAttemptAt: row.available_at, channel: routine ? reply?.channel ?? null : question.channel ?? null, messageTs: routine ? null : question.ts ?? null, deliveredTs: row.delivered_ts, errorCode: row.error_code, receivedAt: row.received_at, updatedAt: row.updated_at };
  }), nextCursor: rows.length > 100 && last ? Buffer.from(JSON.stringify({ at: last.received_at, id: last.id })).toString("base64url") : null };
}
export async function retrySlackDelivery(companyId: string, actorId: string, id: string, expectedUpdatedAt: string) {
  const { db, organizationId } = await authorize(companyId, actorId);
  const { error } = await db.schema("app_private").rpc("retry_slack_delivery", { p_id: id, p_organization_id: organizationId, p_actor_user_id: actorId, p_expected_updated_at: expectedUpdatedAt });
  if (error) throw new SlackOperationsError(error.code === "PT409" ? 409 : error.code === "42501" ? 403 : 500, "A entrega mudou ou exige revisão antes de tentar novamente.");
}
