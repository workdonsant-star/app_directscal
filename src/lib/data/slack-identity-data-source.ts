import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import type { AuthSession } from "@/lib/contracts/auth";
import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSlackInstallationForOrganization } from "@/lib/integrations/slack";

export class SlackIdentityError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const verifiedSchema = z.object({ appUserId: z.uuid(), slackIdentity: z.string().min(3), teamId: z.string().min(1), slackUserId: z.string().min(1), verifiedAt: z.string() });
async function scope(session: AuthSession) {
  if (session.user.role === "superadmin" || session.acquisition || session.leadershipInvitation || !session.supabaseAccessToken) throw new SlackIdentityError(403, "Entre com uma conta definitiva da empresa.");
  const access = await getAccessibleOrganizationIdsForUser(session.user.id);
  if (access.isSuperadmin || !access.primaryOrganizationId) throw new SlackIdentityError(403, "Conta sem acesso à empresa.");
  return access.primaryOrganizationId;
}
export async function getVerifiedSlackIdentities(organizationId: string) {
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("get_verified_slack_identities", { p_organization_id: organizationId });
  if (error) throw new Error("Não foi possível consultar as identidades verificadas.");
  return verifiedSchema.array().parse(data);
}
export async function getSlackIdentityStatus(session: AuthSession) {
  const organizationId = await scope(session);
  const [installation, links] = await Promise.all([getSlackInstallationForOrganization(organizationId), getVerifiedSlackIdentities(organizationId)]);
  const own = links.find(link => link.appUserId === session.user.id);
  return { available: Boolean(installation), connected: Boolean(own), workspace: installation?.teamName ?? null, verifiedAt: own?.verifiedAt ?? null };
}
export async function startSlackIdentity(session: AuthSession) {
  const organizationId = await scope(session);
  const code = `dsc_${randomBytes(32).toString("base64url")}`;
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("start_slack_identity", { p_organization_id: organizationId, p_user_id: session.user.id, p_code_hash: createHash("sha256").update(code).digest("hex") });
  if (error) throw new SlackIdentityError(error.code === "PT429" ? 429 : error.code === "PT409" ? 409 : error.code === "42501" ? 403 : 500, error.code === "PT429" ? "Aguarde 30 segundos antes de gerar outro código." : "Não foi possível gerar o código. Confira a conexão Slack da empresa.");
  return { command: `vincular ${code}`, expiresAt: data };
}
export async function unlinkSlackIdentity(session: AuthSession) {
  const organizationId = await scope(session);
  const { error } = await createSupabaseAdminClient().schema("app_private").rpc("unlink_slack_identity", { p_organization_id: organizationId, p_user_id: session.user.id });
  if (error) throw new SlackIdentityError(500, "Não foi possível desvincular sua identidade.");
}
export async function completeSlackIdentity(jobId: string, leaseId: string) {
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("complete_slack_identity", { p_job_id: jobId, p_lease_id: leaseId });
  if (error) throw new Error("Não foi possível registrar a confirmação de identidade.");
  return data;
}
