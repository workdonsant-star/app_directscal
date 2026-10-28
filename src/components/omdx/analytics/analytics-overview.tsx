import { AnalyticsDimensionGapChart } from "@/components/omdx/analytics/analytics-dimension-gap-chart";
import { AnalyticsLayerPerceptionChart } from "@/components/omdx/analytics/analytics-layer-perception-chart";
import { AnalyticsLeverTable } from "@/components/omdx/analytics/analytics-lever-table";
import { AnalyticsLevel } from "@/components/omdx/analytics/analytics-primitives";
import { AnalyticsQuestionTable } from "@/components/omdx/analytics/analytics-question-table";
import { CollectionReading } from "@/components/omdx/analytics/collection-reading";
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
};

export function AnalyticsOverview({
  analytics,
  comparison,
  processUsage,
  diagnosticOptions,
  selectedDiagnostic,
  illustrativeImpact = false,
  actionPointsHref,
}: AnalyticsOverviewProps) {
  const overview = buildAnalyticsOverview({ analytics, comparison, processUsage, illustrativeImpact });
  const diagnostic = diagnosticOptions.find(item => item.id === selectedDiagnostic);
  const responseBase = diagnostic ? [diagnostic] : selectedDiagnostic === "todos" ? diagnosticOptions : [];
  const responses = responseBase.length === 0 ? null : responseBase.reduce((total, item) => ({
    total: total.total + item.responses.total,
    fundador: total.fundador + item.responses.fundador,
    lideranca: total.lideranca + item.responses.lideranca,
    operacao: total.operacao + item.responses.operacao,
  }), { total: 0, fundador: 0, lideranca: 0, operacao: 0 });

  return (
    <div className="flex w-full flex-col gap-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-3xl flex-col gap-1">
          <h1 className="text-ui-section text-foreground">Percepção e acompanhamento</h1>
          <p className="text-sm text-muted-foreground">
            Resultados da pesquisa na escala de 1 a 5, separados das consultas aos ativos e da execução.
          </p>
        </div>
        <OverviewDiagnosticFilter
          diagnostics={diagnosticOptions}
          id="collection-diagnostic-filter"
          value={selectedDiagnostic}
          allowAll={illustrativeImpact}
        />
      </header>

      <AnalyticsLevel id="nivel-veredito" title="Leitura da coleta">
        <CollectionReading score={overview.verdict?.maturity ?? null} responses={responses} />
      </AnalyticsLevel>

      <div className="grid gap-10 xl:grid-cols-2 xl:gap-4">
        <AnalyticsLevel id="nivel-gap" title="Onde está o gap">
          <AnalyticsDimensionGapChart
            dimensions={overview.dimensions}
            referenceLabel={comparison?.referenceLabel ?? null}
            target={illustrativeImpact ? maturityCutoff : null}
          />
        </AnalyticsLevel>
        <AnalyticsLevel id="nivel-camadas" title="Quem vê diferente">
          <AnalyticsLayerPerceptionChart gapCutoff={gapCutoff} rows={overview.layers} />
        </AnalyticsLevel>
      </div>

      <AnalyticsLevel id="nivel-alavancas" title="O que atacar e como está andando">
        <AnalyticsLeverTable levers={overview.levers} illustrative={illustrativeImpact} actionPointsHref={actionPointsHref ?? (diagnostic ? `/action-points?diagnostico=${encodeURIComponent(diagnostic.id)}` : "/action-points")} />
      </AnalyticsLevel>

      <AnalyticsLevel id="nivel-perguntas" title="Onde dói, pergunta a pergunta">
        <AnalyticsQuestionTable gapCutoff={gapCutoff} rows={overview.questions} total={overview.questionTotal} />
      </AnalyticsLevel>

      <AnalyticsLevel id="nivel-execucao" title="Consultas e execução">
        <div className="flex flex-col gap-8">
          {processUsage ? <ProcessUsageSection analytics={processUsage} /> : <p className="text-sm text-muted-foreground">Consultas aos ativos: sem dados disponíveis.</p>}
          <section className="space-y-2">
            <h2 className="text-ui-title">Execução das rotinas e resultados</h2>
            <p className="text-sm text-muted-foreground">Sem medição consolidada neste painel. Consulte os relatos e as validações em Action Points. Consultar um ativo não comprova execução nem altera a nota da pesquisa.</p>
          </section>
        </div>
      </AnalyticsLevel>
    </div>
  );
}
