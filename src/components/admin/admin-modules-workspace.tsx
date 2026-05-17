"use client";

import Link from "next/link";

import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { useAdminData } from "@/components/admin/use-admin-data";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AdminModulesWorkspace() {
  const { campaigns, companies, leads, modules } = useAdminData();
  const activeCampaigns = campaigns.filter(
    (campaign) => campaign.status === "ativo",
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Módulos ativos"
          value={String(modules.filter((module) => module.status === "ativo").length)}
          caption="OMDx em operação"
          hint="Catálogo inicial"
        />
        <KpiCard
          label="Campanhas ativas"
          value={String(activeCampaigns)}
          caption="Links de aquisição"
          hint="Por módulo e origem"
        />
        <KpiCard
          label="Leads capturados"
          value={leads.length.toLocaleString("pt-BR")}
          caption="Base Supabase"
          hint="Cadastros de campanha"
        />
        <KpiCard
          label="Empresas mapeadas"
          value={companies.length.toLocaleString("pt-BR")}
          caption="Agrupadas por nome"
          hint="A partir dos leads"
        />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-foreground text-base font-semibold">
              Aplicativos disponíveis
            </h2>
            <p className="text-muted-foreground text-sm">
              O catálogo começa com o OMDx como primeira isca operacional.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/admin/campanhas" />}
          >
            Ver campanhas
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Módulo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Campanhas</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Empresas</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {module.shortName}
                      </span>
                      <span className="text-muted-foreground max-w-xl text-xs">
                        {module.description}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <AdminStatusBadge status={module.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {module.campaignsCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {module.leadCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {module.companyCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={module.productPath} />}
                    >
                      Abrir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
