import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { AnalyticsOverview } from "@/components/omdx/analytics/analytics-overview";
import { buildAnalyticsExample } from "@/lib/data/analytics-example";
import { buildProcessUsageExample } from "@/lib/data/process-usage-example";

// `progresso` simula os estados do veredito: `sem-uso` zera a adoção dos ativos e
// `sem-base` remove a medição de adoção.
function buildProcessUsageScenario(progress: string | undefined) {
  if (progress === "sem-base") return null;

  const usage = buildProcessUsageExample();
  if (progress !== "sem-uso") return usage;
  return { ...usage, adoption: { ...usage.adoption, value: 0 } };
}

export function AnalyticsExampleDashboard({
  diagnostic = "todos",
  progress,
}: {
  diagnostic?: string;
  progress?: string;
}) {
  const { analytics, comparison, diagnosticOptions, selectedDiagnostic } = buildAnalyticsExample(diagnostic);

  return (
    <>
      <AppTopbar />
      <AppPage>
        <AnalyticsOverview
          illustrativeImpact
          analytics={analytics}
          comparison={comparison}
          diagnosticOptions={diagnosticOptions}
          processUsage={buildProcessUsageScenario(progress)}
          selectedDiagnostic={selectedDiagnostic}
        />
      </AppPage>
    </>
  );
}
