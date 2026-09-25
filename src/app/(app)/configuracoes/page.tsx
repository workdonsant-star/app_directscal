import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { CompanySettings } from "@/components/settings/company-settings";
import { OrganizationStructureSettings } from "@/components/settings/organization-structure-settings";
import { canManageOrganization } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";
import { getOrganizationStructure } from "@/lib/data/organization-structure-data-source";

export const metadata: Metadata = {
  title: "Configurações — Directscal",
};

export default async function SettingsPage() {
  const session = await getCurrentAuthSession();

  if (!session) {
    redirect("/entrar");
  }

  if (!canManageOrganization(session.user)) {
    redirect(session.user.role === "superadmin" ? "/admin/operacao" : "/omdx");
  }

  const profile = await getProfileSettingsData(session.user);
  const sectors = await getOrganizationStructure(profile.organizationId);

  return (
    <>
      <AppTopbar breadcrumb={[{ label: "Configurações" }]} />

      <AppPage className="min-w-0 overflow-x-clip">
        <div className="flex min-w-0 w-full flex-col gap-6">
          <OrganizationStructureSettings sectors={sectors} />
          <CompanySettings profile={profile} />
        </div>
      </AppPage>
    </>
  );
}
