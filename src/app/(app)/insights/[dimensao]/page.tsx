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
  getDimensionInsightPageData,
} from "@/lib/data/omdx-data-source";
import { isDimensionId } from "@/lib/data/omdx-domain";

export const metadata: Metadata = {
  title: "Insights — Maturidade",
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
        <AppTopbar />
        <main className="flex flex-1 items-center justify-center p-6 lg:p-8">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Dimensão não encontrada</CardTitle>
              <CardDescription>
                A dimensão solicitada não existe no modelo de Maturidade desta fase.
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
  const requestedDiagnostic =
    typeof resolvedSearchParams?.diagnostico === "string"
      ? resolvedSearchParams.diagnostico
      : "todos";
  const pageData = await getDimensionInsightPageData(
    dimensao,
    requestedDiagnostic,
  );

  return (
    <DimensionInsightWorkspace
      diagnosticOptions={pageData.diagnosticOptions}
      questionResults={pageData.questionResults}
      selectedDiagnostic={pageData.selectedDiagnostic}
      summary={pageData.summary}
    />
  );
}
