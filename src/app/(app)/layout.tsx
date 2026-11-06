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
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppShellFallback />}>
      <AuthenticatedAppLayout>{children}</AuthenticatedAppLayout>
    </Suspense>
  );
}

function AppShellFallback() {
  return (
    <div role="status" aria-label="Carregando aplicativo" className="flex h-svh overflow-hidden bg-shell">
      <aside aria-hidden="true" className="hidden w-64 shrink-0 flex-col gap-5 px-3 pt-4 xl:flex">
        <div className="mb-8 flex items-center gap-3">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="flex flex-col gap-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div>
        </div>
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="flex items-center gap-3 px-2"><Skeleton className="size-6 rounded-md" /><Skeleton className="h-4 w-28" /></div>)}
      </aside>
      <div className="min-w-0 flex-1 p-3 md:py-5 md:pr-5 md:pl-0">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] bg-background pt-3 md:pt-5">
          <div aria-hidden="true" className="flex h-14 shrink-0 items-center px-6 lg:px-10">
            <Skeleton className="h-4 w-24" />
          </div>
          <div aria-hidden="true" className="min-h-0 flex-1 overflow-hidden px-6 pb-8 lg:px-10">
            <Skeleton className="h-7 w-64 max-w-full" />
            <Skeleton className="mt-3 h-4 w-96 max-w-full" />
            <div className="mt-10 grid gap-4 xl:grid-cols-2">
              <Skeleton className="h-72 rounded-[10px]" />
              <Skeleton className="h-72 rounded-[10px]" />
            </div>
          </div>
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
      ? "Directscal"
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
          canManageAssetCategories={sidebarUser.role === "cliente" && !accessContext.session.acquisition}
          acquisitionEnabled={isFeatureAcquisitionEnabled()}
          enabledModuleIds={accessContext.enabledModuleIds}
          user={sidebarUser}
          managementAssetCategories={assetFolders}
          initiativeScope={`${sidebarUser.id}:${accessContext.access?.primaryOrganizationId ?? "local"}`}
        />
        <SidebarInset className="overflow-clip bg-background">{children}</SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
