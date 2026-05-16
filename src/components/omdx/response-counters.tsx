import { AlertTriangle, CheckCircle2, Users } from "lucide-react";

import { StatusBadge } from "@/components/omdx/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRespondentGroups } from "@/lib/data/omdx-data-source";
import type { Diagnostic, DiagnosticStatus } from "@/lib/types";

type ResponseCountersProps = {
  diagnostic: Diagnostic;
  status: DiagnosticStatus;
};

export function ResponseCounters({
  diagnostic,
  status,
}: ResponseCountersProps) {
  const isReadyForAnalysis = diagnostic.generalScore !== null;
  const respondentGroups = getRespondentGroups();

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Resumo da coleta</CardTitle>
            <CardDescription>
              Base compacta para decidir se a coleta já pode avançar.
            </CardDescription>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4" />
              <span className="text-xs font-medium uppercase tracking-[0.08em]">
                Total
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
              {diagnostic.responses.total}
            </p>
          </div>

          {respondentGroups.map((group) => (
            <div key={group.id} className="rounded-lg border bg-background p-3">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {group.label}
              </p>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
                {diagnostic.responses[group.id]}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-muted/40 p-3">
          <div className="flex items-start gap-3">
            {isReadyForAnalysis ? (
              <CheckCircle2 className="mt-0.5 size-4 text-primary" />
            ) : (
              <AlertTriangle className="mt-0.5 size-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {isReadyForAnalysis
                  ? "Base suficiente para consolidação"
                  : "Respostas ainda insuficientes para análise"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {isReadyForAnalysis
                  ? "O resultado já pode ser analisado de forma agregada quando a coleta for encerrada."
                  : "Mantenha os links ativos até equilibrar a leitura entre fundador, liderança e operação."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
