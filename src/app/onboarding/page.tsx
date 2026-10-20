import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ClientOnboarding } from "@/components/onboarding/client-onboarding";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getClientOnboardingForUser, getClientOnboardingWorkspace } from "@/lib/data/client-onboarding-data-source";
import { isSlackOAuthConfigured } from "@/lib/integrations/slack";

export const metadata: Metadata = { title: "Configuração inicial — Directscal" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ slack?: string }> }) {
  const session = await getCurrentAuthSession();
  if (!session || session.acquisition || session.leadershipInvitation) redirect("/entrar");
  if (session.user.role !== "cliente") redirect(session.user.role === "superadmin" ? "/admin/operacao" : "/omdx");
  const onboarding = await getClientOnboardingForUser(session.user.id);
  if (!onboarding || !onboarding.requiresOnboarding) redirect("/omdx");
  const [workspace, params] = await Promise.all([
    getClientOnboardingWorkspace(onboarding.organizationId), searchParams,
  ]);
  return <ClientOnboarding {...workspace} slackAvailable={isSlackOAuthConfigured()} slackResult={params.slack ?? null} />;
}
