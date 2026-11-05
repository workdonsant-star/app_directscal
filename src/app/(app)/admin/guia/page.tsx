import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { ProductGuide } from "@/components/help/product-guide";

export const metadata = { title: "Guia de operação — Directscal" };

export default function OperationGuidePage() {
  return <><AppTopbar /><AppPage><ProductGuide audience="operation" /></AppPage></>;
}
