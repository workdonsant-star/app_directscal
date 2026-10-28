import Link from "next/link";

import {
  formatDelta,
  formatScore,
  IllustrativeTag,
  ScoreProgressBar,
} from "@/components/omdx/analytics/analytics-primitives";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AnalyticsLever } from "@/lib/data/omdx-analytics-overview";

function assetsLabel(count: number) {
  if (count === 0) return "Nenhum";
  return `${count} ${count === 1 ? "ativo" : "ativos"}`;
}

export function AnalyticsLeverTable({ levers, illustrative = false, actionPointsHref = "/action-points" }: { levers: AnalyticsLever[]; illustrative?: boolean; actionPointsHref?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-ui-title text-foreground">Dimensões para aprofundar</h3>
            {illustrative && <IllustrativeTag />}
          </div>
          <p className="text-xs text-muted-foreground">
            {illustrative ? "Notas vêm da pesquisa. Os dados de execução são ilustrativos." : "As menores notas e diferenças de percepção orientam a análise. A prioridade de intervenção é confirmada pelo consultor."}
          </p>
        </div>
        <Button nativeButton={false} render={<Link href={actionPointsHref} />} size="sm" variant="outline">
          Abrir action points
        </Button>
      </div>

      {levers.length === 0 ? (
        <p className="rounded-[10px] bg-sidebar px-6 py-8 text-center text-sm text-muted-foreground dark:bg-card">
          As alavancas aparecem quando há dimensões consolidadas.
        </p>
      ) : (
        <Table variant="operational">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Dimensão</TableHead>
              <TableHead className="w-56">Nota da pesquisa</TableHead>
              <TableHead className="text-right">Medição de execução</TableHead>
              <TableHead className="text-right">Ativos criados</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levers.map((lever) => (
              <TableRow key={lever.dimension}>
                <TableCell className="font-medium tabular-nums">{lever.rank}</TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">{lever.shortDimension}</p>
                  <p className="text-xs text-muted-foreground">{lever.assetName}</p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ScoreProgressBar className="h-1.5 flex-1" progress={lever.progress} score={lever.score} />
                    <span className="w-16 shrink-0 text-right text-sm tabular-nums">
                      <span className="font-medium text-foreground">{formatScore(lever.score)}</span>
                      {lever.progress !== null && lever.progress !== 0 ? (
                        <span
                          className="ml-1 text-xs font-medium"
                          style={lever.progress > 0 ? { color: "var(--overview-chart-progress)" } : undefined}
                        >
                          {formatDelta(lever.progress)}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {lever.assetUsage === null ? (
                    <span className="text-muted-foreground">Sem dados</span>
                  ) : (
                    `${lever.assetUsage}%`
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <span className={lever.assetsCreated === 0 ? "text-muted-foreground" : undefined}>
                    {lever.measured ? assetsLabel(lever.assetsCreated) : "Sem dados"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
