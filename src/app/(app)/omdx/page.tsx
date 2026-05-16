import { Download } from "lucide-react";

import { AppTopbar } from "@/components/app-topbar";
import { ClusteringProcessChart } from "@/components/omdx/clustering-process-chart";
import { OverviewDiagnosticFilter } from "@/components/omdx/overview-diagnostic-filter";
import { OverviewExecutiveCards } from "@/components/omdx/overview-executive-cards";
import { LayerHeatmapComparisonChart } from "@/components/omdx/layer-heatmap-comparison-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getOmdxOverviewAnalytics,
  getOmdxOverviewDiagnosticOptions,
} from "@/lib/data/omdx-overview-analytics";
import {
  getDiagnosticById,
  getLatestReportableDiagnostic,
} from "@/lib/data/omdx-data-source";

type OverviewPageProps = {
  searchParams?: Promise<{ diagnostico?: string | string[] }>;
};

export default async function OverviewPage({
  searchParams,
}: OverviewPageProps) {
  const resolvedSearchParams = await searchParams;
  const diagnosticOptions = getOmdxOverviewDiagnosticOptions();
  const requestedDiagnostic =
    typeof resolvedSearchParams?.diagnostico === "string"
      ? resolvedSearchParams.diagnostico
      : "todos";
  const selectedDiagnostic = diagnosticOptions.some(
    (diagnostic) => diagnostic.id === requestedDiagnostic,
  )
    ? requestedDiagnostic
    : "todos";
  const reportDiagnostic =
    selectedDiagnostic === "todos"
      ? getLatestReportableDiagnostic()
      : getDiagnosticById(selectedDiagnostic);
  const analytics = getOmdxOverviewAnalytics(selectedDiagnostic);

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
              <Button
                size="sm"
                aria-label="Baixar relatório"
                nativeButton={false}
                render={<a href={`/omdx/${reportDiagnostic.id}/relatorio`} />}
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">Baixar relatório</span>
              </Button>
            )}
          </div>
        }
      />

      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
          <OverviewExecutiveCards metrics={analytics.metrics} />

          <section className="grid gap-8 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Agrupamento operacional</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Organiza dimensões por proximidade entre maturidade e
                  criticidade para indicar foco de gestão.
                </p>
              </CardHeader>
              <CardContent>
                <ClusteringProcessChart data={analytics.dimensions} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visão por camada</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Compara diretoria, liderança e time por dimensão em escala de
                  1 a 5.
                </p>
              </CardHeader>
              <CardContent>
                <LayerHeatmapComparisonChart data={analytics.dimensions} />
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </>
  );
}
