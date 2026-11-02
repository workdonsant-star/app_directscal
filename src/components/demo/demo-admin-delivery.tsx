"use client";

import { DeliveryDraftProvider } from "@/components/admin/delivery/delivery-draft-provider";
import { DeliveryShell } from "@/components/admin/delivery/delivery-shell";
import { DeliveryReportStep } from "@/components/admin/delivery/delivery-report-step";
import { DeliveryActionPointsStep } from "@/components/admin/delivery/delivery-action-points-step";
import { DeliveryPublishStep } from "@/components/admin/delivery/delivery-publish-step";
import { SpecialistsProvider } from "@/components/admin/use-specialists";
import { AppTopbar } from "@/components/app-topbar";
import { AppPage } from "@/components/app-page";
import { demoAdminDeliveries, demoAdminPublication, demoAdminSpecialists } from "@/lib/data/demo/demo-admin-data";
import { demoReports } from "@/lib/data/demo/demo-data";
import { getAdminDeliveryAnalysisFromReport } from "@/lib/data/admin-delivery-domain";
import { DemoAdminCompany } from "./demo-admin-company";
import { useDemo } from "./demo-store";

export function DemoAdminDelivery({ deliveryId, step = "relatorio", assetId }: { deliveryId: string; step?: string; assetId?: string }) {
  const { state } = useDemo();
  const deliveries = demoAdminDeliveries(state);
  const delivery = deliveries.find(item => item.id === deliveryId);
  const report = demoReports.find(report => report.diagnostic.id === deliveryId);
  if (!delivery || !report || state.deletedCompanyIds?.includes("demo-vertex")) return <><AppTopbar /><AppPage>Entrega não encontrada.</AppPage></>;
  const storedPublication = state.adminPublications?.find(item => item.diagnosticId === deliveryId);
  const content = step === "action-points" ? <DeliveryActionPointsStep /> : step === "publicar" ? <DeliveryPublishStep /> : step === "ativos" ? <DemoAdminCompany section={assetId === "perguntas" ? "questions" : "assets"} assetId={assetId === "perguntas" ? undefined : assetId} deliveryId={deliveryId} /> : <DeliveryReportStep />;
  return <><AppTopbar breadcrumb={[{ label: "Empresas", href: "/demo/admin/empresas" }, { label: delivery.companyName }]} /><AppPage><SpecialistsProvider initialSpecialists={state.adminSpecialists ?? demoAdminSpecialists}><DeliveryDraftProvider key={`${deliveryId}:${storedPublication ? "saved" : "initial"}`} analysis={getAdminDeliveryAnalysisFromReport(report)} delivery={delivery} deliveryOptions={deliveries} publication={storedPublication ?? demoAdminPublication(state, deliveryId)}><DeliveryShell>{content}</DeliveryShell></DeliveryDraftProvider></SpecialistsProvider></AppPage></>;
}
