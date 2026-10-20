import { redirect } from "next/navigation";

import { getAssetNavigationPreferences } from "@/lib/data/asset-navigation-data-source";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentAppAccessContext } from "@/lib/auth/authorization";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";
import { getManagementAssetCategoryFolders } from "@/lib/data/management-asset-categories";
import { getPublishedManagementAssets } from "@/lib/data/management-assets-data-source";
import { getClientOnboardingForUser } from "@/lib/data/client-onboarding-data-source";
import { isFeatureAcquisitionEnabled } from "@/lib/env";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const accessContext = await getCurrentAppAccessContext();

  if (!accessContext) {
    redirect("/entrar");
  }

  if (accessContext.session.user.role === "cliente") {
    const onboarding = await getClientOnboardingForUser(accessContext.session.user.id);
    if (onboarding && onboarding.requiresOnboarding) redirect("/onboarding");
  }

  const isSuperadmin = accessContext.session.user.role === "superadmin";
  const [companyProfile, publishedAssets] = await Promise.all([
    isSuperadmin ? null : getProfileSettingsData(accessContext.session.user).catch(() => null),
    isSuperadmin ? [] : getPublishedManagementAssets().catch(() => []),
  ]);
  const assetNavigationPreferences = accessContext.access?.primaryOrganizationId
    ? await getAssetNavigationPreferences(accessContext.access.primaryOrganizationId)
    : { order: [], icons: {} };
  const assetFolders = getManagementAssetCategoryFolders(publishedAssets, assetNavigationPreferences.categories);
  const sidebarUser = {
    ...accessContext.session.user,
    company: companyProfile?.company ?? accessContext.session.user.company,
  };

  return (
    <TooltipProvider delay={200}>
      <SidebarProvider className="app-shell bg-shell">
        <AppSidebar
          assetNavigationPreferences={assetNavigationPreferences}
          acquisitionEnabled={isFeatureAcquisitionEnabled()}
          enabledModuleIds={accessContext.enabledModuleIds}
          user={sidebarUser}
          managementAssetCategories={assetFolders}
          initiativeScope={`${sidebarUser.id}:${accessContext.access?.primaryOrganizationId ?? "local"}`}
        />
        <SidebarInset className="overflow-clip bg-shell">{children}</SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
