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

export function AdminCompaniesTable() {
  const { companies } = useAdminData();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-foreground text-base font-semibold">
            Empresas mapeadas
          </h2>
          <p className="text-muted-foreground text-sm">
            Empresas agrupadas a partir dos leads cadastrados.
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
              <TableHead>Módulos</TableHead>
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
                  {company.companySize ?? "Não informado"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {company.moduleNames.join(", ")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {company.sources.join(", ")}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {company.leadCount}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {formatDate(company.lastLeadAt)}
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
