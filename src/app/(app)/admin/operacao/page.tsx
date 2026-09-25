import type { Metadata } from "next";

import { AdminOperationsWorkspace } from "@/components/admin/admin-operations-workspace";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { mapAdminDeliveryFromReport } from "@/lib/data/admin-operations-data-source";
import { getAdminDeliveryPublications } from "@/lib/data/admin-delivery-data-source";
import { getAdminDiagnosticReports } from "@/lib/data/omdx-data-source";

export const metadata: Metadata = {
  title: "Operação — Admin Directscal",
};

export default async function AdminOperationsPage() {
  const reports = await getAdminDiagnosticReports();
  const publications = await getAdminDeliveryPublications(
    reports.map((report) => report.diagnostic.id),
  );
  const publicationsByDiagnosticId = new Map(
    publications.map((publication) => [publication.diagnosticId, publication]),
  );
  const deliveries = reports.map((report) => {
    const delivery = mapAdminDeliveryFromReport(report);
    const publication = publicationsByDiagnosticId.get(delivery.diagnosticId);

    return publication
      ? {
          ...delivery,
          specialistId: publication.specialistId,
          status: publication.status,
        }
      : delivery;
  });

  return (
    <>
      <AppTopbar breadcrumb={[{ label: "Admin" }, { label: "Operação" }]} />
      <AppPage>
        <AdminOperationsWorkspace deliveries={deliveries} />
      </AppPage>
    </>
  );
}
