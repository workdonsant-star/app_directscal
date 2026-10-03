import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Link from "next/link";
import { ManagementAssetsWorkspace } from "@/components/admin/management-assets-workspace";
import { ManagementAssetEditorWorkspace } from "@/components/admin/management-asset-editor-workspace";
import { AssetQuestionAuditsWorkspace } from "@/components/admin/asset-question-audits-workspace";
import { managementAssetTemplates } from "@/lib/data/management-asset-templates";
import { adminSpecialists } from "@/lib/data/admin-operations-data-source";
import { getAdminManagementAssetDetail, listAdminAssetQuestionAudits, listAdminManagementAssets, ManagementAssetError } from "@/lib/data/management-assets-admin-data-source";
import { AdminDeliveryWorkspace } from "@/components/admin/admin-delivery-workspace";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import {
  getAdminDeliveryAnalysisFromReport,
  mapAdminDeliveryFromReport,
} from "@/lib/data/admin-operations-data-source";
import { getAdminDeliveryPublication } from "@/lib/data/admin-delivery-data-source";
import { getAdminDiagnosticReports } from "@/lib/data/omdx-data-source";

export const metadata: Metadata = {
  title: "Entrega — Admin Directscal",
};

export default async function AdminDeliveryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string; ativo?: string; perguntas?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const reports = await getAdminDiagnosticReports();
  const report = reports.find((item) => item.diagnostic.id === id);

  if (!report) notFound();
  const publication = await getAdminDeliveryPublication(id);
  const mappedDelivery = mapAdminDeliveryFromReport(report);
  const delivery = publication
    ? {
        ...mappedDelivery,
        specialistId: publication.specialistId,
        status: publication.status,
      }
    : mappedDelivery;
  const analysis = getAdminDeliveryAnalysisFromReport(report);
  const deliveryOptions = reports
    .filter(
      (item) =>
        item.diagnostic.organizationId === report.diagnostic.organizationId,
    )
    .map(mapAdminDeliveryFromReport)
    .sort((first, second) => second.closedAt.localeCompare(first.closedAt))
    .map((item) => ({
      id: item.id,
      diagnosticName: item.diagnosticName,
      closedAt: item.closedAt,
    }));

  const company = { id: `company_${report.diagnostic.organizationId}`, organizationId: report.diagnostic.organizationId, name: delivery.companyName };
  const specialists = adminSpecialists.filter((item) => item.status === "ativo").map((item) => ({ id: item.id, name: item.name }));
  let assetsContent;
  const backToAssets = <Link href={`/admin/entregas/${id}?aba=ativos`} className="inline-block rounded-sm text-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring">Voltar aos ativos da empresa</Link>;
  if (query.ativo) {
    const asset = await getAdminManagementAssetDetail(query.ativo).catch((error: unknown) => {
      if (error instanceof ManagementAssetError && error.status === 404) return null;
      throw error;
    });
    if (!asset || asset.organizationId !== company.organizationId) notFound();
    assetsContent = <>{backToAssets}<ManagementAssetEditorWorkspace key={asset.id} initialAsset={asset} specialists={specialists} embedded deliveryId={id} /></>;
  } else if (query.perguntas === "1") {
    const audits = await listAdminAssetQuestionAudits({ onlyGaps: false, organizationId: company.organizationId });
    assetsContent = <>{backToAssets}<AssetQuestionAuditsWorkspace audits={audits} company={company} embedded /></>;
  } else {
    const assets = await listAdminManagementAssets(company.organizationId);
    assetsContent = <ManagementAssetsWorkspace assets={assets} company={company} specialists={specialists} templates={managementAssetTemplates} embedded deliveryId={id} />;
  }

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Operação", href: "/admin/operacao" },
          { label: delivery.companyName },
        ]}
      />
      <AppPage>
        <AdminDeliveryWorkspace
          analysis={analysis}
          delivery={delivery}
          deliveryOptions={deliveryOptions}
          publication={publication}
          assetsContent={assetsContent}
          initialTab={query.aba === "ativos" || query.ativo || query.perguntas === "1" ? "ativos" : "dados"}
        />
      </AppPage>
    </>
  );
}
