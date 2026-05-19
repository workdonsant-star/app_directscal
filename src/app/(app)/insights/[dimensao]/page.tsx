import type { Metadata } from "next";
import Link from "next/link";

import { AppTopbar } from "@/components/app-topbar";
import { DimensionInsightWorkspace } from "@/components/omdx/dimension-insight-workspace";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getDimensionById,
  getDimensionInsightDiagnosticOptions,
  getDimensionInsightSummary,
  getDimensionQuestionResults,
} from "@/lib/data/omdx-data-source";
import { isDimensionId } from "@/lib/data/omdx-domain";

export const metadata: Metadata = {
  title: "Insights — OMDx",
};

type DimensionInsightPageProps = {
  params: Promise<{ dimensao: string }>;
  searchParams?: Promise<{ diagnostico?: string | string[] }>;
};

export default async function DimensionInsightPage({
  params,
  searchParams,
}: DimensionInsightPageProps) {
  const { dimensao } = await params;

  if (!isDimensionId(dimensao)) {
    return (
      <>
        <AppTopbar breadcrumb={[{ label: "Insights" }, { label: "Inválido" }]} />
        <main className="flex flex-1 items-center justify-center p-6 lg:p-8">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Dimensão não encontrada</CardTitle>
              <CardDescription>
                A dimensão solicitada não existe no modelo OMDx desta fase.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                nativeButton={false}
                render={<Link href="/insights/cultura" />}
              >
                Voltar para Cultura
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const resolvedSearchParams = await searchParams;
  const dimension = await getDimensionById(dimensao);
  const diagnosticOptions = await getDimensionInsightDiagnosticOptions();
  const requestedDiagnostic =
    typeof resolvedSearchParams?.diagnostico === "string"
      ? resolvedSearchParams.diagnostico
      : "todos";
  const selectedDiagnostic = diagnosticOptions.some(
    (diagnostic) => diagnostic.id === requestedDiagnostic,
  )
    ? requestedDiagnostic
    : "todos";
  const [summary, questionResults] = await Promise.all([
    getDimensionInsightSummary(dimension.id, selectedDiagnostic),
    getDimensionQuestionResults(dimension.id, selectedDiagnostic),
  ]);

  return (
    <DimensionInsightWorkspace
      diagnosticOptions={diagnosticOptions}
      dimension={dimension}
      questionResults={questionResults}
      selectedDiagnostic={selectedDiagnostic}
      summary={summary}
    />
  );
}
