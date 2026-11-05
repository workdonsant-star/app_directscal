import { AnalyticsDimensionGapChart } from "@/components/omdx/analytics/analytics-dimension-gap-chart";
import { AnalyticsLayerPerceptionChart } from "@/components/omdx/analytics/analytics-layer-perception-chart";
import { AnalyticsLevel } from "@/components/omdx/analytics/analytics-primitives";
import { AnalyticsQuestionTable } from "@/components/omdx/analytics/analytics-question-table";
import { OverviewDiagnosticFilter } from "@/components/omdx/overview-diagnostic-filter";
import { ProcessUsageSection } from "@/components/omdx/process-usage-section";
import { buildAnalyticsOverview } from "@/lib/data/omdx-analytics-overview";
import {
  gapCutoff,
  maturityCutoff,
  type OverviewAnalytics,
  type OverviewHistoricalComparison,
} from "@/lib/data/omdx-overview-analytics";
import type { ProcessUsageAnalytics } from "@/lib/data/process-usage-analytics";
import type { Diagnostic } from "@/lib/types";

type AnalyticsOverviewProps = {
  analytics: OverviewAnalytics;
  comparison: OverviewHistoricalComparison | null;
  processUsage: ProcessUsageAnalytics | null;
  diagnosticOptions: Diagnostic[];
  selectedDiagnostic: string;
  illustrativeImpact?: boolean;
  actionPointsHref?: string;
  showActionPointsLink?: boolean;
  concise?: boolean;
  initialDimension?: string;
  /** Esconde título e filtro quando a página já os mostra (ex.: filtro na linha das abas). */
  hideHeader?: boolean;
};

export function AnalyticsOverview({
  analytics,
  comparison,
  processUsage,
  diagnosticOptions,
  selectedDiagnostic,
  illustrativeImpact = false,
  concise = false,
  initialDimension,
  hideHeader = false,
}: AnalyticsOverviewProps) {
  const overview = buildAnalyticsOverview({ analytics, comparison, processUsage, illustrativeImpact });

  return (
    <div className="flex w-full flex-col gap-10">
      {hideHeader ? null : <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-3xl flex-col gap-1">
          <h1 className="text-ui-section text-foreground">{concise ? "Pesquisa" : "Percepção e acompanhamento"}</h1>
          {!concise ? <p className="text-sm text-muted-foreground">
            Resultados da pesquisa na escala de 1 a 5, separados das consultas aos ativos e da execução.
          </p> : null}
        </div>
        <OverviewDiagnosticFilter
          diagnostics={diagnosticOptions}
          id="collection-diagnostic-filter"
          value={selectedDiagnostic}
          allowAll={illustrativeImpact}
        />
      </header>}

      <div className="grid gap-10 xl:grid-cols-2 xl:gap-4">
        <AnalyticsLevel id="nivel-gap" title="Onde está o gap">
          <AnalyticsDimensionGapChart
            concise={concise}
            dimensions={overview.dimensions}
            overall={overview.verdict?.maturity ?? null}
            referenceLabel={comparison?.referenceLabel ?? null}
            target={illustrativeImpact ? maturityCutoff : null}
          />
        </AnalyticsLevel>
        <AnalyticsLevel id="nivel-camadas" title="Quem vê diferente">
          <AnalyticsLayerPerceptionChart gapCutoff={gapCutoff} rows={overview.layers} concise={concise} />
        </AnalyticsLevel>
      </div>

      <AnalyticsLevel id="nivel-perguntas" title="Afirmações coletadas">
        <AnalyticsQuestionTable key={initialDimension} gapCutoff={gapCutoff} rows={overview.questions} initialDimension={initialDimension} concise={concise} />
      </AnalyticsLevel>

      <AnalyticsLevel id="nivel-execucao" title="Consultas e execução">
        <div className="flex flex-col gap-8">
          {processUsage ? <ProcessUsageSection analytics={processUsage} concise={concise} /> : <p className="text-sm text-muted-foreground">Consultas aos ativos: sem dados disponíveis.</p>}
          {!concise ? <section className="space-y-2">
            <h2 className="text-ui-title">Execução das rotinas e resultados</h2>
            <p className="text-sm text-muted-foreground">Sem medição consolidada neste painel. Consulte os relatos e as validações em Action Points. Consultar um ativo não comprova execução nem altera a nota da pesquisa.</p>
          </section> : null}
        </div>
      </AnalyticsLevel>
    </div>
  );
}
