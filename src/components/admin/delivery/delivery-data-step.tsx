"use client";

import { useState } from "react";

import {
  formatScore,
  layerLabels,
} from "@/components/admin/delivery/delivery-draft";
import { useDeliveryDraft } from "@/components/admin/delivery/delivery-draft-provider";
import { DimensionQuestionResultsTable } from "@/components/omdx/dimension-question-results-table";
import { LayerScoreDashboard } from "@/components/omdx/layer-score-dashboard";
import { Badge } from "@/components/ui/badge";
import type { RespondentGroup } from "@/lib/contracts/omdx";
import { cn } from "@/lib/utils";

export function DeliveryDataStep() {
  const { analysis, dimensionReadings, setDimensionReading } = useDeliveryDraft();
  const [selectedDimensionId, setSelectedDimensionId] = useState(
    () =>
      [...analysis.dimensions].sort((first, second) => first.score - second.score)[0]
        ?.id ?? analysis.dimensions[0]?.id,
  );
  const selectedDimension =
    analysis.dimensions.find((dimension) => dimension.id === selectedDimensionId) ??
    analysis.dimensions[0];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4" aria-labelledby="delivery-analytics-title">
        <h2 id="delivery-analytics-title" className="text-ui-section">
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
            <h2 id="dimension-analysis-title" className="text-ui-section">
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
                    <h3 className="text-ui-section">
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
                  <dd className="text-right font-medium tabular-nums">
                    {formatScore(selectedDimension.score)}/5
                  </dd>
                  <dt className="text-muted-foreground">Gap entre camadas</dt>
                  <dd className="text-right font-medium tabular-nums">
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
                    <dd className="font-medium tabular-nums">
                      {score === null ? "—" : `${formatScore(score)}/5`}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="space-y-3 py-5">
                <h4 className="font-heading text-base font-bold">Critérios avaliados</h4>
                <div className="overflow-x-auto pb-px">
                  <div className="min-w-[860px]">
                    <DimensionQuestionResultsTable questions={selectedDimension.questions} />
                  </div>
                </div>
              </div>

              <div className="grid gap-2 border-t pt-5">
                <label htmlFor={`dimension-reading-${selectedDimension.id}`} className="font-heading text-base font-bold">
                  Leitura do especialista
                </label>
                <textarea
                  id={`dimension-reading-${selectedDimension.id}`}
                  value={dimensionReadings[selectedDimension.id] ?? ""}
                  onChange={(event) =>
                    setDimensionReading(selectedDimension.id, event.target.value)
                  }
                  rows={5}
                  className="mt-1 min-h-32 w-full resize-y rounded-lg border border-transparent bg-input px-3 py-2 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
