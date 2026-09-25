import { CalendarDays, Download } from "lucide-react";
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

  if (!report || publication?.status !== "publicada") {
    notFound();
  }

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Relatórios", href: "/relatorios" },
          { label: report.diagnostic.name },
        ]}
      />

      <AppPage className="min-w-0">
        <div className="grid w-full gap-10 xl:grid-cols-[224px_minmax(0,1fr)_192px]">
          <aside
            aria-labelledby="report-navigation-title"
            className="hidden self-stretch xl:col-start-1 xl:row-start-1 xl:block"
          >
            <div className="sticky top-[5.5rem] rounded-[5px] border p-5">
              <p
                id="report-navigation-title"
                className="mb-4 text-sm font-medium"
              >
                Neste relatório
              </p>
              <DocumentTableOfContents
                ariaLabel="Navegação do relatório"
                items={reportSections}
              />

              <div className="mt-5 flex flex-col items-start gap-2 border-t pt-5">
                <Button
                  nativeButton={false}
                  render={<Link href="/gantt" />}
                >
                  <CalendarDays aria-hidden="true" />
                  Action Points
                </Button>
                <Button
                  nativeButton={false}
                  variant="outline"
                  render={<a href={`/omdx/${id}/relatorio`} />}
                >
                  <Download aria-hidden="true" />
                  Baixar PDF
                </Button>
              </div>
            </div>
          </aside>

          <aside className="xl:col-start-3 xl:row-start-1">
            <div className="sticky top-[5.5rem]">
              <SpecialistContactCard />
            </div>
          </aside>

          <div className="mx-auto min-w-0 w-full xl:col-start-2 xl:row-start-1 xl:w-4/5">
            <OmdxReportView editorial={publication.report} report={report} />
          </div>
        </div>
      </AppPage>
    </>
  );
}
