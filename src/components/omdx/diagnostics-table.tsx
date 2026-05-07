"use client";

import { Copy, Eye, MoreHorizontal, Pencil } from "lucide-react";
import { useMemo, useState } from "react";

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
import { StatusBadge } from "@/components/omdx/status-badge";
import { diagnostics } from "@/lib/mock-data";
import type { Diagnostic, DiagnosticStatus } from "@/lib/types";

type Filter = "todos" | DiagnosticStatus;

const filters: { value: Filter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "ativo", label: "Ativos" },
  { value: "rascunho", label: "Rascunhos" },
  { value: "encerrado", label: "Encerrados" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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

export function DiagnosticsTable() {
  const [filter, setFilter] = useState<Filter>("todos");

  const counts = useMemo(
    () => ({
      todos: diagnostics.length,
      ativo: diagnostics.filter((d) => d.status === "ativo").length,
      rascunho: diagnostics.filter((d) => d.status === "rascunho").length,
      encerrado: diagnostics.filter((d) => d.status === "encerrado").length,
    }),
    [],
  );

  const visible = useMemo(
    () =>
      filter === "todos"
        ? diagnostics
        : diagnostics.filter((d) => d.status === filter),
    [filter],
  );

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

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[28%]">Diagnóstico</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Status</TableHead>
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
                        <DropdownMenuItem>
                          <Pencil className="size-4" />
                          Continuar configuração
                        </DropdownMenuItem>
                      )}
                      {d.status === "ativo" && (
                        <>
                          <DropdownMenuItem>
                            <Copy className="size-4" />
                            Copiar link
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="size-4" />
                            Ver progresso
                          </DropdownMenuItem>
                        </>
                      )}
                      {(d.status === "encerrado" || d.generalScore !== null) && (
                        <DropdownMenuItem>
                          <Eye className="size-4" />
                          Ver resultado
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
                  colSpan={7}
                  className="text-muted-foreground py-12 text-center text-sm"
                >
                  Nenhum diagnóstico nesta categoria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
