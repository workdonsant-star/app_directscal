"use client";

import { AdminCompanyTabs } from "@/components/admin/admin-company-tabs";
import { useAppRuntime } from "@/components/app-runtime";
import { useSpecialists } from "@/components/admin/use-specialists";
import { SlackDeliveriesPanel } from "@/components/admin/slack-deliveries-panel";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminDeliveryStatusBadge } from "@/components/admin/admin-delivery-status-badge";
import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { AdminCompanyContext } from "@/lib/data/admin-snapshot";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function AdminCompanyDetail({ context }: { context: AdminCompanyContext }) {
  const router = useRouter();
  const runtime = useAppRuntime();
  const { specialists: adminSpecialists } = useSpecialists();
  const { company, modules, operations } = context;
  const initialSpecialistId = operations.assignment.specialistId ?? "unassigned";
  const [specialistId, setSpecialistId] = useState(initialSpecialistId);
  const [savedSpecialistId, setSavedSpecialistId] = useState(initialSpecialistId);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState(operations.assignment.updatedAt);

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
      const response = await runtime.request(`/api/admin/companies/${company.id}`, {
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

      <header className="space-y-1">
        <h1 className="text-ui-page">{company.name}</h1>
        <p className="text-sm text-muted-foreground">Atribuição, diagnósticos encerrados e entregas.</p>
      </header>

      <AdminCompanyTabs companyId={company.id} active="operation" hasOrganization={Boolean(company.organizationId)} />

      {feedback ? (
        <p
          role="status"
          className="rounded-lg border border-[var(--chart-positive)]/20 bg-[var(--chart-positive)]/10 px-3 py-2 text-sm text-[var(--chart-positive)]"
        >
          {feedback}
        </p>
      ) : null}
      {saveError ? <p role="alert" className="text-sm text-destructive">{saveError}</p> : null}

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
            Diagnósticos encerrados
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
                      render={<Link href={runtime.href(`/admin/entregas/${delivery.id}`)} />}
                    >
                      <ArrowRight aria-hidden="true" />
                    </Button> : <span className="text-xs text-muted-foreground">Sem base para análise</span>}
                  </TableCell>
                </TableRow>
              ))}
              {operations.deliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    Nenhum diagnóstico encerrado para esta empresa.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </section>

      {company.organizationId ? <SlackDeliveriesPanel key={company.id} companyId={company.id} /> : null}

      <Link href={runtime.href("/admin/guia")} className="w-fit text-sm underline underline-offset-4">Guia de operação</Link>

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
