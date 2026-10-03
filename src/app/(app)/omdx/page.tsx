import type { Metadata } from "next";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { LayerScoreDashboard } from "@/components/omdx/layer-score-dashboard";
import { OverviewDiagnosticFilter } from "@/components/omdx/overview-diagnostic-filter";
import { ProcessUsageSection } from "@/components/omdx/process-usage-section";
import { getOmdxOverviewPageData } from "@/lib/data/omdx-data-source";
import { getProcessUsageOverview } from "@/lib/data/process-usage-data-source";

export const metadata: Metadata = {
  title: "Overview — Maturidade",
};

type MaturityPageProps = {
  searchParams?: Promise<{ diagnostico?: string | string[] }>;
};

export default async function MaturityPage({
  searchParams,
}: MaturityPageProps) {
  const resolvedSearchParams = await searchParams;
  const requestedDiagnostic =
    typeof resolvedSearchParams?.diagnostico === "string"
      ? resolvedSearchParams.diagnostico
      : "todos";

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
      <AppTopbar
        actions={
          <OverviewDiagnosticFilter
            diagnostics={diagnosticOptions}
            value={selectedDiagnostic}
          />
        }
      />

      <AppPage>
        <div className="flex w-full flex-col gap-8">
          <header className="max-w-2xl">
            <h1 className="text-2xl font-semibold text-foreground">
              Overview
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Compare como Fundador, Liderança e Time percebem a maturidade da
              operação na escala de 1 a 5.
            </p>
          </header>

          <LayerScoreDashboard
            comparison={comparison}
            dimensionScores={analytics.dimensions}
            dimensionSummary={analytics.dimensionSummary}
            leverageRows={analytics.leverageRows}
            metrics={analytics.summaryMetrics}
            scores={analytics.layerScores}
            summary={analytics.layerSummary}
            vulnerabilityRows={analytics.vulnerabilityRows}
          />

          {processUsage ? <ProcessUsageSection analytics={processUsage} /> : null}
        </div>
      </AppPage>
    </>
  );
}
