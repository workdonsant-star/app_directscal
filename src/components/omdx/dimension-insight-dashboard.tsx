import { DimensionScoreTrend } from "@/components/omdx/dimension-score-trend";
import { KpiCard } from "@/components/omdx/kpi-card";
import { LayerInsightComparison } from "@/components/omdx/layer-insight-comparison";
import {
  classifyScore,
  getDimensionInsightSummary,
} from "@/lib/data/omdx-data-source";
import type { Dimension } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DimensionInsightDashboardProps = {
  dimension: Dimension;
  selectedDiagnostic: string;
};

function formatScore(value: number | null) {
  return value === null ? "—" : value.toFixed(1);
}

function buildExecutiveReading(
  score: number | null,
  variation: number | null,
  dimensionName: string,
) {
  if (score === null) {
    return `Ainda não há dados suficientes para consolidar a leitura de ${dimensionName}.`;
  }

  if (score < 3) {
    return `${dimensionName} aparece como ponto de atenção estrutural. A leitura indica fricção recorrente e deve ser tratada antes de ampliar a escala.`;
  }

  if (variation !== null && variation >= 1) {
    return `${dimensionName} tem maturidade intermediária, mas com variação relevante entre diagnósticos. Vale comparar contextos antes de definir uma tese única.`;
  }

  return `${dimensionName} mostra uma base mais estável. A prioridade é preservar consistência e observar desalinhamentos entre camadas.`;
}

export function DimensionInsightDashboard({
  dimension,
  selectedDiagnostic,
}: DimensionInsightDashboardProps) {
  const summary = getDimensionInsightSummary(dimension.id, selectedDiagnostic);
  const classification =
    summary.averageScore === null ? "Sem dados" : classifyScore(summary.averageScore);
  const executiveReading = buildExecutiveReading(
    summary.averageScore,
    summary.variation,
    dimension.shortName,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold text-foreground">{dimension.name}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {dimension.question}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {dimension.description}
          </p>
        </div>

      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total de respostas"
          value={summary.totalResponses.toLocaleString("pt-BR")}
          caption="Base considerada"
          hint={
            selectedDiagnostic === "todos"
              ? "Soma dos diagnósticos com dados"
              : "Total do diagnóstico selecionado"
          }
        />
        <KpiCard
          label="Score da dimensão"
          value={formatScore(summary.averageScore)}
          caption={classification}
          hint="Escala Likert de 1 a 5"
        />
        <KpiCard
          label="Diagnósticos com dados"
          value={summary.diagnosticsWithData.toString()}
          caption="Amostra disponível"
          hint="Rascunhos ficam fora da leitura"
        />
        <KpiCard
          label="Maior variação"
          value={formatScore(summary.variation)}
          caption="Entre diagnósticos"
          hint="Mostra dispersão da maturidade"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Evolução por diagnóstico</CardTitle>
            <CardDescription>
              Comparação da dimensão nos diagnósticos que já possuem dados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DimensionScoreTrend points={summary.trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Percepção por camada</CardTitle>
            <CardDescription>
              Leitura agregada entre fundador, liderança e operação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LayerInsightComparison scores={summary.layerScores} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leitura executiva</CardTitle>
          <CardDescription>
            Síntese para orientar a próxima decisão de estruturação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {executiveReading}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
