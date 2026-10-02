import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        />
      </AppPage>
    </>
  );
}
