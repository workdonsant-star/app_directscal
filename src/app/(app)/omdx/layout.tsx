import { redirect } from "next/navigation";

import { getCurrentAppAccessContext } from "@/lib/auth/authorization";

export default async function OmdxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const accessContext = await getCurrentAppAccessContext();

  if (!accessContext) {
    redirect("/entrar");
  }

  const canAccessOmdx =
    accessContext.session.user.role === "superadmin" ||
    accessContext.enabledModuleIds?.includes("module_omdx") === true;

  if (!canAccessOmdx) {
    redirect("/docs");
  }

  return children;
}
