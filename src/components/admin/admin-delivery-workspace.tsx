"use client";

import {
  Check,
  Circle,
  Download,
  Eye,
  Save,
  Send,
  UserRoundCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminDeliveryStatusBadge } from "@/components/admin/admin-delivery-status-badge";
import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { DimensionQuestionResultsTable } from "@/components/omdx/dimension-question-results-table";
import { LayerScoreDashboard } from "@/components/omdx/layer-score-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  AdminDelivery,
  AdminDeliveryPublication,
  AdminDeliveryReportDraft,
  AdminDeliveryStatus,
} from "@/lib/contracts/admin-operations";
import type { RespondentGroup } from "@/lib/contracts/omdx";
import {
  type AdminDeliveryAnalysis,
  type AdminDeliveryDimensionAnalysis,
  adminActionPointTemplates,
  adminSpecialists,
  getAdminSpecialist,
} from "@/lib/data/admin-operations-data-source";
import { cn } from "@/lib/utils";

const layerLabels: Record<RespondentGroup, string> = {
  fundador: "Fundador",
  lideranca: "Liderança",
  operacao: "Operação",
};

function formatScore(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function buildInitialDimensionReading(
  dimension: AdminDeliveryDimensionAnalysis,
) {
  const orderedLayers = Object.entries(dimension.layerScores)
    .filter((entry): entry is [RespondentGroup, number] => entry[1] !== null)
    .sort((first, second) => second[1] - first[1]);
  const strongestLayer = orderedLayers[0];
  const weakestLayer = orderedLayers.at(-1);
  const gapReading =
    dimension.gap <= 0.5
      ? "As camadas apresentam uma leitura próxima entre si."
      : dimension.gap <= 1.2
        ? "Existe diferença de percepção que merece validação com as lideranças."
        : "A diferença entre as camadas indica desalinhamento relevante sobre a rotina observada.";

  return `${dimension.shortName} registra ${formatScore(dimension.score)}/5. ${gapReading} ${
    strongestLayer && weakestLayer
      ? `${layerLabels[strongestLayer[0]]} apresenta a maior percepção (${formatScore(strongestLayer[1])}/5), enquanto ${layerLabels[weakestLayer[0]]} registra ${formatScore(weakestLayer[1])}/5.`
      : ""
  }`;
}

function buildInitialReport(companyName: string): AdminDeliveryReportDraft {
  return {
    executiveSummary: `${companyName} apresenta uma operação funcional, mas ainda depende de mecanismos informais para coordenar prioridades, decisões e responsabilidades.`,
    generalReading:
      "Os resultados indicam que a estrutura de gestão evoluiu em ritmos diferentes entre as dimensões. As maiores fragilidades estão associadas à previsibilidade da execução e à distribuição das decisões.",
    vulnerabilities:
      "Processos críticos ainda variam entre áreas, informações importantes circulam sem um padrão único de registro e parte das decisões operacionais continua escalando para poucas pessoas.",
    structuralCauses:
      "Os sintomas compartilham três causas principais: limites de autonomia pouco explícitos, cadências de acompanhamento inconsistentes e critérios de performance ainda fragmentados.",
    recommendations:
      "Priorizar a definição de papéis e decisões, estabelecer uma cadência executiva e consolidar indicadores antes de ampliar a documentação dos processos.",
    conclusion:
      "O próximo estágio exige transformar práticas isoladas em um sistema comum de gestão, capaz de aumentar previsibilidade sem elevar a dependência da liderança.",
  };
}

const reportFields: Array<{
  key: keyof AdminDeliveryReportDraft;
  label: string;
  description: string;
}> = [
  {
    key: "executiveSummary",
    label: "Resumo executivo",
    description: "Síntese da situação atual e da principal implicação para a empresa.",
  },
  {
    key: "generalReading",
    label: "Leitura geral",
    description: "Interpretação conjunta dos dados e das diferenças entre camadas.",
  },
  {
    key: "vulnerabilities",
    label: "Vulnerabilidades prioritárias",
    description: "Problemas que limitam previsibilidade, escala ou qualidade da operação.",
  },
  {
    key: "structuralCauses",
    label: "Causas estruturais",
    description: "Mecanismos que explicam os sintomas observados nos resultados.",
  },
  {
    key: "recommendations",
    label: "Recomendações",
    description: "Direção de intervenção antes da seleção detalhada dos action points.",
  },
  {
    key: "conclusion",
    label: "Conclusão",
    description: "Fechamento consultivo e orientação para o próximo estágio.",
  },
];

function ReadinessItem({ complete, children }: { complete: boolean; children: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {complete ? (
        <Check aria-hidden="true" className="size-4 text-[var(--chart-positive)]" />
      ) : (
        <Circle aria-hidden="true" className="size-4 text-muted-foreground" />
      )}
      <span className={complete ? "text-foreground" : "text-muted-foreground"}>
        {children}
      </span>
    </li>
  );
}

export function AdminDeliveryWorkspace({
  analysis,
  delivery,
  deliveryOptions,
  publication,
}: {
  analysis: AdminDeliveryAnalysis;
  delivery: AdminDelivery;
  deliveryOptions: Array<{
    closedAt: string;
    diagnosticName: string;
    id: string;
  }>;
  publication: AdminDeliveryPublication | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<AdminDeliveryStatus>(delivery.status);
  const [specialistId, setSpecialistId] = useState(
    delivery.specialistId ?? "unassigned",
  );
  const [report, setReport] = useState(() =>
    publication?.report ?? buildInitialReport(delivery.companyName),
  );
  const [selectedActionPointIds, setSelectedActionPointIds] = useState(() =>
    new Set(
      publication?.selectedActionPointIds ??
        adminActionPointTemplates.slice(0, 3).map((item) => item.id),
    ),
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDimensionId, setSelectedDimensionId] = useState(
    () =>
      [...analysis.dimensions].sort((first, second) => first.score - second.score)[0]
        ?.id ?? analysis.dimensions[0]?.id,
  );
  const [dimensionReadings, setDimensionReadings] = useState(() => ({
    ...Object.fromEntries(
      analysis.dimensions.map((dimension) => [
        dimension.id,
        buildInitialDimensionReading(dimension),
      ]),
    ),
    ...publication?.dimensionReadings,
  }));

  const reportComplete = reportFields.every(
    (field) => report[field.key].trim().length >= 20,
  );
  const actionPointsComplete = selectedActionPointIds.size > 0;
  const specialistComplete = specialistId !== "unassigned";
  const readyToPublish = reportComplete && actionPointsComplete && specialistComplete;
  const assignedSpecialist = getAdminSpecialist(
    specialistId === "unassigned" ? null : specialistId,
  );
  const specialistOptions = [
    { label: "Sem especialista", value: "unassigned" },
    ...adminSpecialists
      .filter((specialist) => specialist.status === "ativo")
      .map((specialist) => ({ label: specialist.name, value: specialist.id })),
  ];
  const reportOptions = deliveryOptions.map((item) => ({
    label: `${item.diagnosticName} · ${new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "numeric",
    }).format(new Date(item.closedAt))}`,
    value: item.id,
  }));
  const selectedDimension =
    analysis.dimensions.find((dimension) => dimension.id === selectedDimensionId) ??
    analysis.dimensions[0];
  const averageGap = analysis.dimensions.length
    ? analysis.dimensions.reduce((total, dimension) => total + dimension.gap, 0) /
      analysis.dimensions.length
    : 0;

  async function persistDelivery(intent: "save" | "publish") {
    if (intent === "publish" && !readyToPublish) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/deliveries/${delivery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          specialistId: specialistId === "unassigned" ? null : specialistId,
          report,
          dimensionReadings,
          selectedActionPointIds: [...selectedActionPointIds],
        }),
      });
      const result = (await response.json()) as {
        message?: string;
        publication?: AdminDeliveryPublication;
      };

      if (!response.ok || !result.publication) {
        throw new Error(result.message ?? "Não foi possível salvar a entrega.");
      }

      setStatus(result.publication.status);
      setFeedback(
        intent === "publish"
          ? "Entrega publicada. O relatório já está disponível para o cliente."
          : "Rascunho salvo.",
      );
      router.refresh();
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a entrega.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function toggleActionPoint(actionPointId: string) {
    setSelectedActionPointIds((current) => {
      const next = new Set(current);
      if (next.has(actionPointId)) next.delete(actionPointId);
      else next.add(actionPointId);
      return next;
    });
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <AppTopbarActionsPortal>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void persistDelivery("save")}
            disabled={isSaving}
          >
            <Save aria-hidden="true" />
            {isSaving ? "Salvando" : "Salvar rascunho"}
          </Button>
          <Button
            type="button"
            onClick={() => void persistDelivery("publish")}
            disabled={
              isSaving || !readyToPublish || status === "publicada"
            }
          >
            <Send aria-hidden="true" />
            {status === "publicada" ? "Publicado" : "Publicar entrega"}
          </Button>
        </div>
      </AppTopbarActionsPortal>

      <section className="space-y-1">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold">{delivery.companyName}</h1>
            <AdminDeliveryStatusBadge status={status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {delivery.diagnosticName} · {delivery.responseCount.toLocaleString("pt-BR")} respostas · Maturidade {formatScore(delivery.generalScore)}/5 · Gap {formatScore(averageGap)}/5
          </p>
        </div>
      </section>

      <section
        aria-label="Contexto da entrega"
        className="flex flex-col gap-3 border-y py-4 lg:flex-row lg:items-end"
      >
        <div className="grid min-w-0 gap-2 sm:w-80">
          <label htmlFor="delivery-report-selector" className="text-sm font-medium">
            Diagnóstico
          </label>
          <Select
            value={delivery.id}
            items={reportOptions}
            onValueChange={(value) => {
              if (typeof value === "string" && value !== delivery.id) {
                router.push(`/admin/entregas/${value}`);
              }
            }}
          >
            <SelectTrigger id="delivery-report-selector" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reportOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid min-w-0 gap-2 sm:w-64">
          <label htmlFor="delivery-specialist" className="text-sm font-medium">
            Especialista
          </label>
          <Select
            value={specialistId}
            items={specialistOptions}
            onValueChange={(value) => {
              if (typeof value === "string") setSpecialistId(value);
            }}
          >
            <SelectTrigger id="delivery-specialist" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Sem especialista</SelectItem>
              {adminSpecialists
                .filter((specialist) => specialist.status === "ativo")
                .map((specialist) => (
                  <SelectItem key={specialist.id} value={specialist.id}>
                    {specialist.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          nativeButton={false}
          variant="outline"
          className="lg:ml-auto"
          render={<a href={`/admin/entregas/${delivery.id}/relatorio`} />}
        >
          <Download aria-hidden="true" />
          Baixar relatório
        </Button>
      </section>

      {feedback ? (
        <p role="status" className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
          {feedback}
        </p>
      ) : null}

      <Tabs defaultValue="dados" className="gap-6">
        <TabsList variant="line" className="w-full justify-start border-b">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório</TabsTrigger>
          <TabsTrigger value="action-points">
            Action points
            <span className="rounded-full border bg-background px-1.5 text-xs tabular-nums">
              {selectedActionPointIds.size}
            </span>
          </TabsTrigger>
          <TabsTrigger value="publicacao">Publicação</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-8">
          <section className="flex flex-col gap-4" aria-labelledby="delivery-analytics-title">
            <h2 id="delivery-analytics-title" className="font-heading text-lg font-semibold">
              Visão analítica
            </h2>
            <LayerScoreDashboard
              comparison={null}
              dimensionScores={analysis.analytics.dimensions}
              dimensionSummary={analysis.analytics.dimensionSummary}
              leverageRows={analysis.analytics.leverageRows}
              metrics={analysis.analytics.summaryMetrics}
              scores={analysis.analytics.layerScores}
              summary={analysis.analytics.layerSummary}
              vulnerabilityRows={analysis.analytics.vulnerabilityRows}
              presentation="distilled"
            />
          </section>

          {selectedDimension ? (
            <section className="space-y-4" aria-labelledby="dimension-analysis-title">
              <div className="space-y-1">
                <h2 id="dimension-analysis-title" className="font-heading text-lg font-semibold">
                  Análise por dimensão
                </h2>
              </div>

              <div>
                <div className="overflow-x-auto border-b">
                  <div className="flex min-w-max" role="list" aria-label="Dimensões do diagnóstico">
                    {analysis.dimensions.map((dimension) => {
                      const selected = dimension.id === selectedDimension.id;

                      return (
                        <button
                          key={dimension.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setSelectedDimensionId(dimension.id)}
                          className={cn(
                            "-mb-px flex cursor-pointer items-center border-b-2 px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                            selected
                              ? "border-primary font-medium text-foreground"
                              : "border-transparent text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {dimension.shortName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="min-w-0 py-5">
                  <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-xl font-semibold">
                          {selectedDimension.name}
                        </h3>
                        <Badge variant="outline">{selectedDimension.classification}</Badge>
                      </div>
                      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                        {selectedDimension.question}
                      </p>
                    </div>

                    <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <dt className="text-muted-foreground">Pontuação</dt>
                      <dd className="text-right font-semibold tabular-nums">
                        {formatScore(selectedDimension.score)}/5
                      </dd>
                      <dt className="text-muted-foreground">Gap entre camadas</dt>
                      <dd className="text-right font-semibold tabular-nums">
                        {formatScore(selectedDimension.gap)}/5
                      </dd>
                    </dl>
                  </div>

                  <dl className="flex flex-wrap gap-x-8 gap-y-3 border-b py-4">
                    {(Object.entries(selectedDimension.layerScores) as Array<
                      [RespondentGroup, number | null]
                    >).map(([group, score]) => (
                      <div key={group} className="flex items-baseline gap-2">
                        <dt className="text-sm text-muted-foreground">{layerLabels[group]}</dt>
                        <dd className="font-semibold tabular-nums">
                          {score === null ? "—" : `${formatScore(score)}/5`}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="space-y-3 py-5">
                    <div>
                      <h4 className="font-heading text-base font-semibold">Critérios avaliados</h4>
                    </div>
                    <div className="overflow-x-auto pb-px">
                      <div className="min-w-[860px]">
                        <DimensionQuestionResultsTable questions={selectedDimension.questions} />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2 border-t pt-5">
                    <label htmlFor={`dimension-reading-${selectedDimension.id}`} className="font-heading text-base font-semibold">
                      Leitura do especialista
                    </label>
                    <textarea
                      id={`dimension-reading-${selectedDimension.id}`}
                      value={dimensionReadings[selectedDimension.id] ?? ""}
                      onChange={(event) =>
                        setDimensionReadings((current) => ({
                          ...current,
                          [selectedDimension.id]: event.target.value,
                        }))
                      }
                      rows={5}
                      className="mt-1 min-h-32 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    />
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </TabsContent>

        <TabsContent value="relatorio" className="space-y-6">
          <section className="space-y-1" aria-labelledby="report-editor-title">
            <h2 id="report-editor-title" className="font-heading text-lg font-semibold">
              Relatório de análise
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Escreva a interpretação consultiva que será combinada aos dados e gráficos do diagnóstico.
            </p>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-6">
              {reportFields.map((field) => (
                <section key={field.key} className="grid gap-2">
                  <div>
                    <label htmlFor={`report-${field.key}`} className="font-heading text-base font-semibold">
                      {field.label}
                    </label>
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  </div>
                  <textarea
                    id={`report-${field.key}`}
                    value={report[field.key]}
                    onChange={(event) =>
                      setReport((current) => ({ ...current, [field.key]: event.target.value }))
                    }
                    rows={5}
                    className="min-h-32 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  />
                </section>
              ))}
            </div>

            <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
              <div className="rounded-lg border p-4">
                <p className="font-heading text-sm font-semibold">Progresso do relatório</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums">
                  {reportFields.filter((field) => report[field.key].trim().length >= 20).length}
                  <span className="text-base font-normal text-muted-foreground">/{reportFields.length}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Seções com conteúdo suficiente</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                Os gráficos e scores entram automaticamente na versão publicada. O texto acima compõe a camada analítica do especialista.
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="action-points" className="space-y-6">
          <section className="space-y-1" aria-labelledby="action-point-catalog-title">
            <h2 id="action-point-catalog-title" className="font-heading text-lg font-semibold">
              Catálogo de action points
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Selecione as ações que entrarão na entrega. Somente os itens marcados ficarão disponíveis para o cliente.
            </p>
          </section>

          <div className="overflow-hidden rounded-lg border">
            <div className="divide-y">
              {adminActionPointTemplates.map((actionPoint) => {
                const selected = selectedActionPointIds.has(actionPoint.id);

                return (
                  <label
                    key={actionPoint.id}
                    className={cn(
                      "grid cursor-pointer gap-3 px-4 py-4 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_auto]",
                      selected ? "bg-primary/5" : "hover:bg-muted/40",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleActionPoint(actionPoint.id)}
                      className="mt-1 size-4 accent-primary"
                    />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{actionPoint.title}</span>
                        <Badge variant="outline">{actionPoint.dimension}</Badge>
                        <Badge variant="secondary">Prioridade {actionPoint.priority.toLocaleLowerCase("pt-BR")}</Badge>
                      </span>
                      <span className="mt-1 block max-w-3xl text-sm leading-relaxed text-muted-foreground">
                        {actionPoint.description}
                      </span>
                      <span className="mt-2 block text-xs text-muted-foreground">
                        Responsável: {actionPoint.owner} · Prazo: {actionPoint.deadline} · Indicador: {actionPoint.successIndicator}
                      </span>
                    </span>
                    <span className={cn("text-xs font-medium", selected ? "text-primary" : "text-muted-foreground")}>
                      {selected ? "Selecionado" : "Adicionar"}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="publicacao" className="space-y-6">
          <section className="space-y-1" aria-labelledby="publication-title">
            <h2 id="publication-title" className="font-heading text-lg font-semibold">
              Publicação da entrega
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Confirme a autoria e o conteúdo antes de disponibilizar relatório e action points ao cliente.
            </p>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="rounded-lg border bg-card p-5" aria-labelledby="client-preview-title">
              <div className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Prévia do cliente</p>
                  <h3 id="client-preview-title" className="mt-1 font-heading text-xl font-semibold">
                    {delivery.diagnosticName}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{delivery.companyName}</p>
                </div>
                <Badge variant="outline">Score {delivery.generalScore.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}</Badge>
              </div>
              <div className="space-y-5 pt-5">
                <div>
                  <h4 className="font-heading text-base font-semibold">Resumo executivo</h4>
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {report.executiveSummary}
                  </p>
                </div>
                <div>
                  <h4 className="font-heading text-base font-semibold">Plano de ação</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedActionPointIds.size} action points selecionados para a agenda do cliente.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserRoundCheck aria-hidden="true" className="size-4" />
                  Assinado por {assignedSpecialist?.name ?? "especialista não atribuído"}
                </div>
              </div>
            </section>

            <aside className="rounded-lg border p-5">
              <div className="flex items-center gap-2">
                <Eye aria-hidden="true" className="size-4 text-muted-foreground" />
                <h3 className="font-heading text-base font-semibold">Prontidão</h3>
              </div>
              <ul className="mt-4 space-y-3">
                <ReadinessItem complete={specialistComplete}>Especialista atribuído</ReadinessItem>
                <ReadinessItem complete={reportComplete}>Relatório preenchido</ReadinessItem>
                <ReadinessItem complete={actionPointsComplete}>Action points selecionados</ReadinessItem>
              </ul>
              <p className="mt-5 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
                A publicação disponibiliza o relatório e os action points juntos para a empresa.
              </p>
            </aside>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
