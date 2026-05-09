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
import { getDimensionById, isDimensionId } from "@/lib/data/omdx-data-source";

export const metadata: Metadata = {
  title: "Insights — OMDx",
};

type DimensionInsightPageProps = {
  params: Promise<{ dimensao: string }>;
};

export default async function DimensionInsightPage({
  params,
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
              <Button render={<Link href="/insights/cultura" />}>
                Voltar para Cultura
              </Button>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const dimension = getDimensionById(dimensao);

  return <DimensionInsightWorkspace dimension={dimension} />;
}
