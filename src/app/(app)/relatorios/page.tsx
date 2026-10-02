import { redirect } from "next/navigation";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { ReportsList } from "@/components/reports/reports-list";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getPublishedDiagnosticIds } from "@/lib/data/admin-delivery-data-source";
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

  const reportableDiagnostics = await getOmdxOverviewDiagnosticOptions();
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
            <h1 id="reports-title" className="font-heading text-2xl font-semibold">
              Relatórios
            </h1>
            <p className="text-sm text-muted-foreground">
              Consulte as análises geradas a partir dos diagnósticos da empresa.
            </p>
          </div>

          <ReportsList diagnostics={diagnostics} />
        </section>
      </AppPage>
    </>
  );
}
