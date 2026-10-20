import { ReportPdfDownload } from "@/components/reports/report-pdf-download";
import { redirect } from "next/navigation";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { DocumentTableOfContents } from "@/components/document-table-of-contents";
import { OmdxReportView } from "@/components/reports/omdx-report-view";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { acmeReportEditorial, buildAcmeReportExample } from "@/lib/data/acme-report-example";

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

export default async function AcmeReportExamplePage() {
  const session = await getCurrentAuthSession();

  if (!session) {
    redirect("/entrar");
  }

  if (!canAccessCustomerApp(session.user)) {
    redirect("/admin/operacao");
  }

  const report = buildAcmeReportExample();

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
              <div className="mt-6"><ReportPdfDownload href="/relatorios/exemplo-acme/download" /></div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-6 lg:hidden"><ReportPdfDownload href="/relatorios/exemplo-acme/download" /></div>
            <OmdxReportView editorial={acmeReportEditorial} report={report} example />
          </div>
        </div>
      </AppPage>
    </>
  );
}
