"use client";

import { MessageSquareText, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  ManagementAssetCreateForm,
  type ManagementAssetTemplateOption,
} from "@/components/admin/management-asset-create-form";
import { ManagementAssetStatusBadge } from "@/components/admin/management-asset-status-badge";
import { ManagementAssetsBulkEditDialog } from "@/components/admin/management-assets-bulk-edit-dialog";
import { AppPage } from "@/components/app-page";
import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  managementAssetTypeLabels,
  type AdminManagementAssetListItem,
  type CreateManagementAssetInput,
  type ManagementAssetBulkUpdate,
} from "@/lib/contracts";

type Filter = "todos" | "rascunho" | "em_revisao" | "publicado" | "arquivado";
type Option = { id: string; name: string };

const filters: Array<{ value: Filter; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "rascunho", label: "Rascunho" },
  { value: "em_revisao", label: "Em revisão" },
  { value: "publicado", label: "Publicado" },
  { value: "arquivado", label: "Arquivado" },
];

// Rascunho e Em revisão olham para a versão em andamento, inclusive a nova
// versão de um ativo já publicado; o mesmo ativo pode aparecer em Publicado.
function matchesFilter(asset: AdminManagementAssetListItem, filter: Filter) {
  if (filter === "todos") return true;
  if (filter === "publicado" || filter === "arquivado") return asset.status === filter;
  if (asset.status === "arquivado") return false;
  if (filter === "em_revisao") {
    return asset.draftStatus === "em_revisao" || asset.draftStatus === "pronto_para_publicar";
  }

  return asset.draftStatus === "rascunho";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ManagementAssetsWorkspace({
  assets,
  embedded = false,
  deliveryId,
  company,
  specialists,
  templates,
}: {
  assets: AdminManagementAssetListItem[];
  embedded?: boolean;
  deliveryId?: string;
  company: Option & { organizationId: string };
  specialists: Option[];
  templates: ManagementAssetTemplateOption[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("todos");
  const assetHref = (assetId: string) => deliveryId
    ? `/admin/entregas/${deliveryId}/ativos/${encodeURIComponent(assetId)}`
    : `${basePath}/${assetId}`;
  const basePath = `/admin/empresas/${company.id}/criacao-dos-ativos`;
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        filters.map((item) => [
          item.value,
          assets.filter((asset) => matchesFilter(asset, item.value)).length,
        ]),
      ) as Record<Filter, number>,
    [assets],
  );
  const visibleAssets = assets.filter((asset) => matchesFilter(asset, filter));
  const specialistNames = new Map(specialists.map((item) => [item.id, item.name]));
  const selectedAssets = assets.filter((asset) => selectedIds.includes(asset.id));
  const currentSelection = selectedAssets.map((asset) => asset.id);
  const allVisibleSelected = visibleAssets.length > 0 && visibleAssets.every((asset) => selectedIds.includes(asset.id));
  const someVisibleSelected = visibleAssets.some((asset) => selectedIds.includes(asset.id));

  async function handleEdit(asset: AdminManagementAssetListItem) {
    try {
      setPending(true);
      setEditingId(asset.id);
      setActionError(null);
      if (!asset.draftStatus) {
        const response = await fetch(`/api/admin/management-assets/${asset.id}/transition`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "abrir_rascunho" }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message ?? "Não foi possível abrir a edição.");
      }
      router.push(assetHref(asset.id));
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Não foi possível abrir a edição.");
    } finally { setPending(false); setEditingId(null); }
  }

  async function mutateSelection(ids: string[], changes?: ManagementAssetBulkUpdate["changes"]) {
    setPending(true);
    setActionError(null);
    try {
      const response = await fetch("/api/admin/management-assets/bulk", {
        method: changes ? "PATCH" : "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: company.organizationId, assetIds: ids, ...(changes ? { changes } : {}) }),
      });
      const data = await response.json().catch(() => ({})) as { ids?: string[]; message?: string };
      if (!response.ok || !data.ids) throw new Error(data.message ?? "Não foi possível concluir a ação.");
      const affected = data.ids;
      setSelectedIds((current) => current.filter((id) => !affected.includes(id)));
      setBulkEditOpen(false);
      setDeleteIds([]);
      const result = changes ? (affected.length === 1 ? "atualizado" : "atualizados") : (affected.length === 1 ? "excluído" : "excluídos");
      setNotice(`${affected.length} ${affected.length === 1 ? "ativo" : "ativos"} ${result}.${affected.length !== ids.length ? " Alguns ativos ficaram indisponíveis durante a operação. Confira a lista." : ""}`);
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Não foi possível concluir a ação.");
      router.refresh();
    } finally { setPending(false); }
  }
  async function handleCreate(input: CreateManagementAssetInput) {
    try {
      setPending(true);
      setNotice(null);
      const response = await fetch("/api/admin/management-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, organizationId: company.organizationId }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        assetId?: string;
        message?: string;
      };

      if (!response.ok || !data.assetId) {
        throw new Error(data.message ?? "Não foi possível criar o ativo.");
      }

      router.push(assetHref(data.assetId));
    } catch (error) {
      setOpen(false);
      setNotice(error instanceof Error ? error.message : "Não foi possível criar o ativo.");
      setPending(false);
    }
  }

  const PageContent = embedded ? "div" : AppPage;
  const Heading = embedded ? "h2" : "h1";
  const actions = (
          <div className="flex min-w-0 items-center gap-2">
            <Tabs value={filter} onValueChange={(value) => { setFilter(value as Filter); setSelectedIds([]); }}>
              <TabsList>
                {filters.map((item) => (
                  <TabsTrigger key={item.value} value={item.value} className="gap-2" disabled={pending}>
                    {item.label}
                    <span className="rounded-full border bg-background px-1.5 text-xs font-medium tabular-nums text-muted-foreground">
                      {counts[item.value]}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={deliveryId ? `/admin/entregas/${deliveryId}/ativos/perguntas` : `${basePath}/perguntas`} />}
            >
              <MessageSquareText className="size-4" />
              Perguntas
            </Button>
            <Button
              onClick={() => setOpen(true)}
              disabled={pending}
            >
              <Plus className="size-4" />
              Criar ativo
            </Button>
          </div>
  );

  return (
    <>
      {embedded ? <AppTopbarActionsPortal>{actions}</AppTopbarActionsPortal> : (
      <AppTopbar
        breadcrumb={[
          { label: "Empresas", href: "/admin/empresas" },
          { label: company.name, href: `/admin/empresas/${company.id}` },
          { label: "Criação dos ativos" },
        ]}
        actions={actions}
      />
      )}

      <PageContent>
        <div className="flex w-full flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <Heading className="font-heading text-2xl font-semibold">Criação dos ativos</Heading>
              <p className="text-sm text-muted-foreground">
                SOPs, playbooks e governança de {company.name}.
              </p>
            </div>

          </div>

          {notice ? (
            <p role="status" className="rounded-lg border bg-card px-3 py-2 text-sm text-foreground">
              {notice}
            </p>
          ) : null}
          {actionError && !bulkEditOpen && deleteIds.length === 0 ? <p role="alert" className="text-sm text-destructive">{actionError}</p> : null}
          {visibleAssets.length > 200 ? <p className="text-xs text-muted-foreground">Selecione até 200 ativos por operação. A seleção geral inclui os primeiros 200 deste filtro.</p> : null}
          {selectedAssets.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3" role="region" aria-label="Ações dos ativos selecionados">
              <p className="text-sm tabular-nums">{selectedAssets.length} {selectedAssets.length === 1 ? "ativo selecionado" : "ativos selecionados"}</p>
              <Button variant="secondary" disabled={pending || selectedAssets.some((asset) => asset.status === "arquivado")} onClick={() => { setActionError(null); setBulkEditOpen(true); }}><Pencil className="size-4" />Editar em massa</Button>
              <Button variant="secondary" disabled={pending} onClick={() => { setActionError(null); setDeleteIds(currentSelection); }}><Trash2 className="size-4" />Excluir selecionados</Button>
              <Button variant="ghost" disabled={pending} onClick={() => setSelectedIds([])}>Limpar seleção</Button>
              {selectedAssets.some((asset) => asset.status === "arquivado") ? <p className="text-xs text-muted-foreground">Restaure os ativos arquivados para editar em massa.</p> : null}
            </div>
          ) : null}

          {visibleAssets.length === 0 ? (
            <div className="rounded-lg border border-dashed px-6 py-12 text-center">
              <p className="font-heading text-base font-medium">
                {assets.length === 0 ? "Nenhum ativo criado" : "Nenhum ativo neste filtro"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {assets.length === 0
                  ? "Crie o primeiro ativo para uma empresa a partir de um modelo ou do zero."
                  : "Ajuste o status selecionado."}
              </p>
            </div>
          ) : (
            <div className="min-w-0">
              <Table variant="operational" className="min-w-[1200px] table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input type="checkbox" aria-label="Selecionar todos os ativos visíveis" checked={allVisibleSelected} disabled={pending || visibleAssets.length === 0}
                        ref={(node) => { if (node) node.indeterminate = someVisibleSelected && !allVisibleSelected; }}
                        className="size-4 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onChange={(event) => setSelectedIds(event.target.checked ? visibleAssets.slice(0, 200).map((asset) => asset.id) : [])} />
                    </TableHead>
                    <TableHead className="h-11 w-[300px] px-4">Ativo</TableHead>
                    <TableHead className="h-11 w-[200px] px-4">Empresa</TableHead>
                    <TableHead className="h-11 w-[150px] px-4">Status</TableHead>
                    <TableHead className="h-11 w-[100px] px-4 text-right">Versão</TableHead>
                    <TableHead className="h-11 w-[170px] px-4">Próxima versão</TableHead>
                    <TableHead className="h-11 w-[160px] px-4">Autor</TableHead>
                    <TableHead className="h-11 w-[130px] px-4">Atualizado</TableHead>
                    <TableHead className="w-24"><span className="sr-only">Ações</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleAssets.map((asset) => (
                    <TableRow
                      key={asset.id}
                      className="cursor-pointer"
                      onClick={() => { if (!pending) router.push(assetHref(asset.id)); }}
                    >
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <input type="checkbox" aria-label={`Selecionar ${asset.title}`} checked={selectedIds.includes(asset.id)} disabled={pending || (!selectedIds.includes(asset.id) && selectedAssets.length >= 200)}
                          className="size-4 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, asset.id] : current.filter((id) => id !== asset.id))} />
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-normal">
                        <div className="flex flex-col">
                          <Link
                            href={assetHref(asset.id)}
                            className="rounded-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={(event) => { event.stopPropagation(); if (pending) event.preventDefault(); }}
                          >
                            {asset.title}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {managementAssetTypeLabels[asset.type]}
                            {asset.category ? ` · ${asset.category}` : ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="truncate px-4 py-4 text-sm">
                        {asset.organizationName}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <ManagementAssetStatusBadge status={asset.status} />
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right tabular-nums">
                        {asset.publishedVersionNumber ? (
                          <span className="text-foreground">v{asset.publishedVersionNumber}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        {asset.publishedVersionNumber && asset.draftStatus ? (
                          <ManagementAssetStatusBadge status={asset.draftStatus} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="truncate px-4 py-4 text-sm text-muted-foreground">
                        {(asset.specialistId && specialistNames.get(asset.specialistId)) ??
                          "Directscal"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-muted-foreground tabular-nums">
                        {formatDate(asset.updatedAt)}
                      </TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" aria-label={`Editar ${asset.title}`} disabled={pending || asset.status === "arquivado"} onClick={() => handleEdit(asset)}><Pencil aria-hidden="true" className="size-4" /></Button>
                          <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${asset.title}`} disabled={pending} onClick={() => { setActionError(null); setDeleteIds([asset.id]); }}><Trash2 aria-hidden="true" className="size-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </PageContent>

      {editingId ? <p role="status" className="sr-only">Preparando a edição do ativo</p> : null}
      {bulkEditOpen ? <ManagementAssetsBulkEditDialog organizationId={company.organizationId} assetIds={currentSelection} specialists={specialists} pending={pending} error={actionError}
        onClose={() => { setBulkEditOpen(false); setActionError(null); }} onSave={(input) => mutateSelection(input.assetIds, input.changes)} /> : null}
      <Dialog open={deleteIds.length > 0} onOpenChange={(next) => { if (!next && !pending) { setDeleteIds([]); setActionError(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {deleteIds.length === 1 ? "ativo" : `${deleteIds.length} ativos`}</DialogTitle>
            <DialogDescription>Esta ação é permanente. Os ativos, suas versões e seus índices serão removidos da biblioteca e das consultas do agente.</DialogDescription>
          </DialogHeader>
          <ul className="max-h-40 overflow-y-auto text-sm text-muted-foreground">{assets.filter((asset) => deleteIds.includes(asset.id)).map((asset) => <li key={asset.id}>{asset.title}</li>)}</ul>
          {actionError ? <p role="alert" className="text-sm text-destructive">{actionError}</p> : null}
          <DialogFooter>
            <Button variant="secondary" disabled={pending} onClick={() => { setDeleteIds([]); setActionError(null); }}>Cancelar</Button>
            <Button variant="destructive" disabled={pending} onClick={() => mutateSelection(deleteIds)}>{pending ? "Excluindo" : "Excluir definitivamente"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={open} onOpenChange={(value) => !pending && setOpen(value)}>
        <SheetContent className="gap-0 overflow-hidden bg-card text-card-foreground data-[side=right]:!w-[min(100vw,56rem)] data-[side=right]:!max-w-none">
          <SheetHeader className="shrink-0 border-b px-4 py-4 sm:px-6">
            <SheetTitle>Criar ativo</SheetTitle>
            <SheetDescription>
              Registre o ativo para a empresa e abra o editor com o ponto de partida escolhido.
            </SheetDescription>
          </SheetHeader>
          {open ? (
            <ManagementAssetCreateForm
              organizations={[{ id: company.organizationId, name: company.name }]}
              initialOrganizationId={company.organizationId}
              organizationLocked
              specialists={specialists}
              templates={templates}
              pending={pending}
              onCancel={() => setOpen(false)}
              onSubmit={handleCreate}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
