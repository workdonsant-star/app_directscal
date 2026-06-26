import { redirect } from "next/navigation";

import { AppTopbar } from "@/components/app-topbar";
import { OverviewCharts } from "@/components/omdx/overview-charts";
import { OverviewDiagnosticFilter } from "@/components/omdx/overview-diagnostic-filter";
import { OverviewDimensionResultsTable } from "@/components/omdx/overview-dimension-results-table";
import { OverviewExecutiveCards } from "@/components/omdx/overview-executive-cards";
import { ReportDownloadMenu } from "@/components/omdx/report-download-menu";
import { getOmdxOverviewPageData } from "@/lib/data/omdx-data-source";
import { getOperationalOnboardingGateForCurrentUser } from "@/lib/data/operational-onboarding-data-source";

type OverviewPageProps = {
  searchParams?: Promise<{ diagnostico?: string | string[] }>;
};

export default async function OverviewPage({
  searchParams,
}: OverviewPageProps) {
  const resolvedSearchParams = await searchParams;
  const requestedDiagnostic =
    typeof resolvedSearchParams?.diagnostico === "string"
      ? resolvedSearchParams.diagnostico
      : "todos";
  const onboardingGate = await getOperationalOnboardingGateForCurrentUser();

  if (onboardingGate.required) {
    redirect("/pessoas/diretorio");
  }

  const {
    analytics,
    diagnosticOptions,
    reportDiagnostic,
    selectedDiagnostic,
  } = await getOmdxOverviewPageData(requestedDiagnostic);

  return (
    <>
      <AppTopbar
        actions={
          <div className="flex min-w-0 items-center gap-2">
            <OverviewDiagnosticFilter
              diagnostics={diagnosticOptions}
              value={selectedDiagnostic}
            />
            {reportDiagnostic && (
              <ReportDownloadMenu
                diagnosticId={reportDiagnostic.id}
                hideLabelOnMobile
                size="sm"
              />
            )}
          </div>
        }
      />

      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <OverviewExecutiveCards metrics={analytics.metrics} />

          <OverviewCharts data={analytics.dimensions} />

          <OverviewDimensionResultsTable data={analytics.dimensions} />
        </div>
      </main>
    </>
  );
}
