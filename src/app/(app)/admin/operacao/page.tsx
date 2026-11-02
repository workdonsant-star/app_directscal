import type { Metadata } from "next";

import { AdminOperationsWorkspace } from "@/components/admin/admin-operations-workspace";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { mapAdminDeliveryFromReport } from "@/lib/data/admin-operations-data-source";
import { getOrganizationOperations } from "@/lib/data/admin-company-operations-data-source";
import { requireAdminPageSession } from "@/lib/data/admin-page-data";
import { getSpecialists } from "@/lib/data/person-profiles-data-source";
import { SpecialistsProvider } from "@/components/admin/use-specialists";
import { getAdminDiagnosticReports } from "@/lib/data/omdx-data-source";

export const metadata: Metadata = {
  title: "Operação — Admin Directscal",
};

export default async function AdminOperationsPage() {
  const session = await requireAdminPageSession();
  const [reports, specialists] = await Promise.all([
    getAdminDiagnosticReports(),
    getSpecialists(),
  ]);
  const organizationIds = [...new Set(reports.map(report => report.diagnostic.organizationId))];
  const operations = session?.user.role === "superadmin"
    ? await Promise.all(organizationIds.map(id => getOrganizationOperations(id, session.user.id))) : [];
  const states = new Map(operations.flatMap(operation => operation.deliveries.map(delivery => [delivery.id, delivery] as const)));
  const deliveries = reports.map((report) => {
    const delivery = mapAdminDeliveryFromReport(report);
    const publication = states.get(delivery.diagnosticId);

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
      <AppTopbar />
      <AppPage>
        <SpecialistsProvider initialSpecialists={specialists.filter((item) => !item.deleted)}>
          <AdminOperationsWorkspace deliveries={deliveries} />
        </SpecialistsProvider>
      </AppPage>
    </>
  );
}
