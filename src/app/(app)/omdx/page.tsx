import type { Metadata } from "next";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { LayerScoreDashboard } from "@/components/omdx/layer-score-dashboard";
import { OverviewDiagnosticFilter } from "@/components/omdx/overview-diagnostic-filter";
import { ProcessUsageSection } from "@/components/omdx/process-usage-section";
import { getOmdxOverviewPageData } from "@/lib/data/omdx-data-source";
import { getProcessUsageOverview } from "@/lib/data/process-usage-data-source";

export const metadata: Metadata = {
  title: "Analytics — Maturidade",
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
      <AppTopbar />

      <AppPage>
        <div className="flex w-full flex-col gap-4">
          {processUsage ? <ProcessUsageSection analytics={processUsage} /> : null}

          <section
            aria-labelledby="collection-results-title"
            className="flex flex-col gap-4"
          >
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <h1
                  id="collection-results-title"
                  className="text-[17px] leading-6 font-bold tracking-[-0.5px] text-foreground"
                >
                  Resultado de coletas
                </h1>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Compare como Fundador, Liderança e Time percebem a maturidade da
                  operação na escala de 1 a 5.
                </p>
              </div>
              <OverviewDiagnosticFilter
                diagnostics={diagnosticOptions}
                value={selectedDiagnostic}
                id="collection-diagnostic-filter"
              />
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
          </section>
        </div>
      </AppPage>
    </>
  );
}
