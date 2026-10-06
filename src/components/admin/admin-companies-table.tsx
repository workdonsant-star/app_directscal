"use client";

import Link from "next/link";

import { useAdminData } from "@/components/admin/use-admin-data";
import { AdminDeliveryStatusBadge } from "@/components/admin/admin-delivery-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminCompanyOperationsPreview } from "@/lib/data/admin-operations-data-source";

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

      <div className="min-w-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Especialista</TableHead>
              <TableHead>Entrega atual</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Acessos ativos</TableHead>
              <TableHead>Origens</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Último lead</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => {
              const preview = getAdminCompanyOperationsPreview(company.name);
              const currentDelivery = preview.deliveries.find(
                (delivery) => delivery.status !== "publicada",
              );

              return (
              <TableRow key={company.id}>
                <TableCell className="font-medium text-foreground">
                  <Link
                    href={`/admin/empresas/${company.id}`}
                    className="rounded-sm outline-none hover:underline hover:underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {company.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {preview.specialist?.name ?? "Não atribuído"}
                </TableCell>
                <TableCell>
                  {currentDelivery ? (
                    <AdminDeliveryStatusBadge status={currentDelivery.status} />
                  ) : (
                    <span className="text-muted-foreground">Sem entrega</span>
                  )}
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
              );
            })}

            {companies.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
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
