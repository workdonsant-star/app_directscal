"use client";

import { useSpecialists } from "@/components/admin/use-specialists";

import { ArrowRight, Building2, CalendarDays, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminDeliveryStatusBadge } from "@/components/admin/admin-delivery-status-badge";
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
import type { AdminCompanyContext } from "@/lib/data/admin-company-operations-data-source";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function AdminCompanyDetail({ context }: { context: AdminCompanyContext }) {
  const router = useRouter();
  const { specialists: adminSpecialists, getSpecialist: getAdminSpecialist } = useSpecialists();
  const { company, modules, operations } = context;
  const initialSpecialistId = operations.assignment.specialistId ?? "unassigned";
  const [specialistId, setSpecialistId] = useState(initialSpecialistId);
  const [savedSpecialistId, setSavedSpecialistId] = useState(initialSpecialistId);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState(operations.assignment.updatedAt);

  const assignedSpecialist = getAdminSpecialist(
    savedSpecialistId === "unassigned" ? null : savedSpecialistId,
  );
  const activeSpecialists = adminSpecialists.filter(
    (specialist) => specialist.status === "ativo" && !specialist.archived,
  );
  const selectItems = [
    { label: "Sem especialista", value: "unassigned" },
    ...activeSpecialists.map((specialist) => ({
      label: specialist.name,
      value: specialist.id,
    })),
  ];

  async function handleSaveAssignment() {
    setSaving(true);
    setSaveError(null);
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/companies/${company.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialistId: specialistId === "unassigned" ? null : specialistId, expectedUpdatedAt: updatedAt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "Não foi possível salvar a atribuição.");
      setSavedSpecialistId(data.assignment.specialistId ?? "unassigned");
      setUpdatedAt(data.assignment.updatedAt);
      setFeedback("Atribuição salva.");
      router.refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Não foi possível salvar a atribuição.");
    } finally { setSaving(false); }
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <AppTopbarActionsPortal>
        <Button
          type="button"
          onClick={handleSaveAssignment}
          disabled={saving || !company.organizationId || specialistId === savedSpecialistId}
        >
          Salvar atribuição
        </Button>
      </AppTopbarActionsPortal>

      <section className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-ui-page">{company.name}</h1>
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
      {saveError ? <p role="alert" className="text-sm text-destructive">{saveError}</p> : null}

      {company.organizationId ? (
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="company-assets-title">
          <div className="space-y-1">
            <h2 id="company-assets-title" className="text-ui-section">Criação dos ativos</h2>
            <p className="text-sm text-muted-foreground">Produção, revisão e publicação dos ativos de gestão desta empresa.</p>
          </div>
          <Button nativeButton={false} variant="outline" render={<Link href={`/admin/empresas/${company.id}/criacao-dos-ativos`} />}>
            Abrir criação dos ativos
            <ArrowRight aria-hidden="true" />
          </Button>
        </section>
      ) : null}

      {company.organizationId ? (
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="company-routines-title">
          <div className="space-y-1">
            <h2 id="company-routines-title" className="text-ui-section">Operação das rotinas</h2>
            <p className="text-sm text-muted-foreground">Acordos, responsáveis, origem e histórico dos action points publicados.</p>
          </div>
          <Button nativeButton={false} variant="outline" render={<Link href={`/admin/empresas/${company.id}/rotinas`} />}>
            Abrir rotinas <ArrowRight aria-hidden="true" />
          </Button>
        </section>
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
            <p className="text-2xl font-bold tabular-nums">
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
            <p className="text-base font-bold">
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
            <p className="text-2xl font-bold tabular-nums">
              {operations.deliveries.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {operations.deliveries.filter(item => item.status !== "publicada").length} em preparação
            </p>
          </CardContent>
        </Card>
      </section>

      <section
        className="grid gap-5 rounded-lg bg-card p-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]"
        aria-labelledby="assignment-title"
      >
        <div className="space-y-1">
          <h2 id="assignment-title" className="text-ui-title">
            Atribuição da empresa
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            O especialista principal é sugerido para novas entregas. Entregas existentes preservam a atribuição definida na revisão.
          </p>
        </div>
        <div className="grid gap-2">
          <label htmlFor="company-specialist" className="text-sm font-medium">
            Especialista principal
          </label>
          <Select
            disabled={saving || !company.organizationId}
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
            {company.organizationId ? "A atribuição é compartilhada entre as sessões da operação." : "A empresa precisa concluir o cadastro antes da atribuição."}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="company-deliveries-title">
        <div className="space-y-1">
          <h2 id="company-deliveries-title" className="text-ui-section">
            Entregas da empresa
          </h2>
          <p className="text-sm text-muted-foreground">
            Diagnósticos encerrados e o estado da preparação para o cliente.
          </p>
        </div>

        <div className="min-w-0">
          <Table variant="operational">
            <TableHeader>
              <TableRow>
                <TableHead>Diagnóstico</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Respostas</TableHead>
                <TableHead className="text-right">Encerrado em</TableHead>
                <TableHead className="w-10"><span className="sr-only">Abrir</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations.deliveries.map((delivery) => (
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
                    {delivery.canAnalyze ? <Button
                      nativeButton={false}
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Abrir ${delivery.diagnosticName}`}
                      render={<Link href={`/admin/entregas/${delivery.id}`} />}
                    >
                      <ArrowRight aria-hidden="true" />
                    </Button> : <span className="text-xs text-muted-foreground">Sem base para análise</span>}
                  </TableCell>
                </TableRow>
              ))}
              {operations.deliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    Nenhuma entrega encerrada para esta empresa.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="company-access-title">
        <div className="space-y-1">
          <h2 id="company-access-title" className="text-ui-section">
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
