import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminCompanyTabs } from "@/components/admin/admin-company-tabs";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { AnalyticsOverview } from "@/components/omdx/analytics/analytics-overview";
import { selectCollectionForOverview } from "@/lib/data/collection-comparison";
import { getAdminCompanyOverview } from "@/lib/data/admin-company-operations-data-source";
import { requireAdminPageSession } from "@/lib/data/admin-page-data";
import { getAdminDiagnosticReports } from "@/lib/data/omdx-data-source";
import { buildOmdxOverviewComparisonFromReports } from "@/lib/data/omdx-overview-analytics";
import { getAdminProcessUsageOverview } from "@/lib/data/process-usage-data-source";

export const metadata: Metadata = { title: "Empresa — Admin Directscal" };

export default async function AdminCompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ diagnostico?: string | string[] }>;
}) {
  const { id } = await params;
  const requested = (await searchParams)?.diagnostico;
  await requireAdminPageSession();
  const company = await getAdminCompanyOverview(id);
  if (!company) notFound();

  const organizationId = company.organizationId;
  const [reports, processUsage] = organizationId
    ? await Promise.all([
        getAdminDiagnosticReports(undefined, undefined, organizationId, true),
        getAdminProcessUsageOverview(organizationId).catch((error: unknown) => {
          console.error("[admin company] process usage failed", error);
          return null;
        }),
      ])
    : [[], null];
  const selectedDiagnostic = selectCollectionForOverview(
    reports,
    typeof requested === "string" ? requested : undefined,
  )?.diagnostic.id ?? "todos";
  const { analytics, comparison } = buildOmdxOverviewComparisonFromReports(reports, selectedDiagnostic);

  return (
    <>
      <AppTopbar breadcrumb={[{ label: "Empresas", href: "/admin/empresas" }, { label: company.name }]} />
      <AppPage>
        <div className="flex w-full flex-col gap-8">
          <header>
            <h1 className="text-ui-page">{company.name}</h1>
          </header>
          <AdminCompanyTabs companyId={id} active="overview" hasOrganization={Boolean(organizationId)} showActionPoints={Boolean(organizationId)} />
          {organizationId ? (
            <AnalyticsOverview
              analytics={analytics}
              comparison={comparison}
              diagnosticOptions={reports.map(report => report.diagnostic)}
              processUsage={processUsage ? {
                ...processUsage,
                processes: processUsage.processes.map(process => ({ ...process, href: null })),
              } : null}
              selectedDiagnostic={selectedDiagnostic}
              showActionPointsLink={false}
              concise
            />
          ) : (
            <p className="py-12 text-sm text-muted-foreground">A empresa precisa concluir o cadastro antes de apresentar dados de Analytics.</p>
          )}
        </div>
      </AppPage>
    </>
  );
}
