"use client";

import { ChevronRight, LayoutGrid, Search, Table2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppRuntime } from "@/components/app-runtime";
import { Button } from "@/components/ui/button";
import type { ManagementAssetCategoryFolder } from "@/lib/data/management-asset-categories";
import { useMemo, useState } from "react";

import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { managementAssetTypeLabels } from "@/lib/contracts/management-assets";
import { getManagementAssetHref } from "@/lib/data/management-asset-routes";
import type { ManagementAsset } from "@/lib/types";

const allCategories = "Todas as categorias";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function authorInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getAssetHref(asset: ManagementAsset) {
  return getManagementAssetHref(asset.type, asset.id);
}

function ManagementAssetCard({ asset, showType }: { asset: ManagementAsset; showType: boolean }) {
  const runtime = useAppRuntime();
  const href = runtime.href(getAssetHref(asset) ?? "");
  const card = (
    <Card
      className={
        href
          ? "h-full min-h-[277px] rounded-[5px] bg-card ring-0 transition-colors duration-150 group-hover:bg-muted/50 group-active:bg-muted"
          : "h-full min-h-[277px] rounded-[5px] bg-card ring-0"
      }
    >
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          {showType || asset.category ? (
            <Badge className="h-5 rounded-[5px] px-2 text-xs leading-4" variant="outline">
              {showType ? managementAssetTypeLabels[asset.type] : asset.category}
            </Badge>
          ) : (
            <span />
          )}
          {href ? (
            <ChevronRight
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground"
            />
          ) : null}
        </div>
        <CardTitle className="line-clamp-2 text-lg leading-7">
          {asset.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-6">
        <p className="line-clamp-3 text-sm leading-5 text-muted-foreground">
          {asset.summary}
        </p>

        <div className="space-y-3 border-t pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar size="sm">
              {asset.author.avatarUrl ? (
                <AvatarImage src={asset.author.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback>
                {authorInitials(asset.author.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">
                {asset.author.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {asset.author.role}
              </p>
            </div>
          </div>

          <p className="text-sm leading-5 text-muted-foreground">
            <time
              dateTime={asset.updatedAt}
              aria-label={`Atualizado em ${dateFormatter.format(new Date(asset.updatedAt))}`}
              className="tabular-nums"
            >
              {dateFormatter.format(new Date(asset.updatedAt))}
            </time>
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return href ? (
    <Link
      href={href}
      className="group block h-full rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      aria-label={`Abrir ${managementAssetTypeLabels[asset.type]} ${asset.title}`}
    >
      {card}
    </Link>
  ) : (
    card
  );
}

function AssetCheckbox({ label, checked, mixed = false, disabled, onChange }: {
  label: string; checked: boolean; mixed?: boolean; disabled?: boolean; onChange: () => void;
}) {
  return <input type="checkbox" aria-label={label} aria-checked={mixed ? "mixed" : checked}
    checked={checked} disabled={disabled} onChange={onChange}
    ref={node => { if (node) node.indeterminate = mixed; }}
    className="size-4 shrink-0 cursor-pointer opacity-0 transition-opacity group-hover/selection:opacity-100 group-focus-within/selection:opacity-100 checked:opacity-100 aria-[checked=mixed]:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100 accent-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-50" />;
}

function ManagementAssetsTable({ assets, canEdit, selected, saving, toggle, toggleAll }: {
  assets: ManagementAsset[]; canEdit: boolean; selected: Set<string>; saving: boolean;
  toggle: (id: string) => void; toggleAll: () => void;
}) {
  const runtime = useAppRuntime();
  return (
    <div className={cn(canEdit && "-ml-8 w-[calc(100%+2rem)]")}>
    <Table variant="operational" aria-label="Ativos de gestão" className="min-w-[720px]">
      <TableHeader>
        <TableRow className="group/selection">
          {canEdit ? <TableHead scope="col" className="w-8 min-w-8 rounded-none! bg-transparent! px-0!">
            <div className="flex items-center justify-center">
            <AssetCheckbox label="Selecionar todos os resultados" checked={assets.every(asset => selected.has(asset.id))}
              mixed={assets.some(asset => selected.has(asset.id)) && !assets.every(asset => selected.has(asset.id))}
              disabled={saving} onChange={toggleAll} />
            </div>
          </TableHead> : null}
          <TableHead scope="col" className={cn(canEdit && "rounded-l-[5px]!")}>Ativo</TableHead>
          <TableHead scope="col">Tipo</TableHead>
          <TableHead scope="col">Autoria</TableHead>
          <TableHead scope="col">Atualizado em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset) => {
          const href = runtime.href(getAssetHref(asset) ?? "");
          return (
            <TableRow key={asset.id} className="group/selection">
              {canEdit ? <TableCell className="border-b-0! px-0!"><div className="flex items-center justify-center"><AssetCheckbox label={`Selecionar ${asset.title}`} checked={selected.has(asset.id)} disabled={saving} onChange={() => toggle(asset.id)} /></div></TableCell> : null}
              <TableCell className="w-1/2 min-w-64 whitespace-normal">
                {href ? (
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-2 rounded-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Abrir ${managementAssetTypeLabels[asset.type]} ${asset.title}`}
                  >
                    {asset.title}
                    <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  </Link>
                ) : <span className="font-medium">{asset.title}</span>}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{managementAssetTypeLabels[asset.type]}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    {asset.author.avatarUrl ? <AvatarImage src={asset.author.avatarUrl} alt="" /> : null}
                    <AvatarFallback>{authorInitials(asset.author.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{asset.author.name}</p>
                    <p className="text-xs text-muted-foreground">{asset.author.role}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                <time dateTime={asset.updatedAt}>{dateFormatter.format(new Date(asset.updatedAt))}</time>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
    </div>
  );
}

export function ManagementAssetsLibrary({
  assets,
  categoryFilter,
  showType = false,
  folders = [],
  canEdit = false,
}: {
  assets: ManagementAsset[];
  categoryFilter: boolean;
  showType?: boolean;
  folders?: ManagementAssetCategoryFolder[];
  canEdit?: boolean;
}) {
  const router = useRouter();
  const runtime = useAppRuntime();
  const [view, setView] = useState("cards");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetType, setTargetType] = useState("keep");
  const [targetCategory, setTargetCategory] = useState("keep");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(allCategories);
  const categories = useMemo(
    () => [
      allCategories,
      ...Array.from(
        new Set(
          assets.flatMap((asset) =>
            asset.category === null ? [] : [asset.category],
          ),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    ],
    [assets],
  );
  const categoryItems = useMemo(
    () => categories.map((item) => ({ label: item, value: item })),
    [categories],
  );
  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

    return assets.filter((asset) => {
      const matchesCategory =
        !categoryFilter ||
        category === allCategories ||
        asset.category === category;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${asset.title} ${asset.summary} ${asset.category ?? ""}`
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [assets, category, categoryFilter, query]);

  const selected = new Set(assets.filter(asset => selectedIds.has(asset.id)).map(asset => asset.id));
  const allSelected = filteredAssets.length > 0 && filteredAssets.every(asset => selected.has(asset.id));
  function clearSelection() {
    setSelectedIds(new Set()); setTargetType("keep"); setTargetCategory("keep"); setError("");
  }
  function toggle(id: string) {
    setSelectedIds(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setMessage("");
  }
  function toggleAll() {
    setSelectedIds(previous => {
      const next = new Set(previous);
      for (const asset of filteredAssets) { if (allSelected) next.delete(asset.id); else next.add(asset.id); }
      return next;
    });
    setMessage("");
  }
  async function applyChanges() {
    if (saving || selected.size === 0) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await runtime.request("/api/management-assets/bulk", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetIds: [...selected], changes: {
          ...(targetType !== "keep" ? { type: targetType } : {}),
          ...(targetCategory !== "keep" ? { categoryKey: targetCategory } : {}),
        } }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Não foi possível alterar os ativos.");
      setMessage(`${selected.size} ${selected.size === 1 ? "ativo atualizado" : "ativos atualizados"}.`);
      setSelectedIds(new Set()); setTargetType("keep"); setTargetCategory("keep");
      const destination = folders.find(folder => folder.key === targetCategory);
      if (destination) router.replace(runtime.href(destination.href));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível alterar os ativos.");
    } finally { setSaving(false); }
  }
  const typeItems = [{ value: "keep", label: "Manter tipo" }, ...Object.entries(managementAssetTypeLabels).map(([value, label]) => ({ value, label }))];
  const folderItems = [{ value: "keep", label: "Manter categoria" }, ...folders.map(folder => ({ value: folder.key, label: folder.title }))];

  if (assets.length === 0) {
    return (
      <div className="rounded-lg bg-card px-6 py-12 text-center">
        <p className="font-heading text-base font-medium">
          Nenhum ativo disponível
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Os conteúdos aparecem aqui depois que forem publicados pela Directscal.
        </p>
      </div>
    );
  }

  return (
    <Tabs value={view} onValueChange={value => { if (!saving && typeof value === "string") { setView(value); clearSelection(); } }} className="relative gap-6">
      <AppTopbarActionsPortal>
        <div className="flex min-w-0 items-center gap-3">
        <TabsList className="shrink-0" variant="selector" aria-label="Visualização dos ativos">
          <TabsTrigger value="cards" disabled={saving}><LayoutGrid aria-hidden="true" />Quadro</TabsTrigger>
          <TabsTrigger value="table" disabled={saving}><Table2 aria-hidden="true" />Tabela</TabsTrigger>
        </TabsList>
          {categoryFilter ? (
            <Select
              value={category}
              disabled={saving}
              items={categoryItems}
              onValueChange={(value) => {
                if (typeof value === "string") {
                  setCategory(value);
                  clearSelection();
                }
              }}
            >
              <SelectTrigger
                aria-label="Filtrar por categoria"
                className="w-44 xl:w-56"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          <div className="relative min-w-24 w-56 xl:w-96">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              disabled={saving}
              onChange={(event) => { setQuery(event.currentTarget.value); clearSelection(); }}
              placeholder="Buscar por título ou conteúdo"
              aria-label="Buscar ativos"
              className="pl-8"
            />
          </div>
        </div>
      </AppTopbarActionsPortal>


      {canEdit && view === "table" && selected.size > 0 ? <div role="region" className="flex max-w-full flex-wrap items-center gap-2 rounded-lg border bg-popover p-2 text-popover-foreground shadow-md" aria-label="Alterar ativos selecionados" aria-busy={saving}>
        <span className="text-sm tabular-nums">{selected.size} {selected.size === 1 ? "selecionado" : "selecionados"}</span>
        <Select value={targetType} items={typeItems} disabled={saving} onValueChange={value => { if (value) setTargetType(value); }}>
          <SelectTrigger aria-label="Novo tipo" className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>{typeItems.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={targetCategory} items={folderItems} disabled={saving} onValueChange={value => { if (value) setTargetCategory(value); }}>
          <SelectTrigger aria-label="Nova categoria" className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>{folderItems.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={applyChanges} disabled={saving || (targetType === "keep" && targetCategory === "keep")}>{saving ? "Salvando…" : "Aplicar alterações"}</Button>
        <Button variant="ghost" disabled={saving} onClick={() => { clearSelection(); }}>Limpar seleção</Button>
        {error ? <p role="alert" className="w-full text-sm text-destructive">{error}</p> : null}
        {targetCategory !== "keep" ? <p className="w-full text-sm text-muted-foreground">Os ativos selecionados serão movidos para a pasta {folders.find(folder => folder.key === targetCategory)?.title}.</p> : null}
      </div> : null}

      {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}

      {filteredAssets.length === 0 ? (
        <div className="rounded-lg bg-card px-6 py-12 text-center">
          <p className="font-heading text-base font-medium">
            Nenhum resultado encontrado
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajuste a busca ou selecione outra categoria.
          </p>
        </div>
      ) : (
        <>
          <TabsContent value="cards">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredAssets.map((asset) => (
                <ManagementAssetCard key={asset.id} asset={asset} showType={showType} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="table">
            <ManagementAssetsTable assets={filteredAssets} canEdit={canEdit} selected={selected} saving={saving} toggle={toggle} toggleAll={toggleAll} />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}
