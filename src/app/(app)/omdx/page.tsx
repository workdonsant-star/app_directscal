import type { Metadata } from "next";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { LayerScoreDashboard } from "@/components/omdx/layer-score-dashboard";
import { OverviewDiagnosticFilter } from "@/components/omdx/overview-diagnostic-filter";
import { getOmdxOverviewPageData } from "@/lib/data/omdx-data-source";

export const metadata: Metadata = {
  title: "Camadas — Maturidade",
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

  const { analytics, comparison, diagnosticOptions, selectedDiagnostic } =
    await getOmdxOverviewPageData(requestedDiagnostic);

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
              Maturidade de Gestão
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
            scores={analytics.layerScores}
            summary={analytics.layerSummary}
            vulnerabilityRows={analytics.vulnerabilityRows}
          />
        </div>
      </AppPage>
    </>
  );
}
