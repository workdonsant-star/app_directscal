import { notFound, redirect } from "next/navigation";
import { ReportWorkspace } from "@/components/reports/report-workspace";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getAdminDeliveryPublication } from "@/lib/data/admin-delivery-data-source";
import { getDiagnosticReport } from "@/lib/data/omdx-data-source";
import { getPublishedSpecialistContact } from "@/lib/data/person-profiles-data-source";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentAuthSession();

  if (!session) {
    redirect("/entrar");
  }

  if (!canAccessCustomerApp(session.user)) {
    redirect("/admin/operacao");
  }

  const { id } = await params;
  const [publication, report] = await Promise.all([
    getAdminDeliveryPublication(id),
    getDiagnosticReport(id),
  ]);

  if (!report || publication?.status !== "publicada" || publication.organizationId !== report.diagnostic.organizationId) {
    notFound();
  }
  const specialist = await getPublishedSpecialistContact(publication.specialistId);

  return <ReportWorkspace report={report} editorial={publication.report} specialist={specialist} />;
}
