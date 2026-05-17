"use client";

import {
  Check,
  Copy,
  Download,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import { DeleteDiagnosticDialog } from "@/components/omdx/delete-diagnostic-dialog";
import { StatusBadge } from "@/components/omdx/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  canGenerateDiagnosticActionPlan,
  canGenerateDiagnosticReport,
  getRespondentGroups,
} from "@/lib/data/omdx-domain";
import type {
  Diagnostic,
  DiagnosticShareLink,
  DiagnosticStatus,
  RespondentGroup,
} from "@/lib/types";

type Filter = "todos" | DiagnosticStatus;

const filters: { value: Filter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "ativo", label: "Ativos" },
  { value: "rascunho", label: "Rascunhos" },
  { value: "encerrado", label: "Encerrados" },
];

const respondentGroups = getRespondentGroups();

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type DiagnosticsTableProps = {
  diagnostics: Diagnostic[];
  shareLinksByDiagnosticId: Record<string, DiagnosticShareLink[]>;
  onConfigure?: (diagnostic: Diagnostic) => void;
  onDelete?: (diagnostic: Diagnostic) => void;
};

function deadlineLabel(diagnostic: Diagnostic) {
  if (!diagnostic.deadline) return "—";
  if (diagnostic.status === "encerrado") {
    return formatDate(diagnostic.deadline);
  }
  const now = new Date();
  const end = new Date(diagnostic.deadline);
  const diff = Math.ceil(
    (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff < 0) return "Prazo encerrado";
  if (diff === 0) return "Encerra hoje";
  if (diff === 1) return "1 dia restante";
  return `${diff} dias restantes`;
}

function ResponseLinkCell({
  copiedKey,
  diagnostic,
  groupId,
  link,
  onCopy,
}: {
  copiedKey: string | null;
  diagnostic: Diagnostic;
  groupId: RespondentGroup;
  link?: DiagnosticShareLink;
  onCopy: (diagnostic: Diagnostic, link: DiagnosticShareLink) => void;
}) {
  if (diagnostic.status === "rascunho" || !link) {
    return <span className="text-muted-foreground">—</span>;
  }

  const key = `${diagnostic.id}-${groupId}`;
  const copied = copiedKey === key;

  return (
    <Button
      variant="outline"
      size="xs"
      onClick={() => onCopy(diagnostic, link)}
      aria-label={`Copiar link de ${groupId}`}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "Copiado" : "Copiar"}
    </Button>
  );
}

export function DiagnosticsTable({
  diagnostics,
  shareLinksByDiagnosticId,
  onConfigure,
  onDelete,
}: DiagnosticsTableProps) {
  const [filter, setFilter] = useState<Filter>("todos");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [diagnosticToDelete, setDiagnosticToDelete] =
    useState<Diagnostic | null>(null);

  const counts = useMemo(
    () => ({
      todos: diagnostics.length,
      ativo: diagnostics.filter((d) => d.status === "ativo").length,
      rascunho: diagnostics.filter((d) => d.status === "rascunho").length,
      encerrado: diagnostics.filter((d) => d.status === "encerrado").length,
    }),
    [diagnostics],
  );

  const visible = useMemo(
    () =>
      filter === "todos"
        ? diagnostics
        : diagnostics.filter((d) => d.status === filter),
    [diagnostics, filter],
  );

  async function handleCopyResponseLink(
    diagnostic: Diagnostic,
    link: DiagnosticShareLink,
  ) {
    await navigator.clipboard.writeText(link.publicUrl);
    setCopiedKey(`${diagnostic.id}-${link.group}`);
    window.setTimeout(() => setCopiedKey(null), 1800);
  }

  function handleConfirmDelete(diagnostic: Diagnostic) {
    onDelete?.(diagnostic);
    setDiagnosticToDelete(null);
  }

  function handleDownloadReport(diagnostic: Diagnostic) {
    window.location.assign(`/omdx/${diagnostic.id}/relatorio`);
  }

  function handleDownloadActionPoints(diagnostic: Diagnostic) {
    window.location.assign(`/omdx/${diagnostic.id}/action-points`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
        >
          <TabsList>
            {filters.map((f) => (
              <TabsTrigger key={f.value} value={f.value} className="gap-2">
                {f.label}
                <span className="text-muted-foreground bg-background rounded-full border px-1.5 text-xs font-medium tabular-nums">
                  {counts[f.value]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[24%]">Diagnóstico</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Status</TableHead>
              {respondentGroups.map((group) => (
                <TableHead key={group.id}>{group.label}</TableHead>
              ))}
              <TableHead className="text-right">Respostas</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((d) => (
              <TableRow key={d.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="text-foreground">{d.name}</span>
                    <span className="text-muted-foreground text-xs">
                      Criado em {formatDate(d.createdAt)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {d.company}
                </TableCell>
                <TableCell>
                  <StatusBadge status={d.status} />
                </TableCell>
                {respondentGroups.map((group) => (
                  <TableCell key={group.id}>
                    <ResponseLinkCell
                      copiedKey={copiedKey}
                      diagnostic={d}
                      groupId={group.id}
                      link={shareLinksByDiagnosticId[d.id]?.find(
                        (link) => link.group === group.id,
                      )}
                      onCopy={handleCopyResponseLink}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-right tabular-nums">
                  {d.responses.total > 0 ? (
                    <span className="text-foreground">{d.responses.total}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {d.generalScore !== null ? (
                    <span className="text-foreground font-medium">
                      {d.generalScore.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {deadlineLabel(d)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label="Ações"
                        />
                      }
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {d.status === "rascunho" && (
                        <DropdownMenuItem
                          onClick={() => onConfigure?.(d)}
                        >
                          <Pencil className="size-4" />
                          Continuar configuração
                        </DropdownMenuItem>
                      )}
                      {canGenerateDiagnosticReport(d) && (
                        <DropdownMenuItem
                          onClick={() => handleDownloadReport(d)}
                        >
                          <Download className="size-4" />
                          Baixar relatório
                        </DropdownMenuItem>
                      )}
                      {canGenerateDiagnosticActionPlan(d) && (
                        <DropdownMenuItem
                          onClick={() => handleDownloadActionPoints(d)}
                        >
                          <Download className="size-4" />
                          Baixar action points
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDiagnosticToDelete(d)}
                      >
                        <Trash2 className="size-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {visible.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-muted-foreground py-12 text-center text-sm"
                >
                  Nenhum diagnóstico nesta categoria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteDiagnosticDialog
        diagnostic={diagnosticToDelete}
        open={Boolean(diagnosticToDelete)}
        onOpenChange={(open) => {
          if (!open) setDiagnosticToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
