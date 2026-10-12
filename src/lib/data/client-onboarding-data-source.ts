import "server-only";

import { cache } from "react";
import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import type { AuthSession } from "@/lib/contracts";
import { getOrganizationStructure } from "@/lib/data/organization-structure-data-source";
import { getClientOnboardingProgress } from "@/lib/data/client-onboarding";
import { getSlackInstallationForOrganization } from "@/lib/integrations/slack";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const getClientOnboardingForUser = cache(async (userId: string) => {
  const access = await getAccessibleOrganizationIdsForUser(userId);
  if (access.isSuperadmin || !access.primaryOrganizationId) return null;
  const organizationId = access.primaryOrganizationId;
  const { data, error } = await createSupabaseAdminClient()
    .schema("app_private").from("client_onboarding_completions")
    .select("completed_at").eq("organization_id", organizationId).maybeSingle();
  if (error) throw new Error("Não foi possível consultar a configuração inicial da empresa.");
  return { organizationId, completed: Boolean(data) };
});

export async function getClientOnboardingWorkspace(organizationId: string) {
  const [connection, sectors, sectorCount] = await Promise.all([
    getSlackInstallationForOrganization(organizationId),
    getOrganizationStructure(organizationId),
    createSupabaseAdminClient().from("organization_sectors")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId).eq("active", true),
  ]);
  if (sectorCount.error || sectorCount.count === null) throw new Error("Não foi possível consultar os setores da empresa.");
  return { connection, sectors, progress: getClientOnboardingProgress(connection, sectors, sectorCount.count) };
}

export async function completeClientOnboarding(session: AuthSession) {
  if (session.user.role !== "cliente" || session.acquisition || session.leadershipInvitation) {
    return { ok: false, message: "Apenas o dono da empresa pode concluir a configuração." };
  }
  const onboarding = await getClientOnboardingForUser(session.user.id);
  if (!onboarding) return { ok: false, message: "Empresa não encontrada para esta conta." };
  if (onboarding.completed) return { ok: true };
  const { progress } = await getClientOnboardingWorkspace(onboarding.organizationId);
  if (!progress.canComplete) {
    return { ok: false, message: "Conecte o Slack e envie os convites das lideranças de todos os setores antes de continuar." };
  }
  const { data, error } = await createSupabaseAdminClient()
    .schema("app_private").from("client_onboarding_completions")
    .upsert({ organization_id: onboarding.organizationId, completed_by: session.user.id }, { onConflict: "organization_id", ignoreDuplicates: true })
    .select("organization_id");
  if (error || !data) throw new Error("Não foi possível concluir a configuração inicial.");
  return { ok: true };
}
