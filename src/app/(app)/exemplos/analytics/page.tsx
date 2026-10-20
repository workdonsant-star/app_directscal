import { AnalyticsExampleDashboard } from "@/components/omdx/analytics-example-dashboard";

export default async function AnalyticsExamplePage({
  searchParams,
}: {
  searchParams: Promise<{ diagnostico?: string; progresso?: string }>;
}) {
  const params = await searchParams;
  return <AnalyticsExampleDashboard diagnostic={params.diagnostico} progress={params.progresso} />;
}
