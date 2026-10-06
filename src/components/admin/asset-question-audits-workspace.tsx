"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useMemo, useState } from "react";

import { AppPage } from "@/components/app-page";
import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { AppTopbar } from "@/components/app-topbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminAssetQuestionAudit } from "@/lib/contracts";
import { cn } from "@/lib/utils";

type Filter = "lacunas" | "todas";

const statusLabels: Record<AdminAssetQuestionAudit["status"], string> = {
  respondida: "Respondida",
  insuficiente: "Sem evidência",
  erro: "Erro",
};

function isGap(audit: AdminAssetQuestionAudit) {
  return audit.status !== "respondida" || audit.feedback === "nao_util";
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AssetQuestionAuditsWorkspace({
  audits,
  embedded = false,
  company,
}: {
  audits: AdminAssetQuestionAudit[];
  embedded?: boolean;
  company: { id: string; name: string };
}) {
  const [filter, setFilter] = useState<Filter>("lacunas");
  const gaps = useMemo(() => audits.filter(isGap), [audits]);
  const visible = filter === "lacunas" ? gaps : audits;

  const PageContent = embedded ? "div" : AppPage;
  const Heading = embedded ? "h2" : "h1";
  const actions = (
          <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
            <TabsList>
              <TabsTrigger value="lacunas" className="gap-2">
                Lacunas
                <span className="rounded-full border bg-background px-1.5 text-xs font-medium tabular-nums text-muted-foreground">
                  {gaps.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="todas" className="gap-2">
                Todas
                <span className="rounded-full border bg-background px-1.5 text-xs font-medium tabular-nums text-muted-foreground">
                  {audits.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
  );

  return (
    <>
      {embedded ? <AppTopbarActionsPortal>{actions}</AppTopbarActionsPortal> : (
      <AppTopbar
        breadcrumb={[
          { label: "Empresas", href: "/admin/empresas" },
          { label: company.name, href: `/admin/empresas/${company.id}` },
          { label: "Criação dos ativos", href: `/admin/empresas/${company.id}/criacao-dos-ativos` },
          { label: "Perguntas ao agente" },
        ]}
        actions={actions}
      />
      )}

      <PageContent>
        <div className="flex w-full flex-col gap-5">
          <div className="space-y-1">
            <Heading className="font-heading text-2xl font-semibold">Perguntas ao agente</Heading>
            <p className="max-w-[75ch] text-sm text-muted-foreground">
              Lacunas reúnem perguntas sem evidência publicada, falhas técnicas e
              respostas avaliadas como não úteis. Cada uma é candidata a um ativo
              novo ou a uma revisão. Mostra as 200 perguntas mais recentes.
            </p>
          </div>

          {visible.length === 0 ? (
            <div className="rounded-lg border border-dashed px-6 py-12 text-center">
              <p className="font-heading text-base font-medium">
                {filter === "lacunas" ? "Nenhuma lacuna registrada" : "Nenhuma pergunta registrada"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                As perguntas feitas no app e no Slack aparecem aqui.
              </p>
            </div>
          ) : (
            <div className="min-w-0">
              <Table className="min-w-[1100px] table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-11 w-[300px] px-4">Pergunta</TableHead>
                    <TableHead className="h-11 w-[300px] px-4">Resposta</TableHead>
                    <TableHead className="h-11 w-[160px] px-4">Empresa</TableHead>
                    <TableHead className="h-11 w-[120px] px-4">Resultado</TableHead>
                    <TableHead className="h-11 w-[110px] px-4">Avaliação</TableHead>
                    <TableHead className="h-11 w-[120px] px-4">Quando</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell className="px-4 py-4 align-top whitespace-normal">
                        <p className="text-sm text-foreground">{audit.question}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {audit.channel === "slack" ? "Slack" : "App"}
                          {audit.provider ? ` · ${audit.provider}` : ""}
                          {audit.latencyMs !== null ? (
                            <span className="tabular-nums"> · {(audit.latencyMs / 1000).toFixed(1)} s</span>
                          ) : null}
                        </p>
                      </TableCell>
                      <TableCell className="px-4 py-4 align-top whitespace-normal">
                        <p className="line-clamp-4 text-sm text-muted-foreground">{audit.answer}</p>
                        {audit.sourceTitles.length > 0 ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Fontes: {audit.sourceTitles.join(", ")}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="truncate px-4 py-4 align-top text-sm">
                        {audit.organizationName}
                      </TableCell>
                      <TableCell className="px-4 py-4 align-top">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            audit.status === "respondida"
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "border-border bg-muted text-muted-foreground",
                          )}
                        >
                          {statusLabels[audit.status]}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-4 align-top whitespace-normal">
                        {audit.feedback ? (
                          <span className="flex items-start gap-1.5 text-sm">
                            {audit.feedback === "util" ? (
                              <ThumbsUp aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                            ) : (
                              <ThumbsDown aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                            )}
                            <span>
                              {audit.feedback === "util" ? "Útil" : "Não útil"}
                              {audit.feedbackComment ? (
                                <span className="block text-xs text-muted-foreground">
                                  {audit.feedbackComment}
                                </span>
                              ) : null}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 align-top text-sm text-muted-foreground tabular-nums">
                        {formatDateTime(audit.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </PageContent>
    </>
  );
}
