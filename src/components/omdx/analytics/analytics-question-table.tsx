import {
  formatDelta,
  formatScore,
  ScoreProgressBar,
} from "@/components/omdx/analytics/analytics-primitives";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AnalyticsQuestionRow } from "@/lib/data/omdx-analytics-overview";
import { cn } from "@/lib/utils";

export function AnalyticsQuestionTable({
  rows,
  total,
  gapCutoff,
}: {
  rows: AnalyticsQuestionRow[];
  total: number;
  gapCutoff: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="text-ui-title text-foreground">Perguntas para aprofundar</h3>
        <p className="text-xs text-muted-foreground">
          {rows.length} perguntas de menor nota entre {total}. A divergência é a distância entre a maior e a menor média de camada; os resultados orientam a investigação do consultor.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-[10px] bg-sidebar px-6 py-8 text-center text-sm text-muted-foreground dark:bg-card">
          Ainda não há perguntas consolidadas para exibir.
        </p>
      ) : (
        <Table variant="operational">
          <TableHeader>
            <TableRow>
              <TableHead>Pergunta</TableHead>
              <TableHead>Dimensão</TableHead>
              <TableHead className="w-56">Nota da pesquisa</TableHead>
              <TableHead className="text-right">Divergência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.questionId}>
                <TableCell className="max-w-[420px] whitespace-normal text-foreground">{row.question}</TableCell>
                <TableCell className="text-muted-foreground">{row.dimension}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ScoreProgressBar className="h-1.5 flex-1" progress={row.progress} score={row.score} />
                    <span className="w-16 shrink-0 text-right text-sm tabular-nums">
                      <span className="font-medium text-foreground">{formatScore(row.score)}</span>
                      {row.progress !== null && row.progress !== 0 ? (
                        <span
                          className="ml-1 text-xs font-medium"
                          style={row.progress > 0 ? { color: "var(--overview-chart-progress)" } : undefined}
                        >
                          {formatDelta(row.progress)}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    row.layerGap !== null && row.layerGap >= gapCutoff
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {row.layerGap === null ? "—" : `${formatScore(row.layerGap)} pt`}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
