import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { isFeatureAcquisitionEnabled } from "@/lib/env";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentAuthSession();

  if (!session) {
    redirect("/entrar");
  }

  return (
    <TooltipProvider delay={200}>
      <SidebarProvider>
        <AppSidebar
          acquisitionEnabled={isFeatureAcquisitionEnabled()}
          user={session.user}
        />
        <SidebarInset className="bg-background">{children}</SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
