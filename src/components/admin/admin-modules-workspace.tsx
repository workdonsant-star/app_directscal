"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, CircleSlash } from "lucide-react";

import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { useAdminDataSnapshot } from "@/components/admin/use-admin-data";
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
import {
  notifyAdminDataChanged,
  type AdminDataSnapshot,
} from "@/lib/data/admin-data-source";
import { cn } from "@/lib/utils";

export function AdminModulesWorkspace({
  initialSnapshot,
}: {
  initialSnapshot?: AdminDataSnapshot;
}) {
  const { campaigns, companies, leads, modules } =
    useAdminDataSnapshot(initialSnapshot);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [optimisticAccess, setOptimisticAccess] = useState<
    Record<string, boolean>
  >({});
  const activeCampaigns = campaigns.filter(
    (campaign) => campaign.status === "ativo",
  ).length;
  const registeredClients = useMemo(
    () => companies.filter((company) => company.organizationId),
    [companies],
  );

  function accessKey(organizationId: string, moduleId: string) {
    return `${organizationId}:${moduleId}`;
  }

  function isModuleEnabled(organizationId: string, moduleId: string) {
    const key = accessKey(organizationId, moduleId);
    const company = registeredClients.find(
      (item) => item.organizationId === organizationId,
    );

    return (
      optimisticAccess[key] ??
      company?.moduleAccess.find((access) => access.moduleId === moduleId)
        ?.enabled ??
      true
    );
  }

  async function toggleModuleAccess({
    enabled,
    moduleId,
    organizationId,
  }: {
    enabled: boolean;
    moduleId: string;
    organizationId: string;
  }) {
    const key = accessKey(organizationId, moduleId);
    setPendingKey(key);
    setAccessError(null);
    setOptimisticAccess((current) => ({ ...current, [key]: enabled }));

    try {
      const response = await fetch("/api/admin/module-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, moduleId, organizationId }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(data?.message ?? "Não foi possível alterar o acesso.");
      }

      notifyAdminDataChanged();
    } catch (error) {
      setOptimisticAccess((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setAccessError(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o acesso.",
      );
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Módulos ativos"
          value={String(modules.filter((module) => module.status === "ativo").length)}
          caption="Maturidade em operação"
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
          label="Clientes cadastrados"
          value={companies.length.toLocaleString("pt-BR")}
          caption="Organizações no Supabase"
          hint="Com controle de acesso"
        />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-foreground text-base font-semibold">
              Aplicativos disponíveis
            </h2>
            <p className="text-muted-foreground text-sm">
              O catálogo começa com Maturidade como primeira isca operacional.
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

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-foreground text-base font-semibold">
            Acesso por cliente
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Ative ou bloqueie módulos para empresas com conta criada. Sem regra
            manual, o cliente mantém acesso ao catálogo ativo.
          </p>
        </div>

        {accessError && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {accessError}
          </p>
        )}

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                {modules.map((module) => (
                  <TableHead key={module.id} className="text-right">
                    {module.shortName}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {registeredClients.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {company.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {company.employeeCount
                          ? `${company.employeeCount.toLocaleString("pt-BR")} pessoas`
                          : "Tamanho não informado"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {company.leadCount}
                  </TableCell>
                  {modules.map((module) => {
                    const organizationId = company.organizationId;
                    const key = organizationId
                      ? accessKey(organizationId, module.id)
                      : module.id;
                    const enabled = organizationId
                      ? isModuleEnabled(organizationId, module.id)
                      : false;

                    return (
                      <TableCell key={module.id} className="text-right">
                        <Button
                          aria-pressed={enabled}
                          className={cn(
                            "min-w-24 justify-start",
                            enabled
                              ? "border-[var(--chart-positive)]/25 bg-[var(--chart-positive)]/10 text-[var(--chart-positive)] hover:bg-[var(--chart-positive)]/15"
                              : "text-muted-foreground",
                          )}
                          disabled={!organizationId || pendingKey === key}
                          onClick={() => {
                            if (!organizationId) return;
                            toggleModuleAccess({
                              enabled: !enabled,
                              moduleId: module.id,
                              organizationId,
                            });
                          }}
                          size="sm"
                          variant="outline"
                        >
                          {enabled ? <Check /> : <CircleSlash />}
                          {enabled ? "Ativo" : "Inativo"}
                        </Button>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}

              {registeredClients.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={modules.length + 2}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    Nenhum cliente cadastrado até agora.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
