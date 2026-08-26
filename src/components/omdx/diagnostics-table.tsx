"use client";

import {
  Check,
  Copy,
  Download,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export type DiagnosticsFilter = "todos" | DiagnosticStatus;

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
  filter: DiagnosticsFilter;
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
  filter,
  shareLinksByDiagnosticId,
  onConfigure,
  onDelete,
}: DiagnosticsTableProps) {
  const router = useRouter();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [diagnosticToDelete, setDiagnosticToDelete] =
    useState<Diagnostic | null>(null);

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

  function handleDownloadReportCsv(diagnostic: Diagnostic) {
    window.location.assign(`/omdx/${diagnostic.id}/relatorio?formato=csv`);
  }

  function handleDownloadActionPoints(diagnostic: Diagnostic) {
    window.location.assign(`/omdx/${diagnostic.id}/action-points`);
  }

  function handleRowClick(
    event: React.MouseEvent<HTMLTableRowElement>,
    diagnostic: Diagnostic,
  ) {
    if ((event.target as HTMLElement).closest("a, button, [role='menuitem']")) {
      return;
    }

    router.push(`/omdx/${diagnostic.id}/compartilhar`);
  }

  return (
    <div>
      <div className="overflow-hidden rounded-[5px] ring-1 ring-foreground/10">
        <Table className="min-w-[1100px] table-fixed">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="h-11 w-[260px] px-4">Diagnóstico</TableHead>
              <TableHead className="h-11 w-[125px] px-4">Empresa</TableHead>
              <TableHead className="h-11 w-[85px] px-4">Status</TableHead>
              {respondentGroups.map((group) => (
                <TableHead key={group.id} className="h-11 w-[100px] px-4">
                  {group.label}
                </TableHead>
              ))}
              <TableHead className="h-11 w-[85px] px-4 text-right">
                Respostas
              </TableHead>
              <TableHead className="h-11 w-[60px] px-4 text-right">
                Score
              </TableHead>
              <TableHead className="h-11 w-[155px] px-4">Prazo</TableHead>
              <TableHead className="h-11 w-[60px] px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((d) => (
              <TableRow
                key={d.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={(event) => handleRowClick(event, d)}
              >
                <TableCell className="px-4 py-4 font-medium whitespace-normal">
                  <div className="flex flex-col">
                    <Link
                      href={`/omdx/${d.id}/compartilhar`}
                      className="text-foreground rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {d.name}
                    </Link>
                    <span className="text-muted-foreground text-xs">
                      Criado em {formatDate(d.createdAt)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4 text-muted-foreground">
                  {d.company}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <StatusBadge status={d.status} />
                </TableCell>
                {respondentGroups.map((group) => (
                  <TableCell key={group.id} className="px-4 py-4">
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
                <TableCell className="px-4 py-4 text-right tabular-nums">
                  {d.responses.total > 0 ? (
                    <span className="text-foreground">{d.responses.total}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4 text-right tabular-nums">
                  {d.generalScore !== null ? (
                    <span className="text-foreground font-medium">
                      {d.generalScore.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4 text-sm text-muted-foreground">
                  {deadlineLabel(d)}
                </TableCell>
                <TableCell className="px-4 py-4">
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
                          Baixar relatório PDF
                        </DropdownMenuItem>
                      )}
                      {canGenerateDiagnosticReport(d) && (
                        <DropdownMenuItem
                          onClick={() => handleDownloadReportCsv(d)}
                        >
                          <Download className="size-4" />
                          Baixar relatório CSV
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
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
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
