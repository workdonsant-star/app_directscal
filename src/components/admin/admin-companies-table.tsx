"use client";

import Link from "next/link";

import { useAdminData } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatEmployeeCount(value: number | null) {
  return value ? `${value.toLocaleString("pt-BR")} pessoas` : "Não informado";
}

export function AdminCompaniesTable() {
  const { companies, modules } = useAdminData();
  const moduleNameById = new Map(
    modules.map((module) => [module.id, module.shortName]),
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-foreground text-base font-semibold">
            Clientes cadastrados
          </h2>
          <p className="text-muted-foreground text-sm">
            Organizações com conta criada e histórico de aquisição associado.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/admin/leads" />}
        >
          Ver leads
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Acessos ativos</TableHead>
              <TableHead>Origens</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Último lead</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium text-foreground">
                  {company.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {company.companySize ?? formatEmployeeCount(company.employeeCount)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {company.moduleAccess
                    .filter((access) => access.enabled)
                    .map((access) => moduleNameById.get(access.moduleId) ?? access.moduleId)
                    .join(", ") || "Nenhum"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {company.sources.join(", ") || "Sem campanha"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {company.leadCount}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {company.lastLeadAt ? formatDate(company.lastLeadAt) : "Sem leads"}
                </TableCell>
              </TableRow>
            ))}

            {companies.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  Nenhuma empresa mapeada até agora.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
