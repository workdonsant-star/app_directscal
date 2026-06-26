"use client";

import { Check, Copy, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PessoasStatusBadge } from "@/components/pessoas/pessoas-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  PeopleDirectoryWorkspace,
  PeopleEmploymentType,
  PeoplePersonStatus,
} from "@/lib/types";

import {
  employmentTypeLabel,
  formatCurrency,
} from "./pessoas-formatters";

type DirectoryStatusFilter = "todos" | PeoplePersonStatus;
type DirectoryEmploymentFilter = "todos" | PeopleEmploymentType;

type DirectoryRegistrationLink = {
  previewPath: string;
  publicUrl: string;
};

const statusFilters: DirectoryStatusFilter[] = [
  "todos",
  "ativo",
  "pendente",
  "em_revisao",
  "inativo",
];

const employmentFilters: DirectoryEmploymentFilter[] = [
  "todos",
  "pj",
  "clt",
  "socio",
  "afiliado",
];

const statusFilterLabel: Record<DirectoryStatusFilter, string> = {
  ativo: "Ativos",
  em_revisao: "Em revisão",
  inativo: "Inativos",
  pendente: "Pendentes",
  rascunho: "Rascunhos",
  todos: "Todos",
};

export function PessoasDirectoryWorkspace({
  registrationLink,
  workspace,
}: {
  registrationLink: DirectoryRegistrationLink | null;
  workspace: PeopleDirectoryWorkspace;
}) {
  const [hasCopiedRegistrationLink, setHasCopiedRegistrationLink] =
    useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<DirectoryStatusFilter>("todos");
  const [employmentType, setEmploymentType] =
    useState<DirectoryEmploymentFilter>("todos");

  const normalizedQuery = query.trim().toLowerCase();
  const visiblePeople = workspace.people.filter((person) => {
    const matchesQuery =
      !normalizedQuery ||
      [
        person.name,
        person.email,
        person.area,
        person.operationalRole,
        person.costCenter,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    const matchesStatus = status === "todos" || person.status === status;
    const matchesEmployment =
      employmentType === "todos" || person.employmentType === employmentType;

    return matchesQuery && matchesStatus && matchesEmployment;
  });

  async function copyRegistrationLink() {
    if (!registrationLink) return;

    try {
      await navigator.clipboard.writeText(registrationLink.publicUrl);
      setHasCopiedRegistrationLink(true);
    } catch {
      setHasCopiedRegistrationLink(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Diretório de Pessoas
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Lista operacional e financeira. Abra o perfil para ver vínculo,
            remuneração, documentos, responsabilidades e pagamentos.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end xl:max-w-xl">
          <Button
            type="button"
            variant="outline"
            disabled={!registrationLink}
            title={registrationLink?.publicUrl ?? "Link indisponível"}
            onClick={() => void copyRegistrationLink()}
          >
            {hasCopiedRegistrationLink ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {hasCopiedRegistrationLink
              ? "Link copiado"
              : registrationLink
                ? "Copiar link de cadastro"
                : "Link indisponível"}
          </Button>
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar por pessoa, área ou papel"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={cn(
                "h-8 cursor-pointer rounded-lg border px-3 text-sm font-medium transition-colors",
                status === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {statusFilterLabel[item]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {employmentFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setEmploymentType(item)}
              className={cn(
                "h-7 cursor-pointer rounded-md border px-2.5 text-xs font-medium transition-colors",
                employmentType === item
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item === "todos" ? "Todos os vínculos" : employmentTypeLabel[item]}
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Pessoa</TableHead>
              <TableHead>Vínculo</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Custo mensal</TableHead>
              <TableHead className="w-[112px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiblePeople.map((person) => (
              <TableRow key={person.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <Link
                      href={`/pessoas/${person.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {person.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {person.operationalRole}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{employmentTypeLabel[person.employmentType]}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{person.area}</span>
                    <span className="text-xs text-muted-foreground">
                      {person.costCenter}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <PessoasStatusBadge kind="person" status={person.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(person.remuneration.totalMonthlyCost)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={<Link href={`/pessoas/${person.id}`} />}
                  >
                    Abrir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {visiblePeople.length === 0 && (
        <div className="rounded-lg border border-dashed px-6 py-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Nenhuma pessoa encontrada
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajuste filtros ou busca para voltar à lista completa.
          </p>
        </div>
      )}
    </div>
  );
}
