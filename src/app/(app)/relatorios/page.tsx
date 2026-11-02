import { redirect } from "next/navigation";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { ReportsList } from "@/components/reports/reports-list";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getPublishedDiagnosticIds } from "@/lib/data/admin-delivery-data-source";
import { listCustomerDocumentsForUser } from "@/lib/data/customer-documents-data-source";
import { getOmdxOverviewDiagnosticOptions } from "@/lib/data/omdx-data-source";

export const metadata = {
  title: "Relatórios — Directscal",
};

export default async function ReportsPage() {
  const session = await getCurrentAuthSession();

  if (!session) {
    redirect("/entrar");
  }

  if (!canAccessCustomerApp(session.user)) {
    redirect("/admin/operacao");
  }

  const [reportableDiagnostics, uploadedReports] = await Promise.all([getOmdxOverviewDiagnosticOptions(), listCustomerDocumentsForUser(session.user.id, "report")]);
  const publishedDiagnosticIds = await getPublishedDiagnosticIds(
    reportableDiagnostics.map((diagnostic) => diagnostic.id),
  );
  const diagnostics = reportableDiagnostics.filter((diagnostic) =>
    publishedDiagnosticIds.has(diagnostic.id),
  );

  return (
    <>
      <AppTopbar />

      <AppPage>
        <section aria-labelledby="reports-title" className="space-y-6">
          <div className="space-y-1">
            <h1 id="reports-title" className="text-ui-page">
              Relatórios
            </h1>
            <p className="text-sm text-muted-foreground">
              Consulte as análises geradas a partir dos diagnósticos da empresa.
            </p>
          </div>

          {uploadedReports.length ? <section className="space-y-3" aria-labelledby="uploaded-reports-title"><h2 id="uploaded-reports-title" className="text-ui-section">Relatórios enviados</h2><ul className="divide-y border-t">{uploadedReports.map(report => <li key={report.id} className="flex items-center justify-between gap-4 py-4"><div><a href={`/api/customer-documents/${report.id}`} className="font-medium underline underline-offset-4">{report.title}</a><p className="text-sm text-muted-foreground">PDF · <time dateTime={report.publishedAt}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(report.publishedAt))}</time></p></div></li>)}</ul></section> : null}
          <ReportsList diagnostics={diagnostics} />
        </section>
      </AppPage>
    </>
  );
}
