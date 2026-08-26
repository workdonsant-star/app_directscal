import { redirect } from "next/navigation";

import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAppAccessContext } from "@/lib/auth/authorization";

export default async function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const accessContext = await getCurrentAppAccessContext();

  if (!accessContext) {
    redirect("/entrar");
  }

  if (!canAccessCustomerApp(accessContext.session.user)) {
    redirect("/admin/modulos");
  }

  const canAccessOmdx =
    accessContext.enabledModuleIds?.includes("module_omdx") === true;

  if (!canAccessOmdx) {
    redirect("/docs");
  }

  return children;
}
