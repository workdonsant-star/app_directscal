import { redirect } from "next/navigation";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { UploadedReportsList } from "@/components/reports/uploaded-reports-list";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { listCustomerDocumentsForUser } from "@/lib/data/customer-documents-data-source";

export const metadata = { title: "Diagnósticos — Directscal" };

export default async function ReportsPage() {
  const session = await getCurrentAuthSession();
  if (!session) redirect("/entrar");
  if (!canAccessCustomerApp(session.user)) redirect("/admin/operacao");

  const documents = await listCustomerDocumentsForUser(session.user.id, "report");

  return <>
    <AppTopbar />
    <AppPage>
      <section aria-labelledby="diagnostics-title" className="space-y-6">
        <div className="space-y-1">
          <h1 id="diagnostics-title" className="text-ui-page">Diagnósticos</h1>
          <p className="text-sm text-muted-foreground">Consulte os diagnósticos em PDF enviados pela Directscal.</p>
        </div>
        <UploadedReportsList documents={documents} />
      </section>
    </AppPage>
  </>;
}
