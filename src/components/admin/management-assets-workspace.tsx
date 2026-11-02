"use client";

import { useAppRuntime } from "@/components/app-runtime";

import { MessageSquareText, Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

import { ManagementAssetCreateForm } from "@/components/admin/management-asset-create-form";
import { ManagementAssetStatusBadge, managementAssetStatusLabels } from "@/components/admin/management-asset-status-badge";
import { ManagementAssetsBulkEditDialog } from "@/components/admin/management-assets-bulk-edit-dialog";
import { AppPage } from "@/components/app-page";
import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { AppTopbar } from "@/components/app-topbar";
import { AdminCompanyTabs } from "@/components/admin/admin-company-tabs";
import { AssetCheckbox } from "@/components/management-assets/asset-checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  type QuickCreateManagementAssetInput,
  type ManagementAssetBulkUpdate,
} from "@/lib/contracts";

type Filter = "todos" | "rascunho" | "publicado" | "arquivado";
type Option = { id: string; name: string };

const filters: Array<{ value: Filter; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "rascunho", label: "Rascunho" },
  { value: "publicado", label: "Publicado" },
  { value: "arquivado", label: "Arquivado" },
];

// Rascunho inclui uma nova versão ainda não publicada de um ativo publicado.
function matchesFilter(asset: AdminManagementAssetListItem, filter: Filter) {
  if (filter === "todos") return true;
  if (filter === "publicado" || filter === "arquivado") return asset.status === filter;
  if (asset.status === "arquivado") return false;
  return asset.draftStatus !== null;
}

export function ManagementAssetsWorkspace({
  assets,
  embedded = false,
  listOnly = false,
  deliveryId,
  company,
  specialists,
  categories,
  fileWorkspace,
}: {
  assets: AdminManagementAssetListItem[];
  embedded?: boolean;
  listOnly?: boolean;
  deliveryId?: string;
  company: Option & { organizationId: string };
  specialists: Option[];
  categories: string[];
  fileWorkspace?: ReactNode;
}) {
  const runtime = useAppRuntime();
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
  const selectedAssets = assets.filter((asset) => selectedIds.includes(asset.id));
  const currentSelection = selectedAssets.map((asset) => asset.id);
  const selectableVisibleAssets = visibleAssets.slice(0, 200);
  const allVisibleSelected = selectableVisibleAssets.length > 0 && selectableVisibleAssets.every((asset) => selectedIds.includes(asset.id));
  const someVisibleSelected = visibleAssets.some((asset) => selectedIds.includes(asset.id));

  async function handleEdit(asset: AdminManagementAssetListItem) {
    try {
      setPending(true);
      setEditingId(asset.id);
      setActionError(null);
      if (!asset.draftStatus) {
        const response = await runtime.request(`/api/admin/management-assets/${asset.id}/transition`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "abrir_rascunho" }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message ?? "Não foi possível abrir a edição.");
      }
      router.push(runtime.href(assetHref(asset.id)));
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Não foi possível abrir a edição.");
    } finally { setPending(false); setEditingId(null); }
  }

  async function mutateSelection(ids: string[], changes?: ManagementAssetBulkUpdate["changes"]) {
    setPending(true);
    setActionError(null);
    try {
      const response = await runtime.request("/api/admin/management-assets/bulk", {
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
  async function handleCreate(input: QuickCreateManagementAssetInput) {
    try {
      setPending(true);
      setNotice(null);
      setActionError(null);
      const response = await runtime.request("/api/admin/management-assets", {
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

      router.push(runtime.href(assetHref(data.assetId)));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Não foi possível criar o ativo.");
      setPending(false);
    }
  }

  const PageContent = embedded ? "div" : AppPage;
  const Heading = "h2";
  const actions = (
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Tabs value={filter} onValueChange={(value) => { setFilter(value as Filter); setSelectedIds([]); }}>
              <TabsList variant="selector">
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
              render={<Link href={runtime.href(deliveryId ? `/admin/entregas/${deliveryId}/ativos/perguntas` : `${basePath}/perguntas`)} />}
            >
              <MessageSquareText className="size-4" />
              Perguntas
            </Button>
            <Button
              variant="outline"
              onClick={() => { setActionError(null); setOpen(true); }}
              disabled={pending}
            >
              <Plus className="size-4" />
              Novo ativo
            </Button>
          </div>
  );

  return (
    <>
      {embedded ? (!listOnly ? <AppTopbarActionsPortal>{actions}</AppTopbarActionsPortal> : null) : (
      <AppTopbar
        breadcrumb={[
          { label: "Empresas", href: "/admin/empresas" },
          { label: company.name },
        ]}
      />
      )}

      <PageContent>
        <div className="flex w-full flex-col gap-5">
          {!embedded ? (
            <>
              <div className="space-y-1">
                <h1 className="text-ui-page">{company.name}</h1>
                <p className="text-sm text-muted-foreground">Área de gestão desta empresa.</p>
              </div>
              <AdminCompanyTabs companyId={company.id} active="assets" hasOrganization />
            </>
          ) : null}
          {fileWorkspace}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <Heading className="font-heading text-2xl font-bold">Editor de ativos</Heading>
              <p className="text-sm text-muted-foreground">
                {listOnly ? "Consulte os documentos exclusivos desta empresa." : "Crie e acompanhe documentos exclusivos desta empresa."}
              </p>
            </div>
          </div>
          {!embedded && !listOnly ? actions : null}

          {notice ? (
            <p role="status" className="rounded-lg bg-card px-3 py-2 text-sm text-foreground">
              {notice}
            </p>
          ) : null}
          {actionError && !bulkEditOpen && deleteIds.length === 0 ? <p role="alert" className="text-sm text-destructive">{actionError}</p> : null}
          {visibleAssets.length > 200 ? <p className="text-xs text-muted-foreground">Selecione até 200 ativos por operação. A seleção geral inclui os primeiros 200 deste filtro.</p> : null}
          {!listOnly && selectedAssets.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3" role="region" aria-label="Ações dos ativos selecionados">
              <p className="text-sm tabular-nums">{selectedAssets.length} {selectedAssets.length === 1 ? "ativo selecionado" : "ativos selecionados"}</p>
              <Button variant="secondary" disabled={pending || selectedAssets.some((asset) => asset.status === "arquivado")} onClick={() => { setActionError(null); setBulkEditOpen(true); }}><Pencil className="size-4" />Editar em massa</Button>
              <Button variant="secondary" disabled={pending} onClick={() => { setActionError(null); setDeleteIds(currentSelection); }}><Trash2 className="size-4" />Excluir selecionados</Button>
              <Button variant="ghost" disabled={pending} onClick={() => setSelectedIds([])}>Limpar seleção</Button>
              {selectedAssets.some((asset) => asset.status === "arquivado") ? <p className="text-xs text-muted-foreground">Restaure os ativos arquivados para editar em massa.</p> : null}
            </div>
          ) : null}

          {visibleAssets.length === 0 ? (
            <div className="rounded-lg bg-card px-6 py-12 text-center">
              <p className="font-heading text-base font-medium">
                {assets.length === 0 ? "Nenhum ativo criado" : "Nenhum ativo neste filtro"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {assets.length === 0
                  ? "Crie o primeiro ativo desta empresa a partir de um modelo ou do zero."
                  : "Ajuste o status selecionado."}
              </p>
            </div>
          ) : (
            <div className="-ml-8 min-w-0 w-[calc(100%+2rem)]">
              <Table variant="operational" className="min-w-[760px] table-fixed">
                <TableHeader>
                  <TableRow className="group/selection">
                    {!listOnly ? <TableHead className="w-8 min-w-8 rounded-none! bg-transparent! px-0!">
                      <div className="flex items-center justify-center">
                        <AssetCheckbox
                          label={visibleAssets.length > 200 ? "Selecionar até 200 ativos deste filtro" : "Selecionar todos os ativos visíveis"}
                          checked={allVisibleSelected}
                          mixed={someVisibleSelected && !allVisibleSelected}
                          disabled={pending || visibleAssets.length === 0}
                          onChange={() => setSelectedIds(allVisibleSelected ? [] : selectableVisibleAssets.map((asset) => asset.id))}
                        />
                      </div>
                    </TableHead> : null}
                    <TableHead className="rounded-l-[5px]!">Ativo</TableHead>
                    <TableHead className="w-40">Tipo</TableHead>
                    <TableHead className="w-48">Situação</TableHead>
                    <TableHead className="w-36 text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleAssets.map((asset) => (
                    <TableRow key={asset.id} className="group/selection">
                      {!listOnly ? <TableCell className="border-b-0! px-0!">
                        <div className="flex items-center justify-center">
                          <AssetCheckbox
                            label={`Selecionar ${asset.title}`}
                            checked={selectedIds.includes(asset.id)}
                            disabled={pending || (!selectedIds.includes(asset.id) && selectedAssets.length >= 200)}
                            onChange={() => setSelectedIds((current) => current.includes(asset.id) ? current.filter((id) => id !== asset.id) : [...current, asset.id])}
                          />
                        </div>
                      </TableCell> : null}
                      <TableCell className="whitespace-normal">
                        <span className="font-medium text-foreground">{asset.title}</span>
                        {asset.category ? <span className="block text-xs text-muted-foreground">{asset.category}</span> : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{managementAssetTypeLabels[asset.type]}</TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <ManagementAssetStatusBadge status={asset.status} />
                          {asset.draftStatus ? (
                            <span className="text-xs text-muted-foreground">Em edição: {managementAssetStatusLabels[asset.draftStatus]}</span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Link href={runtime.href(assetHref(asset.id))} aria-label={`Abrir ${asset.title}`} className="rounded-sm px-2 text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            Abrir →
                          </Link>
                          {!listOnly ? <><Button variant="ghost" size="icon-sm" aria-label={`Editar ${asset.title}`} disabled={pending || asset.status === "arquivado"} onClick={() => handleEdit(asset)}><Pencil aria-hidden="true" className="size-4" /></Button>
                          <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${asset.title}`} disabled={pending} onClick={() => { setActionError(null); setDeleteIds([asset.id]); }}><Trash2 aria-hidden="true" className="size-4" /></Button></> : null}
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
      {!listOnly && bulkEditOpen ? <ManagementAssetsBulkEditDialog organizationId={company.organizationId} assetIds={currentSelection} specialists={specialists} pending={pending} error={actionError}
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

      <Dialog open={open} onOpenChange={(value) => { if (!pending) setOpen(value); }}>
        <DialogContent className="max-w-xl">
          <DialogClose disabled={pending} aria-label="Fechar" className="absolute right-4 top-4 cursor-pointer rounded-md p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
            <X className="size-4" />
          </DialogClose>
          <DialogHeader>
            <DialogTitle>Categoria e tipo</DialogTitle>
            <DialogDescription>Escolha os dois e abra o editor direto para {company.name}.</DialogDescription>
          </DialogHeader>
          {open ? (
            <ManagementAssetCreateForm
              organizationId={company.organizationId}
              categories={categories}
              pending={pending}
              onSubmit={handleCreate}
            />
          ) : null}
          {actionError ? <p role="alert" className="text-sm text-destructive">{actionError}</p> : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
