import { Table } from "@/components/ui/table";
import {
  calculateDimensionGap,
  type DimensionResult,
} from "@/lib/data/omdx-overview-analytics";
import { classifyScore } from "@/lib/data/omdx-domain";
import { cn } from "@/lib/utils";

type OverviewDimensionResultsTableProps = {
  data: DimensionResult[];
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

function DimensionStatus({ score }: { score: number }) {
  const classification = classifyScore(score);
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

function formatGap(dimension: DimensionResult) {
  const gap = calculateDimensionGap(dimension);

  return gap === null ? "Sem base" : scoreFormatter.format(gap);
}

export function OverviewDimensionResultsTable({
  data,
}: OverviewDimensionResultsTableProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          Resultado por dimensão
        </h2>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Pontuação média, status e gap entre camadas para cada dimensão
          avaliada.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="border bg-muted/40 p-4 text-sm text-muted-foreground">
          Nenhuma dimensão consolidada no filtro atual.
        </div>
      ) : (
        <div className="min-w-0">
          <div className="overflow-x-auto">
            <Table className="w-full min-w-[680px] caption-bottom text-sm">
              <thead >
                <tr>
                  <th
                    scope="col"
                    className="h-11 px-4 text-left font-medium text-foreground"
                  >
                    Dimensão
                  </th>
                  <th
                    scope="col"
                    className="h-11 w-32 px-4 text-right font-medium text-foreground"
                  >
                    Pontuação
                  </th>
                  <th
                    scope="col"
                    className="h-11 w-36 px-4 text-left font-medium text-foreground"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="h-11 w-28 px-4 text-right font-medium text-foreground"
                  >
                    Gap
                  </th>
                </tr>
              </thead>
              <tbody >
                {data.map((dimension) => (
                  <tr key={dimension.dimension} >
                    <td className="px-4 py-4 align-middle">
                      <p className="text-foreground text-sm font-medium leading-snug">
                        {dimension.dimension}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
                      <span className="text-foreground text-base font-semibold tabular-nums">
                        {scoreFormatter.format(dimension.maturity)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <DimensionStatus score={dimension.maturity} />
                    </td>
                    <td className="px-4 py-4 text-right align-middle text-sm tabular-nums text-foreground">
                      {formatGap(dimension)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}
    </section>
  );
}
