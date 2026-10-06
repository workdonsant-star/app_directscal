"use client";

import { ArrowRight, FileText, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminDeliveryStatusBadge } from "@/components/admin/admin-delivery-status-badge";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminDelivery } from "@/lib/contracts/admin-operations";
import { adminSpecialists, getAdminSpecialist } from "@/lib/data/admin-operations-data-source";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

export function AdminOperationsWorkspace({
  deliveries,
}: {
  deliveries: AdminDelivery[];
}) {
  const router = useRouter();
  const companyOptions = Array.from(
    new Map(
      deliveries.map((delivery) => [
        delivery.companyId,
        { label: delivery.companyName, value: delivery.companyId },
      ]),
    ).values(),
  ).sort((first, second) => first.label.localeCompare(second.label, "pt-BR"));
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    companyOptions[0]?.value ?? "",
  );
  const diagnosticsForCompany = deliveries.filter(
    (delivery) => delivery.companyId === selectedCompanyId,
  );
  const [selectedDiagnosticId, setSelectedDiagnosticId] = useState(
    diagnosticsForCompany[0]?.id ?? "",
  );
  const unassignedCount = deliveries.filter(
    (delivery) => delivery.status === "sem_especialista",
  ).length;
  const analysisCount = deliveries.filter(
    (delivery) =>
      delivery.status === "aguardando_analise" ||
      delivery.status === "em_analise",
  ).length;
  const readyCount = deliveries.filter(
    (delivery) => delivery.status === "pronta_para_publicar",
  ).length;
  const activeSpecialists = adminSpecialists.filter(
    (specialist) => specialist.status === "ativo",
  ).length;

  return (
    <div className="flex w-full flex-col gap-8">
      <section
        aria-labelledby="operation-title"
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="space-y-1">
          <h1 id="operation-title" className="font-heading text-2xl font-semibold">
            Operação
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe diagnósticos encerrados, responsáveis e entregas ao cliente.
          </p>
        </div>
        <Button
          type="button"
          disabled={deliveries.length === 0}
          onClick={() => setCreateDialogOpen(true)}
        >
          <FileText aria-hidden="true" />
          Criar relatório
        </Button>
      </section>

      <section
        aria-label="Resumo da operação"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <KpiCard
          label="Sem especialista"
          value={String(unassignedCount)}
          caption="Atribuição necessária"
          hint="Diagnósticos que ainda não entraram na carteira"
        />
        <KpiCard
          label="Em preparação"
          value={String(analysisCount)}
          caption="Análises em andamento"
          hint="Inclui entregas aguardando início"
        />
        <KpiCard
          label="Prontas para publicar"
          value={String(readyCount)}
          caption="Revisão final pendente"
          hint="Relatório e action points preparados"
        />
        <KpiCard
          label="Especialistas ativos"
          value={String(activeSpecialists)}
          caption="Capacidade disponível"
          hint="Profissionais habilitados para receber empresas"
        />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="delivery-queue-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 id="delivery-queue-title" className="font-heading text-lg font-semibold">
              Fila de entregas
            </h2>
            <p className="text-sm text-muted-foreground">
              Diagnósticos encerrados que exigem análise, relatório e plano de ação.
            </p>
          </div>
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href="/admin/especialistas" />}
          >
            <UserRoundCheck aria-hidden="true" />
            Ver especialistas
          </Button>
        </div>

        <div className="min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa e diagnóstico</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Especialista</TableHead>
                <TableHead className="text-right">Respostas</TableHead>
                <TableHead className="text-right">Prazo</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Abrir</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((delivery) => {
                const specialist = getAdminSpecialist(delivery.specialistId);

                return (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      <Link
                        href={`/admin/entregas/${delivery.id}`}
                        className="group block rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <span className="block font-medium text-foreground group-hover:underline group-hover:underline-offset-4">
                          {delivery.companyName}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {delivery.diagnosticName}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <AdminDeliveryStatusBadge status={delivery.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {specialist?.name ?? "Atribuir especialista"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {delivery.responseCount}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {dateFormatter.format(new Date(delivery.dueAt))}
                    </TableCell>
                    <TableCell>
                      <Button
                        nativeButton={false}
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Abrir entrega de ${delivery.companyName}`}
                        render={<Link href={`/admin/entregas/${delivery.id}`} />}
                      >
                        <ArrowRight aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {deliveries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    Nenhum diagnóstico encerrado com base suficiente para gerar relatório.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar relatório</DialogTitle>
            <DialogDescription>
              Selecione o cliente e o diagnóstico encerrado que será usado como base.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-1">
            <div className="grid gap-2">
              <label htmlFor="report-company" className="text-sm font-medium">
                Cliente
              </label>
              <Select
                value={selectedCompanyId}
                items={companyOptions}
                onValueChange={(value) => {
                  if (typeof value !== "string") return;
                  const firstDiagnostic = deliveries.find(
                    (delivery) => delivery.companyId === value,
                  );
                  setSelectedCompanyId(value);
                  setSelectedDiagnosticId(firstDiagnostic?.id ?? "");
                }}
              >
                <SelectTrigger id="report-company" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="report-diagnostic" className="text-sm font-medium">
                Diagnóstico
              </label>
              <Select
                value={selectedDiagnosticId}
                items={diagnosticsForCompany.map((delivery) => ({
                  label: delivery.diagnosticName,
                  value: delivery.id,
                }))}
                onValueChange={(value) => {
                  if (typeof value === "string") setSelectedDiagnosticId(value);
                }}
              >
                <SelectTrigger id="report-diagnostic" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {diagnosticsForCompany.map((delivery) => (
                    <SelectItem key={delivery.id} value={delivery.id}>
                      {delivery.diagnosticName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!selectedDiagnosticId}
              onClick={() => router.push(`/admin/entregas/${selectedDiagnosticId}`)}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
