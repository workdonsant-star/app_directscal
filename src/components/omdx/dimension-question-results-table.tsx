import { getNeutralScoreColor } from "@/components/omdx/chart-colors";
import type { DimensionQuestionResult } from "@/lib/types";
import { cn } from "@/lib/utils";

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

export function DimensionQuestionResultsTable({
  questions,
}: DimensionQuestionResultsTableProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          Resultado das perguntas
        </h2>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Perguntas da dimensão ordenadas por prioridade operacional.
        </p>
      </div>

      {questions.length === 0 ? (
        <div className="border bg-muted/40 p-4 text-sm text-muted-foreground">
          Nenhuma pergunta consolidada para esta dimensão no filtro atual.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] caption-bottom text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="h-11 px-4 text-left font-medium text-foreground">
                    Pergunta
                  </th>
                  <th className="h-11 w-28 px-4 text-right font-medium text-foreground">
                    Score
                  </th>
                  <th className="h-11 w-36 px-4 text-left font-medium text-foreground">
                    Status
                  </th>
                  <th className="h-11 w-24 px-4 text-right font-medium text-foreground">
                    Gap
                  </th>
                  <th className="h-11 w-28 px-4 text-right font-medium text-foreground">
                    Respostas
                  </th>
                  <th className="h-11 w-80 px-4 text-left font-medium text-foreground">
                    Prioridade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {questions.map((question) => (
                  <tr key={question.id} className="hover:bg-muted/30">
                    <td className="min-w-[360px] px-4 py-4 align-middle">
                      <p className="text-foreground text-sm font-medium leading-snug">
                        {question.text}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
                      <span className="text-foreground text-base font-semibold tabular-nums">
                        {scoreFormatter.format(question.score)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <QuestionStatus classification={question.classification} />
                    </td>
                    <td className="px-4 py-4 text-right align-middle text-sm tabular-nums text-foreground">
                      {scoreFormatter.format(question.gap)}
                    </td>
                    <td className="px-4 py-4 text-right align-middle text-sm tabular-nums text-foreground">
                      {question.responses.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="relative h-5">
                        <div
                          className="absolute inset-y-0 left-0"
                          style={{
                            backgroundColor: getNeutralScoreColor(),
                            width: `${question.priorityIndex}%`,
                          }}
                        />
                        <span
                          className="absolute inset-y-0 flex items-center pl-2 text-sm font-medium tabular-nums text-foreground"
                          style={{ left: `${question.priorityIndex}%` }}
                        >
                          {question.priorityIndex}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
