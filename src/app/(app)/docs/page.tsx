import { redirect } from "next/navigation";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { ProductGuide } from "@/components/help/product-guide";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";

export const metadata = { title: "Guia de uso — Directscal" };

export default async function DocumentationPage() {
  const session = await getCurrentAuthSession();
  if (!session) redirect("/entrar");
  if (!canAccessCustomerApp(session.user)) redirect("/admin/operacao");
  return <><AppTopbar /><AppPage><ProductGuide audience="customer" /></AppPage></>;
}
