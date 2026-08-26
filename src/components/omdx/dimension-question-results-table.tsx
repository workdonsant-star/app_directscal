import type { DimensionQuestionResult } from "@/lib/types";
import { cn } from "@/lib/utils";

import { DimensionQuestionLayerChart } from "@/components/omdx/dimension-question-layer-chart";

type DimensionQuestionResultsTableProps = {
  questions: DimensionQuestionResult[];
};

const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const statusStyles: Record<string, { dot: string; text: string }> = {
  Consistente: {
    dot: "bg-[var(--omdx-status-consistente)]",
    text: "text-[var(--omdx-status-consistente)]",
  },
  Inconsistente: {
    dot: "bg-[var(--omdx-status-inconsistente)]",
    text: "text-[var(--omdx-status-inconsistente)]",
  },
  Atenção: {
    dot: "bg-[var(--omdx-status-atencao)]",
    text: "text-[var(--omdx-status-atencao)]",
  },
  Crítico: {
    dot: "bg-[var(--omdx-status-critico)]",
    text: "text-[var(--omdx-status-critico)]",
  },
};

function QuestionStatus({
  classification,
}: {
  classification: DimensionQuestionResult["classification"];
}) {
  const style = statusStyles[classification];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium",
        style?.text ?? "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          style?.dot ?? "bg-muted-foreground",
        )}
        aria-hidden="true"
      />
      {classification}
    </span>
  );
}

function formatGap(gap: DimensionQuestionResult["gap"]) {
  return gap === null ? "Sem base" : scoreFormatter.format(gap);
}

function QuestionLayerStackedBar({
  scores,
}: {
  scores: DimensionQuestionResult["layerScores"];
}) {
  return (
    <div className="w-full max-w-[360px]">
      <DimensionQuestionLayerChart scores={scores} />
    </div>
  );
}

export function DimensionQuestionResultsTable({
  questions,
}: DimensionQuestionResultsTableProps) {
  return (
    <section>
      {questions.length === 0 ? (
        <div className="border bg-muted/40 p-4 text-sm text-muted-foreground">
          Nenhuma pergunta consolidada para esta dimensão no filtro atual.
        </div>
      ) : (
        <table className="w-full table-fixed caption-bottom overflow-hidden rounded-[5px] text-sm ring-1 ring-foreground/10">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="h-11 px-4 text-left font-medium text-foreground">
                Pergunta
              </th>
              <th className="h-11 w-[440px] px-4 text-left font-medium text-foreground">
                Pontuação empilhada
              </th>
              <th className="h-11 w-28 px-4 text-left font-medium text-foreground">
                Gap médio
              </th>
              <th className="h-11 w-36 px-4 text-left font-medium text-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {questions.map((question) => (
              <tr key={question.id} className="hover:bg-muted/30">
                <td className="px-4 py-4 align-middle">
                  <p className="text-foreground text-sm font-medium leading-snug">
                    {question.text}
                  </p>
                </td>
                <td className="px-4 py-4 text-left align-middle">
                  <QuestionLayerStackedBar scores={question.layerScores} />
                </td>
                <td className="px-4 py-4 align-middle text-sm text-foreground">
                  <span className="block w-full text-left tabular-nums">
                    {formatGap(question.gap)}
                  </span>
                </td>
                <td className="px-4 py-4 text-left align-middle">
                  <QuestionStatus classification={question.classification} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
