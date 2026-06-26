import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentAppAccessContext } from "@/lib/auth/authorization";
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

  return (
    <TooltipProvider delay={200}>
      <SidebarProvider>
        <AppSidebar
          acquisitionEnabled={isFeatureAcquisitionEnabled()}
          enabledModuleIds={accessContext.enabledModuleIds}
          user={accessContext.session.user}
        />
        <SidebarInset className="bg-background">{children}</SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
