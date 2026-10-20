import { AnalyticsDimensionGapChart } from "@/components/omdx/analytics/analytics-dimension-gap-chart";
import { AnalyticsLayerPerceptionChart } from "@/components/omdx/analytics/analytics-layer-perception-chart";
import { AnalyticsLeverTable } from "@/components/omdx/analytics/analytics-lever-table";
import { AnalyticsLevel } from "@/components/omdx/analytics/analytics-primitives";
import { AnalyticsQuestionTable } from "@/components/omdx/analytics/analytics-question-table";
import { AnalyticsVerdict } from "@/components/omdx/analytics/analytics-verdict";
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
};

// Analytics em seis níveis, do que mais vale para o cliente ao detalhe:
// veredito, alavancas, gap por dimensão, camadas, perguntas e execução.
export function AnalyticsOverview({
  analytics,
  comparison,
  processUsage,
  diagnosticOptions,
  selectedDiagnostic,
  illustrativeImpact = false,
}: AnalyticsOverviewProps) {
  const overview = buildAnalyticsOverview({ analytics, comparison, processUsage, illustrativeImpact });

  return (
    <div className="flex w-full flex-col gap-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-3xl flex-col gap-1">
          <h1 className="text-ui-section text-foreground">Maturidade e execução</h1>
          <p className="text-sm text-muted-foreground">
            Resultado das coletas na escala de 1 a 5 e o andamento das ações desde a última coleta.
          </p>
        </div>
        <OverviewDiagnosticFilter
          diagnostics={diagnosticOptions}
          id="collection-diagnostic-filter"
          value={selectedDiagnostic}
        />
      </header>

      <AnalyticsLevel id="nivel-veredito" title="Veredito">
        <AnalyticsVerdict verdict={overview.verdict} />
      </AnalyticsLevel>

      <div className="grid gap-10 xl:grid-cols-2 xl:gap-4">
        <AnalyticsLevel id="nivel-gap" title="Onde está o gap">
          <AnalyticsDimensionGapChart
            dimensions={overview.dimensions}
            referenceLabel={comparison?.referenceLabel ?? null}
            target={maturityCutoff}
          />
        </AnalyticsLevel>
        <AnalyticsLevel id="nivel-camadas" title="Quem vê diferente">
          <AnalyticsLayerPerceptionChart gapCutoff={gapCutoff} rows={overview.layers} />
        </AnalyticsLevel>
      </div>

      <AnalyticsLevel id="nivel-alavancas" title="O que atacar e como está andando">
        <AnalyticsLeverTable levers={overview.levers} illustrative={illustrativeImpact} />
      </AnalyticsLevel>

      <AnalyticsLevel id="nivel-perguntas" title="Onde dói, pergunta a pergunta">
        <AnalyticsQuestionTable gapCutoff={gapCutoff} rows={overview.questions} total={overview.questionTotal} />
      </AnalyticsLevel>

      <AnalyticsLevel id="nivel-execucao" title="Execução e impacto">
        <div className="flex flex-col gap-8">
          {processUsage ? <ProcessUsageSection analytics={processUsage} /> : null}
        </div>
      </AnalyticsLevel>
    </div>
  );
}
