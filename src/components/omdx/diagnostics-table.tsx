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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
} from "@/lib/data/omdx-domain";
import type {
  Diagnostic,
  DiagnosticShareLink,
  DiagnosticStatus,
} from "@/lib/types";

export type DiagnosticsFilter = "todos" | DiagnosticStatus;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type DiagnosticsTableProps = {
  currentUserId: string;
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
  link,
  onCopy,
}: {
  copiedKey: string | null;
  diagnostic: Diagnostic;
  link?: DiagnosticShareLink;
  onCopy: (diagnostic: Diagnostic, link: DiagnosticShareLink) => void;
}) {
  if (diagnostic.status === "rascunho" || !link) {
    return <span className="text-muted-foreground">—</span>;
  }

  const key = link.id;
  const copied = copiedKey === key;

  return (
    <Button
      variant="outline"
      size="xs"
      onClick={() => onCopy(diagnostic, link)}
      aria-label={`Copiar link de ${link.sectorName ?? link.group}`}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "Copiado" : "Copiar"}
    </Button>
  );
}

function creatorInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function TeamLinksCell({
  copiedKey,
  diagnostic,
  links,
  onCopy,
}: {
  copiedKey: string | null;
  diagnostic: Diagnostic;
  links: DiagnosticShareLink[];
  onCopy: (diagnostic: Diagnostic, link: DiagnosticShareLink) => void;
}) {
  if (diagnostic.status === "rascunho" || links.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (links.length === 1) {
    return (
      <ResponseLinkCell
        copiedKey={copiedKey}
        diagnostic={diagnostic}
        link={links[0]}
        onCopy={onCopy}
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="xs" aria-label="Abrir links dos times" />
        }
      >
        {links.length} links
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {links.map((link) => (
          <DropdownMenuItem key={link.id} onClick={() => onCopy(diagnostic, link)}>
            {copiedKey === link.id ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {link.sectorName ?? "Time"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DiagnosticsTable({
  currentUserId,
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
    setCopiedKey(link.id);
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
      <div className="min-w-0">
        <Table className="min-w-[1180px] table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="h-11 w-[260px] px-4">Diagnóstico</TableHead>
              <TableHead className="h-11 w-[190px] px-4">Criado por</TableHead>
              <TableHead className="h-11 w-[130px] px-4">Setores</TableHead>
              <TableHead className="h-11 w-[85px] px-4">Status</TableHead>
              <TableHead className="h-11 w-[105px] px-4">Liderança</TableHead>
              <TableHead className="h-11 w-[105px] px-4">Times</TableHead>
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
                <TableCell className="px-4 py-4">
                  {d.creator ? (
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar size="sm">
                        {d.creator.avatarUrl && (
                          <AvatarImage src={d.creator.avatarUrl} alt="" />
                        )}
                        <AvatarFallback>
                          {creatorInitials(d.creator.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">
                          {d.creator.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {d.creator.userId === currentUserId
                            ? "Você"
                            : d.creator.role === "cliente"
                              ? "Superadmin"
                              : "Liderança"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Não identificado
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4">
                  {d.sectors && d.sectors.length > 0 ? (
                    <Badge variant="outline">
                      {d.sectors.length} setor{d.sectors.length === 1 ? "" : "es"}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <StatusBadge status={d.status} />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <ResponseLinkCell
                    copiedKey={copiedKey}
                    diagnostic={d}
                    link={shareLinksByDiagnosticId[d.id]?.find(
                      (link) => link.group === "lideranca",
                    )}
                    onCopy={handleCopyResponseLink}
                  />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <TeamLinksCell
                    copiedKey={copiedKey}
                    diagnostic={d}
                    links={(shareLinksByDiagnosticId[d.id] ?? []).filter(
                      (link) => link.group === "operacao",
                    )}
                    onCopy={handleCopyResponseLink}
                  />
                </TableCell>
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
                      {d.status === "rascunho" && d.permissions?.canManage && (
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
                      {d.permissions?.canManage && (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDiagnosticToDelete(d)}
                        >
                          <Trash2 className="size-4" />
                          Excluir
                        </DropdownMenuItem>
                      )}
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
