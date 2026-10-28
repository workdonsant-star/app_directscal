"use client";

import { useSpecialists } from "@/components/admin/use-specialists";

import { Check, Circle, Download, Save, Send } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { AdminDeliveryStatusBadge } from "@/components/admin/admin-delivery-status-badge";
import { formatScore } from "@/components/admin/delivery/delivery-draft";
import { useDeliveryDraft } from "@/components/admin/delivery/delivery-draft-provider";
import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";

type StepKey = "dados" | "relatorio" | "action-points" | "ativos" | "publicar";

const stepGroups: Array<{
  label: string;
  steps: Array<{ key: StepKey; label: string }>;
}> = [
  { label: "Analisar", steps: [{ key: "dados", label: "Dados" }] },
  {
    label: "Produzir",
    steps: [
      { key: "relatorio", label: "Relatório" },
      { key: "action-points", label: "Action points" },
      { key: "ativos", label: "Criação dos ativos" },
    ],
  },
  { label: "Entregar", steps: [{ key: "publicar", label: "Publicação" }] },
];

function ReadinessItem({
  complete,
  href,
  children,
}: {
  complete: boolean;
  href: string;
  children: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-2 rounded-sm text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {complete ? (
          <Check aria-hidden="true" className="size-4 text-[var(--chart-positive)]" />
        ) : (
          <Circle aria-hidden="true" className="size-4 text-muted-foreground" />
        )}
        <span
          className={cn(
            complete ? "text-foreground" : "text-muted-foreground underline-offset-4 hover:underline",
          )}
        >
          {children}
        </span>
      </Link>
    </li>
  );
}

export function DeliveryShell({ children }: { children: ReactNode }) {
  const { specialists: adminSpecialists } = useSpecialists();
  const router = useRouter();
  const pathname = usePathname();
  const draft = useDeliveryDraft();
  const { delivery } = draft;
  const basePath = `/admin/entregas/${delivery.id}`;
  const inAssets = pathname.startsWith(`${basePath}/ativos`);

  const averageGap = draft.analysis.dimensions.length
    ? draft.analysis.dimensions.reduce((total, dimension) => total + dimension.gap, 0) /
      draft.analysis.dimensions.length
    : 0;
  const reportOptions = draft.deliveryOptions.map((item) => ({
    label: `${item.diagnosticName} · ${new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "numeric",
    }).format(new Date(item.closedAt))}`,
    value: item.id,
  }));
  const specialistOptions = [
    { label: "Sem especialista", value: "unassigned" },
    ...adminSpecialists
      .filter((specialist) => specialist.status === "ativo" && !specialist.archived)
      .map((specialist) => ({ label: specialist.name, value: specialist.id })),
  ];

  function stepIndicator(key: StepKey): ReactNode {
    if (key === "relatorio") {
      return draft.reportComplete ? (
        <Check aria-label="Relatório completo" className="size-3.5 text-[var(--chart-positive)]" />
      ) : (
        <span className="text-xs tabular-nums text-muted-foreground">
          {draft.reportFilledCount}/6
        </span>
      );
    }
    if (key === "action-points") {
      return (
        <span className="rounded-full border bg-background px-1.5 text-xs tabular-nums">
          {draft.selectedActionPointIds.size}
        </span>
      );
    }
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {!inAssets ? (
        <AppTopbarActionsPortal>
          <div className="flex items-center gap-2">
            <Button nativeButton={false} variant="outline" render={<Link href={`${basePath}/publicar`} />}>
              Pré-visualizar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void draft.persistDelivery("save")}
              disabled={draft.isSaving}
            >
              <Save aria-hidden="true" />
              {draft.isSaving ? "Salvando" : "Salvar rascunho"}
            </Button>
            <Button
              type="button"
              onClick={() => void draft.persistDelivery("publish")}
              disabled={
                draft.isSaving || !draft.readyToPublish || (draft.status === "publicada" && !draft.hasUnsavedChanges)
              }
            >
              <Send aria-hidden="true" />
              {draft.status === "publicada" && !draft.hasUnsavedChanges ? "Publicado" : "Publicar entrega"}
            </Button>
          </div>
        </AppTopbarActionsPortal>
      ) : null}

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-ui-page">{delivery.companyName}</h1>
            <AdminDeliveryStatusBadge status={draft.status} />
            {draft.hasUnsavedChanges ? <span className="text-xs text-muted-foreground">Alterações não salvas</span> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {delivery.diagnosticName} · {delivery.responseCount.toLocaleString("pt-BR")} respostas · Maturidade {formatScore(delivery.generalScore)}/5 · Gap {formatScore(averageGap)}/5
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="grid min-w-0 gap-1.5 sm:w-72">
            <label htmlFor="delivery-report-selector" className="text-xs font-medium text-muted-foreground">
              Diagnóstico
            </label>
            <Select
              value={delivery.id}
              items={reportOptions}
              onValueChange={(value) => {
                if (typeof value === "string" && value !== delivery.id) {
                  router.push(`/admin/entregas/${value}/dados`);
                }
              }}
            >
              <SelectTrigger id="delivery-report-selector" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            nativeButton={false}
            variant="outline"
            render={<a href={`${basePath}/relatorio/pdf`} />}
          >
            <Download aria-hidden="true" />
            Baixar relatório
          </Button>
        </div>
      </header>

      {draft.feedback ? (
        <p role={draft.feedbackKind === "error" ? "alert" : "status"} className={cn("rounded-lg bg-muted px-3 py-2 text-sm", draft.feedbackKind === "error" ? "text-destructive" : "text-foreground")}>
          {draft.feedback}
        </p>
      ) : null}

      <div className="grid gap-8 border-t pt-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          <nav aria-label="Etapas da entrega" className="flex flex-col gap-5">
            {stepGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                <p className="px-2 font-label text-ui-label text-muted-foreground">
                  {group.label}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {group.steps.map((step) => {
                    const href = `${basePath}/${step.key}`;
                    const active = pathname === href || pathname.startsWith(`${href}/`);

                    return (
                      <li key={step.key}>
                        <Link
                          href={href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex h-8 items-center justify-between gap-2 rounded-md px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active
                              ? "bg-muted font-medium text-foreground"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                          )}
                        >
                          <span className="truncate">{step.label}</span>
                          {stepIndicator(step.key)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="grid gap-1.5">
            <label htmlFor="delivery-specialist" className="px-2 font-label text-ui-label text-muted-foreground">
              Especialista
            </label>
            <Select
              value={draft.specialistId}
              items={specialistOptions}
              onValueChange={(value) => {
                if (typeof value === "string") draft.setSpecialistId(value);
              }}
            >
              <SelectTrigger id="delivery-specialist" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {specialistOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <section aria-labelledby="delivery-readiness-title" className="space-y-3 border-t pt-4">
            <h2 id="delivery-readiness-title" className="px-2 font-label text-ui-label text-muted-foreground">
              Para publicar
            </h2>
            <ul className="space-y-2.5 px-2">
              <ReadinessItem complete={draft.specialistComplete} href={`${basePath}/publicar`}>
                Especialista atribuído
              </ReadinessItem>
              <ReadinessItem complete={draft.reportComplete} href={`${basePath}/relatorio`}>
                Relatório preenchido
              </ReadinessItem>
              <ReadinessItem complete={draft.actionPointsComplete} href={`${basePath}/action-points`}>
                Action points selecionados
              </ReadinessItem>
            </ul>
          </section>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
