import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getAssetNavigationPreferences } from "@/lib/data/asset-navigation-data-source";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentAppAccessContext } from "@/lib/auth/authorization";
import { getSidebarCompanyName } from "@/lib/data/profile-data-source";
import { getManagementAssetCategoryFolders } from "@/lib/data/management-asset-categories";
import { listCustomerDocuments } from "@/lib/data/customer-documents-data-source";
import { getPublishedManagementAssets } from "@/lib/data/management-assets-data-source";
import { getClientOnboardingForUser } from "@/lib/data/client-onboarding-data-source";
import { isFeatureAcquisitionEnabled } from "@/lib/env";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppShellFallback />}>
      <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>
    </Suspense>
  );
}

function AppShellFallback() {
  return (
    <div role="status" aria-label="Carregando aplicativo" className="flex min-h-svh bg-shell">
      <div aria-hidden="true" className="hidden w-64 shrink-0 border-r border-border xl:block" />
      <div className="min-w-0 flex-1">
        <div aria-hidden="true" className="h-14 border-b border-border" />
        <div aria-hidden="true" className="p-6 lg:p-10">
          <div className="h-7 w-48 rounded bg-muted" />
          <div className="mt-6 h-11 max-w-2xl rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

async function AuthenticatedAppLayout({
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
  const [companyName, publishedAssets, assetNavigationPreferences, customerFiles] = await Promise.all([
    isSuperadmin
      ? accessContext.session.user.company
      : getSidebarCompanyName(
          accessContext.session.user,
          accessContext.access?.primaryOrganizationId ?? null,
        ).catch(() => accessContext.session.user.company),
    isSuperadmin ? [] : getPublishedManagementAssets().catch(() => []),
    accessContext.access?.primaryOrganizationId
      ? getAssetNavigationPreferences(accessContext.access.primaryOrganizationId)
      : { order: [], icons: {}, categories: [] },
    accessContext.access?.organizationIds.length
      ? listCustomerDocuments(accessContext.access.organizationIds, "asset")
      : [],
  ]);
  const knownFolders = getManagementAssetCategoryFolders([], assetNavigationPreferences.categories);
  const assetFolders = getManagementAssetCategoryFolders([
    ...publishedAssets,
    ...customerFiles.map(file => ({ category: knownFolders.find(folder => folder.key === file.categoryKey)?.title ?? null })),
  ], assetNavigationPreferences.categories);
  const sidebarUser = {
    ...accessContext.session.user,
    company: companyName,
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
