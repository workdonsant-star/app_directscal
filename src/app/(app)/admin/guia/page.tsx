import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { ProductGuide } from "@/components/help/product-guide";

export const metadata = { title: "Guia de operação — Directscal" };

export default function OperationGuidePage() {
  return <><AppTopbar breadcrumb={[{ label: "Empresas", href: "/admin/empresas" }, { label: "Guia de operação" }]} /><AppPage><ProductGuide audience="operation" /></AppPage></>;
}
