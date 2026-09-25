import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentAppAccessContext } from "@/lib/auth/authorization";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";
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

  const companyProfile =
    accessContext.session.user.role === "superadmin"
      ? null
      : await getProfileSettingsData(accessContext.session.user).catch(
          () => null,
        );
  const sidebarUser = {
    ...accessContext.session.user,
    company: companyProfile?.company ?? accessContext.session.user.company,
  };

  return (
    <TooltipProvider delay={200}>
      <SidebarProvider>
        <AppSidebar
          acquisitionEnabled={isFeatureAcquisitionEnabled()}
          enabledModuleIds={accessContext.enabledModuleIds}
          user={sidebarUser}
        />
        <SidebarInset className="bg-background">{children}</SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
