import { Download, LockKeyhole, RotateCcw } from "lucide-react";
import Link from "next/link";

import { KpiCard } from "@/components/kpi-card";
import { PessoasStatusBadge } from "@/components/pessoas/pessoas-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { PeopleMonthlyClosingWorkspace } from "@/lib/types";

import {
  formatCompetence,
  formatCurrency,
  formatDate,
} from "./pessoas-formatters";

const stepStyles = {
  concluido: "border-chart-positive/30 text-chart-positive",
  em_andamento: "border-primary/30 text-primary",
  pendente: "border-border text-muted-foreground",
};

export function PessoasClosingWorkspace({
  workspace,
}: {
  workspace: PeopleMonthlyClosingWorkspace;
}) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {formatCompetence(workspace.competence)}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Fechamento mensal
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Consolidação de fixos, variáveis, benefícios, pendências e valores
            aprováveis por pessoa. A exportação fica bloqueada enquanto houver
            pendências críticas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/pessoas/diretorio" />}
          >
            Pessoas
          </Button>
          <Button disabled>
            <Download className="size-4" />
            Exportar CSV
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total a pagar"
          value={formatCurrency(workspace.totalToPay)}
          caption="Líquido consolidado"
          hint="Antes de exportação"
        />
        <KpiCard
          label="Custo total"
          value={formatCurrency(workspace.totalCost)}
          caption="Inclui encargos simulados"
          hint="CLT sem cálculo oficial"
        />
        <KpiCard
          label="Aprovado"
          value={formatCurrency(workspace.approvedAmount)}
          caption="Linhas liberadas"
          hint="Prontas para exportação futura"
        />
        <KpiCard
          label="Pendente"
          value={formatCurrency(workspace.pendingAmount)}
          caption="Exige revisão"
          hint="Notas, bônus e validações"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {workspace.steps.map((step) => (
          <div key={step.id} className="rounded-lg border px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-xs font-medium",
                  stepStyles[step.status],
                )}
              >
                {step.status === "concluido"
                  ? "Concluído"
                  : step.status === "em_andamento"
                    ? "Em andamento"
                    : "Pendente"}
              </span>
              {step.status === "concluido" ? (
                <LockKeyhole className="size-4 text-muted-foreground" />
              ) : (
                <RotateCcw className="size-4 text-muted-foreground" />
              )}
            </div>
            <h2 className="mt-3 text-sm font-semibold text-foreground">
              {step.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {step.description}
            </p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Linhas de pagamento
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada linha preserva origem, status, vencimento e bloqueios.
          </p>
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Pessoa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pendência</TableHead>
                <TableHead className="text-right">Líquido</TableHead>
                <TableHead className="text-right">Custo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspace.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Link
                      href={`/pessoas/${payment.personId}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {payment.personName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <PessoasStatusBadge
                      kind="payment"
                      status={payment.status}
                    />
                  </TableCell>
                  <TableCell>{formatDate(payment.dueDate)}</TableCell>
                  <TableCell className="max-w-[320px] text-muted-foreground">
                    {payment.pendingReasons.join(", ") || "Sem pendência"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payment.netAmount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(payment.totalCost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
