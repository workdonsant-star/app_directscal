import type { Metadata } from "next";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { AnalyticsOverview } from "@/components/omdx/analytics/analytics-overview";
import { AnalyticsExampleDashboard } from "@/components/omdx/analytics-example-dashboard";
import { getOmdxOverviewPageData } from "@/lib/data/omdx-data-source";
import { getProcessUsageOverview } from "@/lib/data/process-usage-data-source";

export const metadata: Metadata = {
  title: "Analytics — Maturidade",
};

type MaturityPageProps = {
  searchParams?: Promise<{ diagnostico?: string | string[]; exemplo?: string | string[] }>;
};

export default async function MaturityPage({
  searchParams,
}: MaturityPageProps) {
  const resolvedSearchParams = await searchParams;
  const requestedDiagnostic =
    typeof resolvedSearchParams?.diagnostico === "string"
      ? resolvedSearchParams.diagnostico
      : "todos";

  const showUsageExample = resolvedSearchParams?.exemplo === "uso";

  if (showUsageExample) {
    return <AnalyticsExampleDashboard diagnostic={requestedDiagnostic} />;
  }

  const [
    { analytics, comparison, diagnosticOptions, selectedDiagnostic },
    processUsage,
  ] = await Promise.all([
    getOmdxOverviewPageData(requestedDiagnostic),
    // Indicadores de uso são complementares: uma falha aqui não derruba o Overview.
    getProcessUsageOverview().catch((error: unknown) => {
      console.error("[overview] process usage failed", error);
      return null;
    }),
  ]);

  return (
    <>
      <AppTopbar />

      <AppPage>
        <AnalyticsOverview
          analytics={analytics}
          comparison={comparison}
          diagnosticOptions={diagnosticOptions}
          processUsage={processUsage}
          selectedDiagnostic={selectedDiagnostic}
        />
      </AppPage>
    </>
  );
}
