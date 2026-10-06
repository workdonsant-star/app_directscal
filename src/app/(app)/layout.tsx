import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentAppAccessContext } from "@/lib/auth/authorization";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";
import { getManagementAssetCategoryFolders } from "@/lib/data/management-asset-categories";
import { getPublishedManagementAssets } from "@/lib/data/management-assets-data-source";
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

  const isSuperadmin = accessContext.session.user.role === "superadmin";
  const [companyProfile, publishedAssets] = await Promise.all([
    isSuperadmin ? null : getProfileSettingsData(accessContext.session.user).catch(() => null),
    isSuperadmin ? [] : getPublishedManagementAssets().catch(() => []),
  ]);
  const assetFolders = getManagementAssetCategoryFolders(publishedAssets);
  const sidebarUser = {
    ...accessContext.session.user,
    company: companyProfile?.company ?? accessContext.session.user.company,
  };

  return (
    <TooltipProvider delay={200}>
      <SidebarProvider className="app-shell bg-shell">
        <AppSidebar
          acquisitionEnabled={isFeatureAcquisitionEnabled()}
          enabledModuleIds={accessContext.enabledModuleIds}
          user={sidebarUser}
          managementAssetCategories={assetFolders}
          initiativeScope={`${sidebarUser.id}:${accessContext.access?.primaryOrganizationId ?? "local"}`}
        />
        <SidebarInset className="bg-shell">{children}</SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
