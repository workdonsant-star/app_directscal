"use client";

import { ArrowRight, Building2, CalendarDays, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AdminDeliveryStatusBadge } from "@/components/admin/admin-delivery-status-badge";
import { useAdminData } from "@/components/admin/use-admin-data";
import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  adminSpecialists,
  getAdminCompanyOperationsPreview,
  getAdminSpecialist,
} from "@/lib/data/admin-operations-data-source";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function AdminCompanyDetail({ companyId }: { companyId: string }) {
  const { companies, modules } = useAdminData();
  const company = companies.find((item) => item.id === companyId);
  const preview = getAdminCompanyOperationsPreview(company?.name ?? "");
  const initialSpecialistId = preview.specialist?.id ?? "unassigned";
  const [specialistId, setSpecialistId] = useState(initialSpecialistId);
  const [savedSpecialistId, setSavedSpecialistId] = useState(initialSpecialistId);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!company) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-12 text-center">
        <p className="font-heading text-base font-medium">Empresa não encontrada</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Volte para a listagem e escolha uma empresa disponível.
        </p>
        <Button
          className="mt-4"
          nativeButton={false}
          variant="outline"
          render={<Link href="/admin/empresas" />}
        >
          Voltar para empresas
        </Button>
      </div>
    );
  }

  const assignedSpecialist = getAdminSpecialist(
    savedSpecialistId === "unassigned" ? null : savedSpecialistId,
  );
  const activeSpecialists = adminSpecialists.filter(
    (specialist) => specialist.status === "ativo",
  );
  const selectItems = [
    { label: "Sem especialista", value: "unassigned" },
    ...activeSpecialists.map((specialist) => ({
      label: specialist.name,
      value: specialist.id,
    })),
  ];

  function handleSaveAssignment() {
    setSavedSpecialistId(specialistId);
    const specialist = getAdminSpecialist(
      specialistId === "unassigned" ? null : specialistId,
    );
    setFeedback(
      specialist
        ? `${specialist.name} foi atribuído à empresa nesta prévia.`
        : "A empresa ficou sem especialista nesta prévia.",
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <AppTopbarActionsPortal>
        <Button
          type="button"
          onClick={handleSaveAssignment}
          disabled={specialistId === savedSpecialistId}
        >
          Salvar atribuição
        </Button>
      </AppTopbarActionsPortal>

      <section className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold">{company.name}</h1>
            <Badge variant="outline">Cliente ativo</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Atribuição, acessos e histórico de entregas da empresa.
          </p>
        </div>
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href="/admin/empresas" />}
        >
          Voltar para empresas
        </Button>
      </section>

      {feedback ? (
        <p
          role="status"
          className="rounded-lg border border-[var(--chart-positive)]/20 bg-[var(--chart-positive)]/10 px-3 py-2 text-sm text-[var(--chart-positive)]"
        >
          {feedback}
        </p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3" aria-label="Resumo da empresa">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 aria-hidden="true" className="size-4 text-muted-foreground" />
              Estrutura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold tabular-nums">
              {company.companySize ??
                (company.employeeCount
                  ? `${company.employeeCount.toLocaleString("pt-BR")} pessoas`
                  : "Não informado")}
            </p>
            <p className="text-sm text-muted-foreground">Porte registrado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRoundCheck aria-hidden="true" className="size-4 text-muted-foreground" />
              Especialista responsável
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-base font-semibold">
              {assignedSpecialist?.name ?? "Não atribuído"}
            </p>
            <p className="text-sm text-muted-foreground">
              {assignedSpecialist?.title ?? "Atribuição necessária"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="size-4 text-muted-foreground" />
              Entregas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold tabular-nums">
              {preview.deliveries.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {preview.pendingDeliveryCount} em preparação
            </p>
          </CardContent>
        </Card>
      </section>

      <section
        className="grid gap-5 rounded-lg border bg-card p-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]"
        aria-labelledby="assignment-title"
      >
        <div className="space-y-1">
          <h2 id="assignment-title" className="font-heading text-base font-semibold">
            Atribuição da empresa
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            O especialista principal recebe os diagnósticos encerrados desta empresa e prepara as entregas para o cliente.
          </p>
        </div>
        <div className="grid gap-2">
          <label htmlFor="company-specialist" className="text-sm font-medium">
            Especialista principal
          </label>
          <Select
            value={specialistId}
            items={selectItems}
            onValueChange={(value) => {
              if (typeof value === "string") setSpecialistId(value);
            }}
          >
            <SelectTrigger id="company-specialist" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Sem especialista</SelectItem>
              {activeSpecialists.map((specialist) => (
                <SelectItem key={specialist.id} value={specialist.id}>
                  {specialist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            A alteração permanece local até a integração funcional.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="company-deliveries-title">
        <div className="space-y-1">
          <h2 id="company-deliveries-title" className="font-heading text-lg font-semibold">
            Entregas da empresa
          </h2>
          <p className="text-sm text-muted-foreground">
            Diagnósticos encerrados e o estado da preparação para o cliente.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Diagnóstico</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Respostas</TableHead>
                <TableHead className="text-right">Encerrado em</TableHead>
                <TableHead className="w-10"><span className="sr-only">Abrir</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-medium text-foreground">
                    {delivery.diagnosticName}
                  </TableCell>
                  <TableCell>
                    <AdminDeliveryStatusBadge status={delivery.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {delivery.responseCount}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {dateFormatter.format(new Date(delivery.closedAt))}
                  </TableCell>
                  <TableCell>
                    <Button
                      nativeButton={false}
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Abrir ${delivery.diagnosticName}`}
                      render={<Link href={`/admin/entregas/${delivery.id}`} />}
                    >
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {preview.deliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    Nenhuma entrega simulada para esta empresa.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="company-access-title">
        <div className="space-y-1">
          <h2 id="company-access-title" className="font-heading text-lg font-semibold">
            Acessos da empresa
          </h2>
          <p className="text-sm text-muted-foreground">
            O controle antes concentrado em Módulos passa a pertencer ao contexto do cliente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {company.moduleAccess.map((access) => (
            <Badge key={access.moduleId} variant={access.enabled ? "secondary" : "outline"}>
              {modules.find((module) => module.id === access.moduleId)?.shortName ?? access.moduleId}
              {access.enabled ? " ativo" : " inativo"}
            </Badge>
          ))}
          {company.moduleAccess.length === 0 ? (
            <span className="text-sm text-muted-foreground">Nenhum acesso configurado.</span>
          ) : null}
        </div>
      </section>
    </div>
  );
}
