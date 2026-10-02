import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { CompanySettings } from "@/components/settings/company-settings";
import { OrganizationStructureSettings } from "@/components/settings/organization-structure-settings";
import { SlackIntegrationSettings } from "@/components/settings/slack-integration-settings";
import { canManageOrganization } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";
import { getOrganizationStructure } from "@/lib/data/organization-structure-data-source";
import {
  getSlackInstallationForOrganization,
  isSlackOAuthConfigured,
} from "@/lib/integrations/slack";

export const metadata: Metadata = {
  title: "Configurações — Directscal",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ slack?: string }>;
}) {
  const session = await getCurrentAuthSession();

  if (!session) {
    redirect("/entrar");
  }

  if (!canManageOrganization(session.user)) {
    redirect(session.user.role === "superadmin" ? "/admin/operacao" : "/omdx");
  }

  const profile = await getProfileSettingsData(session.user);
  const [sectors, slackConnection, { slack }] = await Promise.all([
    getOrganizationStructure(profile.organizationId),
    getSlackInstallationForOrganization(profile.organizationId).catch((error: unknown) => {
      console.error("[slack] installation lookup failed", error);
      return null;
    }),
    searchParams,
  ]);

  return (
    <>
      <AppTopbar />

      <AppPage className="min-w-0 overflow-x-clip">
        <div className="flex min-w-0 w-full flex-col gap-6">
          <OrganizationStructureSettings sectors={sectors} />
          <CompanySettings profile={profile} />
          <SlackIntegrationSettings
            available={isSlackOAuthConfigured()}
            connection={slackConnection}
            result={slack ?? null}
          />
        </div>
      </AppPage>
    </>
  );
}
