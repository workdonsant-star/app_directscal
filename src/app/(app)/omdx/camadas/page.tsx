import type { Metadata } from "next";

import { AppTopbar } from "@/components/app-topbar";
import { LayerScoreDashboard } from "@/components/omdx/layer-score-dashboard";
import { OverviewDiagnosticFilter } from "@/components/omdx/overview-diagnostic-filter";
import { getOmdxOverviewPageData } from "@/lib/data/omdx-data-source";

export const metadata: Metadata = {
  title: "Camadas — Maturidade",
};

type LayersDashboardPageProps = {
  searchParams?: Promise<{ diagnostico?: string | string[] }>;
};

export default async function LayersDashboardPage({
  searchParams,
}: LayersDashboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const requestedDiagnostic =
    typeof resolvedSearchParams?.diagnostico === "string"
      ? resolvedSearchParams.diagnostico
      : "todos";
  const { analytics, diagnosticOptions, selectedDiagnostic } =
    await getOmdxOverviewPageData(requestedDiagnostic);

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Maturidade", href: "/omdx" },
          { label: "Camadas" },
        ]}
        actions={
          <OverviewDiagnosticFilter
            diagnostics={diagnosticOptions}
            value={selectedDiagnostic}
          />
        }
      />

      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
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
            dimensionScores={analytics.dimensions}
            dimensionSummary={analytics.dimensionSummary}
            leverageRows={analytics.leverageRows}
            scores={analytics.layerScores}
            summary={analytics.layerSummary}
            vulnerabilityRows={analytics.vulnerabilityRows}
          />
        </div>
      </main>
    </>
  );
}
