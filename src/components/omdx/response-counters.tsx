import { AlertTriangle, CheckCircle2, Users } from "lucide-react";

import { StatusBadge } from "@/components/omdx/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  canGenerateDiagnosticReport,
  getRespondentGroups,
} from "@/lib/data/omdx-domain";
import type { Diagnostic, DiagnosticStatus } from "@/lib/types";

type ResponseCountersProps = {
  diagnostic: Diagnostic;
  status: DiagnosticStatus;
};

export function ResponseCounters({
  diagnostic,
  status,
}: ResponseCountersProps) {
  const isReadyForAnalysis = canGenerateDiagnosticReport(diagnostic);
  const respondentGroups = getRespondentGroups();

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Resumo da coleta</CardTitle>
            <CardDescription>
              Base compacta para acompanhar quando o diagnóstico já pode ser analisado.
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
                  : "Base de Fundador ainda pendente"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {isReadyForAnalysis
                  ? "Os dados já podem ser analisados. Liderança e operação aparecem como sem base até receberem respostas."
                  : "A análise é liberada quando houver ao menos uma resposta de Fundador."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
