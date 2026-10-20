import { ReportPdfDownload } from "@/components/reports/report-pdf-download";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { DocumentTableOfContents } from "@/components/document-table-of-contents";
import { OmdxReportView } from "@/components/reports/omdx-report-view";
import { SpecialistContactCard } from "@/components/reports/specialist-contact-card";
import { Button } from "@/components/ui/button";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getAdminDeliveryPublication } from "@/lib/data/admin-delivery-data-source";
import { getDiagnosticReport } from "@/lib/data/omdx-data-source";
import { getPublishedSpecialistContact } from "@/lib/data/person-profiles-data-source";

const reportSections = [
  { href: "#metodologia", label: "Metodologia" },
  { href: "#maturidade", label: "Maturidade" },
  { href: "#bloqueadores", label: "Bloqueadores" },
  { href: "#anatomia", label: "Anatomia" },
  { href: "#nucleo", label: "Núcleo dos desafios" },
  { href: "#alavancas", label: "Alavancas" },
  { href: "#implementacoes", label: "Implementações" },
  { href: "#conclusao", label: "Conclusão" },
];

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

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Relatórios", href: "/relatorios" },
          { label: report.diagnostic.name },
        ]}
      />

      <AppPage className="min-w-0">
        <div className="grid w-full max-w-[1028px] grid-cols-1 lg:grid-cols-[220px_minmax(0,768px)] lg:gap-10">
          <aside
            className="hidden lg:block"
          >
            <div className="sticky top-8 px-4">
              <DocumentTableOfContents
                ariaLabel="Navegação do relatório"
                items={reportSections}
              />

              <div className="mt-6 flex flex-col items-start gap-2">
                <Button
                  nativeButton={false}
                  render={<Link href={`/action-points?diagnostico=${id}`} />}
                >
                  <CalendarDays aria-hidden="true" />
                  Action Points
                </Button>
                <ReportPdfDownload href={`/omdx/${id}/relatorio`} />
              </div>
              <div className="mt-6">
                <SpecialistContactCard specialist={specialist} />
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-6 space-y-4 lg:hidden"><ReportPdfDownload href={`/omdx/${id}/relatorio`} /><SpecialistContactCard specialist={specialist} /></div>
            <OmdxReportView editorial={publication.report} report={report} />
          </div>
        </div>
      </AppPage>
    </>
  );
}
