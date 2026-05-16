"use client";

import { Check, Copy, ExternalLink, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { CampaignEditorDrawer } from "@/components/admin/campaign-editor-drawer";
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
import { createAcquisitionCampaignDraft } from "@/lib/data/admin-data-source";
import type { AcquisitionCampaign } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function conversionRate(leads: number, visits: number) {
  if (visits === 0) return "0%";

  return `${((leads / visits) * 100).toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  })}%`;
}

export function AdminCampaignsWorkspace() {
  const { campaigns, leads, modules } = useAdminData();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] =
    useState<AcquisitionCampaign | null>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("edit");

  const campaignLeadCounts = useMemo(() => {
    return campaigns.reduce<Record<string, number>>((acc, campaign) => {
      acc[campaign.id] = leads.filter(
        (lead) => lead.campaignId === campaign.id,
      ).length;
      return acc;
    }, {});
  }, [campaigns, leads]);

  const activeCampaigns = campaigns.filter(
    (campaign) => campaign.status === "ativo",
  ).length;
  const totalVisits = campaigns.reduce(
    (total, campaign) => total + campaign.visits,
    0,
  );

  async function handleCopy(campaign: AcquisitionCampaign) {
    const origin = window.location.origin;
    const url = `${origin}${campaign.publicPath}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(campaign.token);
    window.setTimeout(() => setCopiedToken(null), 1800);
  }

  function openCreateCampaign() {
    const [module] = modules;

    if (!module) return;

    setDrawerMode("create");
    setSelectedCampaign(createAcquisitionCampaignDraft(module));
  }

  function openEditCampaign(campaign: AcquisitionCampaign) {
    setDrawerMode("edit");
    setSelectedCampaign(campaign);
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Campanhas"
          value={campaigns.length.toLocaleString("pt-BR")}
          caption={`${activeCampaigns} ativas`}
          hint="Links de aquisição configurados"
        />
        <KpiCard
          label="Visitas mockadas"
          value={totalVisits.toLocaleString("pt-BR")}
          caption="Entrada por campanha"
          hint="Base seed nesta fase"
        />
        <KpiCard
          label="Leads capturados"
          value={leads.length.toLocaleString("pt-BR")}
          caption="Seeds e envios locais"
          hint="Persistidos no navegador"
        />
        <KpiCard
          label="Conversão média"
          value={conversionRate(leads.length, totalVisits)}
          caption="Leads sobre visitas"
          hint="Indicador operacional"
        />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-foreground text-base font-semibold">
              Campanhas de aquisição
            </h2>
            <p className="text-muted-foreground text-sm">
              Cada campanha tem um link público e um formulário próprio.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/admin/leads" />}
            >
              Ver leads
            </Button>
            <Button
              size="sm"
              disabled={modules.length === 0}
              onClick={openCreateCampaign}
            >
              <Plus className="size-4" />
              Criar campanha
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Link de aquisição</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Conversão</TableHead>
                <TableHead className="text-right">Campos</TableHead>
                <TableHead className="w-[112px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const leadsCount = campaignLeadCounts[campaign.id] ?? 0;
                const copied = copiedToken === campaign.token;

                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {campaign.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          Atualizada em {formatDate(campaign.updatedAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminStatusBadge status={campaign.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {campaign.source}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 max-w-[18rem] items-center gap-2">
                        <code className="min-w-0 truncate rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                          {campaign.publicPath}
                        </code>
                        <Button
                          variant="outline"
                          size="icon-xs"
                          aria-label="Copiar link"
                          onClick={() => handleCopy(campaign)}
                        >
                          {copied ? (
                            <Check className="size-3" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {leadsCount}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {conversionRate(leadsCount, campaign.visits)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {campaign.fields.length}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Abrir link público"
                          nativeButton={false}
                          render={<Link href={campaign.publicPath} />}
                        >
                          <ExternalLink className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Configurar campanha"
                          onClick={() => openEditCampaign(campaign)}
                        >
                          <Settings className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      <CampaignEditorDrawer
        key={`${drawerMode}-${selectedCampaign?.id ?? "empty-campaign"}`}
        campaign={selectedCampaign}
        mode={drawerMode}
        modules={modules}
        open={Boolean(selectedCampaign)}
        onOpenChange={(open) => {
          if (!open) setSelectedCampaign(null);
        }}
      />
    </div>
  );
}
