import Link from "next/link";
import { Download } from "lucide-react";

import { AppTopbar } from "@/components/app-topbar";
import { KpiCard } from "@/components/kpi-card";
import { DimensionBarChart } from "@/components/omdx/dimension-bar-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  classifyScore,
  getDashboardSummary,
  getLatestReportableDiagnostic,
} from "@/lib/data/omdx-data-source";

export default function OmdxDashboardPage() {
  const dashboardKpis = getDashboardSummary();
  const reportDiagnostic = getLatestReportableDiagnostic();
  const avg = dashboardKpis.averageScore;
  const avgValue = avg !== null ? avg.toFixed(1) : "—";
  const avgClassification = avg !== null ? classifyScore(avg) : "Sem dados";

  return (
    <>
      <AppTopbar />

      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-foreground text-3xl font-semibold tracking-tight">
                OMDx
              </h1>
              <p className="text-muted-foreground max-w-2xl text-sm">
                Avalia a maturidade operacional da empresa em seis dimensões, a
                partir da percepção de fundadores, liderança e operação.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {reportDiagnostic && (
                <Button
                  size="sm"
                  nativeButton={false}
                  render={
                    <a href={`/omdx/${reportDiagnostic.id}/relatorio`} />
                  }
                >
                  <Download className="size-4" />
                  Baixar relatório
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href="/metodologia" />}
              >
                Ver metodologia
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Diagnósticos ativos"
              value={String(dashboardKpis.activeDiagnostics)}
              trend="up"
              trendValue="+1"
              caption="Coleta em andamento"
              hint="Comparado ao mês anterior"
            />
            <KpiCard
              label="Respostas recebidas"
              value={dashboardKpis.totalResponses.toLocaleString("pt-BR")}
              trend="up"
              trendValue="+18%"
              caption="Acumulado últimos 90 dias"
              hint="Em todos os diagnósticos"
            />
            <KpiCard
              label="Score médio"
              value={avgValue}
              trend="flat"
              trendValue="0,0"
              caption={avgClassification}
              hint="Média dos diagnósticos com resultado"
            />
            <KpiCard
              label="Maior gargalo recorrente"
              value={dashboardKpis.topGap.score.toFixed(1)}
              trend="down"
              trendValue="−0,3"
              caption={dashboardKpis.topGap.name}
              hint="Dimensão com menor score no último diagnóstico"
            />
          </section>

          {/* Main chart */}
          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base font-semibold">
                    Maturidade por dimensão
                  </CardTitle>
                  <CardDescription>
                    Resultado do último diagnóstico — Vertex Logistics, Q2 2026
                  </CardDescription>
                </div>
                <Tabs defaultValue="ultimo">
                  <TabsList>
                    <TabsTrigger value="ultimo">Último</TabsTrigger>
                    <TabsTrigger value="media">Média histórica</TabsTrigger>
                    <TabsTrigger value="comparar">Comparar</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <DimensionBarChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Leitura executiva
                </CardTitle>
                <CardDescription>
                  Síntese do último diagnóstico
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 text-sm">
                <p className="text-foreground leading-relaxed">
                  A operação avança em <span className="font-medium">Performance</span> e{" "}
                  <span className="font-medium">Cultura</span>, mas fica exposta em{" "}
                  <span className="font-medium">Processos</span> — o trabalho ainda
                  depende de improviso e gera retrabalho sob pressão.
                </p>
                <div className="border-l-primary border-l-2 pl-3">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">
                    Tese executiva
                  </p>
                  <p className="text-foreground mt-1 leading-relaxed">
                    A empresa tem energia para escalar, mas não está pronta para
                    absorver o próximo ciclo de crescimento sem padronização da
                    execução.
                  </p>
                </div>
                <div className="text-muted-foreground flex items-center justify-between border-t pt-3 text-xs">
                  <span>Prontidão para estruturação</span>
                  <span className="text-foreground font-medium">Média</span>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </>
  );
}
