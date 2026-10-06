import { redirect } from "next/navigation";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAppAccessContext } from "@/lib/auth/authorization";

export default async function InitiativesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getCurrentAppAccessContext();
  if (!context) redirect("/entrar");
  if (!canAccessCustomerApp(context.session.user)) redirect("/admin/operacao");
  return children;
}
