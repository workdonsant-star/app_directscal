"use client";

import { useState } from "react";

import { formatScore, ScoreProgressBar } from "@/components/omdx/analytics/analytics-primitives";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AnalyticsQuestionRow } from "@/lib/data/omdx-analytics-overview";
import { cn } from "@/lib/utils";

const dimensions = ["Cultura", "Visão", "Comunicação", "Processos", "Liderança", "Performance"] as const;

const statusDots: Record<AnalyticsQuestionRow["classification"], string> = {
  "Crítico": "bg-[var(--omdx-status-critico)]",
  "Inconsistente": "bg-[var(--omdx-status-inconsistente)]",
  "Atenção": "bg-[var(--omdx-status-atencao)]",
  "Consistente": "bg-[var(--omdx-status-consistente)]",
};

export function AnalyticsQuestionTable({
  rows,
  gapCutoff,
  concise = false,
  initialDimension = "Cultura",
}: {
  rows: AnalyticsQuestionRow[];
  gapCutoff: number;
  concise?: boolean;
  initialDimension?: string;
}) {
  const [selectedDimension, setSelectedDimension] = useState(initialDimension);
  const visibleRows = rows.filter((row) => row.dimension.startsWith(selectedDimension));

  return (
    <section className="flex flex-col gap-4" id="afirmacoes-coletadas">
      <div className="flex flex-col gap-1">
        <h3 className="text-ui-title text-foreground">Afirmações coletadas</h3>
        {!concise ? <p className="text-xs text-muted-foreground">
          As cinco afirmações de cada dimensão, com nota da pesquisa, diferença entre camadas e status da pontuação.
        </p> : null}
      </div>

      <Tabs value={selectedDimension} onValueChange={setSelectedDimension}>
        <div className="overflow-x-auto pb-1">
          <TabsList variant="selector" aria-label="Dimensões" className="justify-start">
            {dimensions.map((dimension) => (
              <TabsTrigger key={dimension} value={dimension}>{dimension}</TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {visibleRows.length === 0 ? (
        <p className="rounded-[10px] bg-sidebar px-6 py-8 text-center text-sm text-muted-foreground dark:bg-card">
          Ainda não há afirmações consolidadas para {selectedDimension} nesta pesquisa.
        </p>
      ) : (
        <Table variant="operational">
          <TableHeader>
            <TableRow>
              <TableHead>Afirmação</TableHead>
              <TableHead className="w-56">Nota da pesquisa</TableHead>
              <TableHead className="w-32">Gap</TableHead>
              <TableHead className="w-36">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow key={row.questionId}>
                <TableCell className="max-w-[600px] whitespace-normal text-foreground">{row.question}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ScoreProgressBar className="h-1.5 flex-1" progress={row.progress} score={row.score} />
                    <span className="w-8 shrink-0 text-right font-medium tabular-nums">{formatScore(row.score)}</span>
                  </div>
                </TableCell>
                <TableCell className={cn("tabular-nums", row.layerGap !== null && row.layerGap >= gapCutoff ? "font-medium text-foreground" : "text-muted-foreground")}>{row.layerGap === null ? "Sem base" : `${formatScore(row.layerGap)} pt`}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2 whitespace-nowrap font-medium text-foreground">
                    <span className={cn("size-2 rounded-full", statusDots[row.classification])} aria-hidden="true" />
                    {row.classification}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
