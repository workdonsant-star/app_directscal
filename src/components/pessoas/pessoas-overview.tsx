import { AlertTriangle, ArrowRight, Banknote, ClipboardList } from "lucide-react";
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
import type { PeopleOverviewWorkspace } from "@/lib/types";

import {
  formatCompetence,
  formatCurrency,
} from "./pessoas-formatters";

type PessoasOverviewProps = {
  workspace: PeopleOverviewWorkspace;
};

function BreakdownList({
  items,
}: {
  items: PeopleOverviewWorkspace["costByArea"];
}) {
  return (
    <div className="divide-y rounded-lg border">
      {items.map((item) => (
        <div
          key={item.id}
          className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_140px_72px]"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {item.label}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
          <p className="text-right text-sm font-medium tabular-nums text-foreground">
            {formatCurrency(item.value)}
          </p>
          <p className="text-right text-sm tabular-nums text-muted-foreground">
            {item.percentage}%
          </p>
        </div>
      ))}
    </div>
  );
}

export function PessoasOverview({ workspace }: PessoasOverviewProps) {
  const pendingPayments = workspace.payments.filter((payment) =>
    ["com_pendencia", "em_revisao"].includes(payment.status),
  );

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-muted-foreground">
            Competência {formatCompetence(workspace.competence)}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Pessoas
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Estrutura operacional, vínculo, custo, pendências e fechamento
            mensal. O módulo começa pelo perfil da pessoa e pelas rotinas de
            pagamento que dependem dele.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/pessoas/diretorio" />}
          >
            Abrir diretório
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/pessoas/fechamento" />}
          >
            Fechamento
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Custo total"
          value={formatCurrency(workspace.totalPeopleCost)}
          caption="Custo estimado da competência"
          hint={`${formatCurrency(workspace.recurringCost)} recorrentes`}
        />
        <KpiCard
          label="Pessoas ativas"
          value={String(workspace.activePeople)}
          caption={`${workspace.incompleteProfiles} perfis com revisão pendente`}
          hint="Cadastro, vínculo ou documento"
        />
        <KpiCard
          label="Pagamentos pendentes"
          value={String(workspace.pendingPayments)}
          caption={formatCurrency(workspace.pendingAmount)}
          hint="Bloqueiam exportação financeira"
        />
        <KpiCard
          label="Documentos pendentes"
          value={String(workspace.pendingDocuments)}
          caption="Contratos, termos e notas"
          hint="Impactam governança e pagamento"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Custo por vínculo
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Separação explícita entre PJ, CLT e outros vínculos.
            </p>
          </div>
          <BreakdownList items={workspace.costByEmploymentType} />
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Custo por área
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Leitura inicial para avaliar concentração de custo operacional.
            </p>
          </div>
          <BreakdownList items={workspace.costByArea} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Pagamentos que precisam de atenção
              </h2>
              <p className="text-sm text-muted-foreground">
                Linhas com pendência ou revisão antes da exportação.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/pessoas/fechamento" />}
            >
              Ver fechamento
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Pessoa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-right">Líquido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.map((payment) => (
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
                    <TableCell className="max-w-[280px] text-muted-foreground">
                      {payment.pendingReasons.join(", ") || "Sem pendência"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(payment.netAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <aside className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Alertas executivos
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sinais que afetam custo, governança ou pagamento.
            </p>
          </div>
          <div className="divide-y rounded-lg border">
            {workspace.alerts.map((alert) => (
              <div key={alert.id} className="flex gap-3 px-4 py-3">
                {alert.severity === "alta" ? (
                  <AlertTriangle className="mt-0.5 size-4 text-destructive" />
                ) : alert.severity === "media" ? (
                  <Banknote className="mt-0.5 size-4 text-foreground" />
                ) : (
                  <ClipboardList className="mt-0.5 size-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {alert.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {alert.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
