"use client";

import { useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppRuntime } from "@/components/app-runtime";
import { Icon, MoreHorizontal, Pencil, Plus, RotateCcw, Trash2, X, type IconNode } from "lucide-react";
import catalog from "@/lib/lucide-icon-catalog.json";
import { lucideIconNames, resolveAssetIconName } from "@/lib/asset-navigation-icons";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { assetNavigationPreferencesSchema, type AssetNavigationPreferences } from "@/lib/contracts/asset-navigation";
import type { ManagementAssetCategoryFolder } from "@/lib/data/management-asset-categories";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuAction,
  SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

const iconNodes = catalog as unknown as Record<string, IconNode>;
type Preferences = AssetNavigationPreferences;
const defaults: Record<string, string> = {
  "gestao de pessoas": "users", governanca: "scale",
  cultura: "heart-handshake", comunicacao: "message-square-text",
};

function CatalogIcon({ name, className = "size-4" }: { name: string; className?: string }) {
  return <Icon iconNode={iconNodes[resolveAssetIconName(name)] ?? iconNodes.folder} className={className} aria-hidden="true" />;
}

export function ManagementAssetNavigation({ folders, initialPreferences, canManage, onNavigate }: {
  folders: ManagementAssetCategoryFolder[];
  initialPreferences: Preferences;
  canManage: boolean;
  onNavigate: () => void;
}) {
  const runtime = useAppRuntime();
  const pathname = runtime.pathname(usePathname());
  const createAnchor = useRef<HTMLButtonElement | null>(null);
  const [nameEditor, setNameEditor] = useState<{ folder: ManagementAssetCategoryFolder | null } | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [nameAnchor, setNameAnchor] = useState<HTMLButtonElement | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<ManagementAssetCategoryFolder | null>(null);
  const [deleteAnchor, setDeleteAnchor] = useState<HTMLButtonElement | null>(null);
  const [documentCount, setDocumentCount] = useState<number | null>(null);
  const [destination, setDestination] = useState("");
  const [newDestinationName, setNewDestinationName] = useState("");
  const deleteRequest = useRef(0);
  const router = useRouter();
  const [preferences, setPreferences] = useState(initialPreferences);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const suppressClick = useRef(false);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const dragSession = useRef<{ key: string; startY: number; order: string[]; originalOrder: string[]; rows: { key: string; center: number }[]; scrollArea: HTMLElement | null; initialScroll: number; moved: boolean } | null>(null);
  const [editingFolder, setEditingFolder] = useState<ManagementAssetCategoryFolder | null>(null);
  const iconAnchors = useRef(new Map<string, HTMLButtonElement>());
  const [iconAnchor, setIconAnchor] = useState<HTMLButtonElement | null>(null);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(120);
  const matchingIcons = lucideIconNames.filter(name => name.includes(search.trim().toLowerCase().replace(/\s+/g, "-")));
  const folderMap = new Map(folders.map(folder => [folder.key, folder]));
  for (const category of preferences.categories ?? []) {
    if (category.deleted) { folderMap.delete(category.key); continue; }
    const previous = folderMap.get(category.key);
    folderMap.set(category.key, { ...category, count: previous?.count ?? 0, href: previous?.href ?? `/ativos-de-gestao/categorias/${encodeURIComponent(category.key)}` });
  }
  const orderedFolders = [...folderMap.values()].sort((a, b) => {
    const first = (dragOrder ?? preferences.order).indexOf(a.key);
    const second = (dragOrder ?? preferences.order).indexOf(b.key);
    return (first < 0 ? Infinity : first) - (second < 0 ? Infinity : second);
  });

  async function save(next: Preferences) {
    if (saving || !canManage) return;
    const previous = preferences;
    setPreferences(next);
    setDragOrder(null);
    setSaving(true);
    setError(null);
    try {
      const response = await runtime.request("/api/settings/asset-navigation", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: next.order, icons: next.icons }),
      });
      if (!response.ok) throw new Error("Não foi possível salvar a organização do menu.");
      setPreferences(assetNavigationPreferencesSchema.parse(await response.json()));
      setEditingFolder(null);
      router.refresh();
    } catch {
      setPreferences(previous);
      setError("Não foi possível salvar a organização do menu. Tente novamente.");
    } finally {
      setSaving(false);
      setDragOrder(null);
    }
  }

  async function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !nameEditor || !categoryName.trim()) return;
    const folder = nameEditor.folder;
    setSaving(true); setError(null);
    try {
      const response = await runtime.request("/api/settings/asset-categories", {
        method: folder ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: categoryName.trim(), ...(folder ? { key: folder.key } : {}) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Não foi possível salvar a categoria.");
      setPreferences(previous => ({ ...previous, categories: [...(previous.categories ?? []).filter(item => item.key !== result.key), { key: result.key, title: result.title }] }));
      setNameEditor(null);
      if (!folder) router.push(runtime.href(`/ativos-de-gestao/categorias/${encodeURIComponent(result.key)}`));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar a categoria.");
    } finally { setSaving(false); }
  }

  async function loadDocumentCount(folder: ManagementAssetCategoryFolder) {
    const requestId = ++deleteRequest.current;
    setDocumentCount(null);
    try {
      const response = await runtime.request(`/api/settings/asset-categories?key=${encodeURIComponent(folder.key)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Não foi possível consultar os documentos.");
      if (requestId === deleteRequest.current) setDocumentCount(result.count);
    } catch (cause) {
      if (requestId === deleteRequest.current) setError(cause instanceof Error ? cause.message : "Não foi possível consultar os documentos.");
    }
  }

  function openDelete(folder: ManagementAssetCategoryFolder) {
    setError(null); setDestination(""); setNewDestinationName("");
    setDeleteAnchor(iconAnchors.current.get(folder.key) ?? null); setDeletingFolder(folder);
    void loadDocumentCount(folder);
  }

  function closeDelete() { deleteRequest.current += 1; setDeletingFolder(null); setError(null); }

  async function removeCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !deletingFolder || documentCount === null) return;
    setSaving(true); setError(null);
    try {
      const response = await runtime.request("/api/settings/asset-categories", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: deletingFolder.key,
          ...(destination === "__new" ? { newTitle: newDestinationName.trim() } : destination ? { destinationKey: destination } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Não foi possível excluir a categoria.");
      closeDelete();
      const target = orderedFolders.find(folder => folder.key === result.destinationKey);
      router.replace(runtime.href(target?.href ?? (result.destinationKey ? `/ativos-de-gestao/categorias/${encodeURIComponent(result.destinationKey)}` : "/ativos-de-gestao")));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível excluir a categoria.");
      void loadDocumentCount(deletingFolder);
    } finally { setSaving(false); }
  }
  const destinationItems = [
    ...orderedFolders.filter(folder => folder.key !== deletingFolder?.key).map(folder => ({ value: folder.key, label: folder.title })),
    { value: "__new", label: "Criar nova categoria" },
  ];

  function move(index: number, direction: -1 | 1) {
    const order = orderedFolders.map(folder => folder.key);
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    void save({ ...preferences, order });
  }

  function startDrag(event: PointerEvent<HTMLLIElement>, key: string) {
    if (saving || !canManage || event.button !== 0) return;
    if ((event.target as HTMLElement).closest("button")) return;
    suppressClick.current = false;
    const scrollArea = event.currentTarget.closest<HTMLElement>("[data-slot=sidebar-content]");
    const rows = Array.from(event.currentTarget.closest("ul")?.querySelectorAll<HTMLElement>("[data-asset-category]") ?? [])
      .map(row => ({ key: row.dataset.assetCategory!, center: row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2 }));
    dragSession.current = { key, startY: event.clientY, order: orderedFolders.map(folder => folder.key), originalOrder: orderedFolders.map(folder => folder.key), rows, scrollArea, initialScroll: scrollArea?.scrollTop ?? 0, moved: false };
  }

  function drag(event: PointerEvent<HTMLUListElement>) {
    const session = dragSession.current;
    if (!session) return;
    if (!session.moved && Math.abs(event.clientY - session.startY) < 5) return;
    if (!session.moved) event.currentTarget.setPointerCapture(event.pointerId);
    session.moved = true;
    suppressClick.current = true;
    event.preventDefault();
    setDraggedKey(session.key);
    const next = session.originalOrder.filter(key => key !== session.key);
    const position = event.clientY + (session.scrollArea?.scrollTop ?? 0) - session.initialScroll;
    const index = session.rows.filter(row => row.key !== session.key && position > row.center).length;
    next.splice(index, 0, session.key);
    session.order = next;
    setDragOrder(next);
    if (session.scrollArea) {
      const area = session.scrollArea.getBoundingClientRect();
      if (event.clientY < area.top + 32) session.scrollArea.scrollTop -= 12;
      else if (event.clientY > area.bottom - 32) session.scrollArea.scrollTop += 12;
    }
  }

  function finishDrag(cancelled = false) {
    const session = dragSession.current;
    dragSession.current = null;
    setDraggedKey(null);
    if (!cancelled && session?.moved && session.order.some((key, index) => key !== session.originalOrder[index])) {
      void save({ ...preferences, order: session.order });
    } else {
      setDragOrder(null);
    }
  }

  return (
    <>
    <SidebarGroup>
      <SidebarGroupLabel className="group/category-heading relative justify-between text-xs font-normal text-muted-foreground">
        <Link href={runtime.href("/ativos-de-gestao")} onClick={onNavigate} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Ativos de gestão
        </Link>
        {canManage ? <Button ref={createAnchor} variant="ghost" size="icon-xs" disabled={saving} aria-label="Criar categoria"
          className="absolute top-1/2 right-1 size-5 -translate-y-1/2 p-0 [&>svg]:size-4 opacity-0 group-hover/category-heading:opacity-100 group-focus-within/category-heading:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100"
          onClick={() => { setError(null); setCategoryName(""); setNameAnchor(createAnchor.current); setNameEditor({ folder: null }); }}><Plus aria-hidden="true" /></Button> : null}
      </SidebarGroupLabel>
      <p id="asset-drag-instructions" className="sr-only">Arraste para mudar a posição. Pelo teclado, use Alt e as setas para cima e para baixo. Escape cancela o arraste.</p>
      <SidebarMenu className="gap-1" onClickCapture={event => {
        if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
      }} onDragStart={event => event.preventDefault()} onPointerMove={drag} onPointerUp={() => finishDrag()}
        onPointerCancel={() => finishDrag(true)}
        onLostPointerCapture={() => { if (dragSession.current) finishDrag(true); }}>
        {orderedFolders.map((folder, index) => {
          const iconId = preferences.icons[folder.key] ?? defaults[folder.key] ?? "folder";
          const isActive = pathname === folder.href || pathname.startsWith(`${folder.href}/`);
          return (
            <SidebarMenuItem key={folder.key} data-asset-category={folder.key}
              onPointerDown={event => startDrag(event, folder.key)}
              onKeyDown={event => {
                if (event.key === "Escape") finishDrag(true);
                if (canManage && event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
                  event.preventDefault(); move(index, event.key === "ArrowUp" ? -1 : 1);
                }
              }} className={draggedKey === folder.key ? "rounded-md bg-muted ring-1 ring-foreground/30" : undefined}>
              <SidebarMenuButton render={<Link href={runtime.href(folder.href)} />} tooltip={folder.title} isActive={isActive}
                aria-current={isActive ? "page" : undefined} onClick={onNavigate} aria-describedby={canManage ? "asset-drag-instructions" : undefined} className={canManage ? "touch-none select-none pr-8 active:cursor-grabbing" : undefined}>
                <CatalogIcon name={iconId} /><span>{folder.title}</span>
              </SidebarMenuButton>
              {canManage ? <DropdownMenu>
                <DropdownMenuTrigger ref={node => { if (node) iconAnchors.current.set(folder.key, node); else iconAnchors.current.delete(folder.key); }} disabled={saving} aria-label={`Opções de ${folder.title}`} render={<SidebarMenuAction showOnHover />}>
                  <MoreHorizontal aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-52">
                  <DropdownMenuItem onClick={() => { setError(null); setCategoryName(folder.title); setNameAnchor(iconAnchors.current.get(folder.key) ?? null); setNameEditor({ folder }); }}>
                    <Pencil aria-hidden="true" />Renomear categoria
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setError(null); setSearch(""); setVisibleCount(120); setIconAnchor(iconAnchors.current.get(folder.key) ?? null); setEditingFolder(folder); }}>
                    <CatalogIcon name={iconId} />Alterar ícone
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const nextIcons = { ...preferences.icons }; delete nextIcons[folder.key];
                    void save({ ...preferences, icons: nextIcons });
                  }}><RotateCcw aria-hidden="true" />Restaurar ícone padrão</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => openDelete(folder)}><Trash2 aria-hidden="true" />Excluir categoria</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> : null}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
      {error ? <p role="alert" className="px-2 py-1 text-xs text-destructive">{error}</p> : null}
    </SidebarGroup>
    <Popover modal={false} open={deletingFolder !== null} onOpenChange={open => { if (!open && !saving) closeDelete(); }}>
      <PopoverContent anchor={deleteAnchor} aria-label="Excluir categoria" className="w-96">
        <form onSubmit={removeCategory} className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">Excluir {deletingFolder?.title}</span>
            <Button type="button" variant="ghost" size="icon-xs" aria-label="Fechar exclusão de categoria" disabled={saving} onClick={closeDelete}><X aria-hidden="true" /></Button>
          </div>
          {documentCount === null ? <p role="status" className="text-sm text-muted-foreground">Verificando documentos…</p> : documentCount > 0 ? <>
            <p className="text-sm text-muted-foreground">Esta categoria contém {documentCount} {documentCount === 1 ? "documento" : "documentos"}. Escolha outra categoria ou crie uma nova para recebê-los.</p>
            <Select value={destination || null} items={destinationItems} disabled={saving} onValueChange={value => { if (value) setDestination(value); }}>
              <SelectTrigger aria-label="Categoria de destino" className="w-full"><SelectValue placeholder="Escolher categoria de destino" /></SelectTrigger>
              <SelectContent>{destinationItems.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
            {destination === "__new" ? <Input aria-label="Nome da nova categoria de destino" placeholder="Nome da nova categoria" required maxLength={80} disabled={saving} value={newDestinationName} onChange={event => setNewDestinationName(event.target.value)} /> : null}
            <p className="text-xs text-muted-foreground">Todos os documentos serão transferidos. Nenhum documento será excluído.</p>
          </> : <p className="text-sm text-muted-foreground">Esta categoria está vazia. Você pode excluí-la.</p>}
          {error ? <div className="space-y-2"><p role="alert" className="text-sm text-destructive">{error}</p>{documentCount === null ? <Button type="button" variant="secondary" onClick={() => { if (deletingFolder) { setError(null); void loadDocumentCount(deletingFolder); } }}>Tentar novamente</Button> : null}</div> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" disabled={saving} onClick={closeDelete}>Cancelar</Button>
            <Button type="submit" variant="destructive" disabled={saving || documentCount === null || (documentCount > 0 && (!destination || (destination === "__new" && !newDestinationName.trim())))}>
              {saving ? "Salvando…" : documentCount && documentCount > 0 ? "Transferir e excluir" : "Excluir categoria"}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
    <Popover modal={false} open={nameEditor !== null} onOpenChange={open => { if (!open && !saving) setNameEditor(null); }}>
      <PopoverContent anchor={nameAnchor} aria-label={nameEditor?.folder ? "Renomear categoria" : "Criar categoria"}>
        <form onSubmit={saveCategory} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{nameEditor?.folder ? "Renomear categoria" : "Nova categoria"}</span>
            <Button type="button" size="icon-xs" variant="ghost" aria-label="Fechar edição de categoria" disabled={saving} onClick={() => setNameEditor(null)}><X aria-hidden="true" /></Button>
          </div>
          <label className="sr-only" htmlFor="asset-category-name">Nome da categoria</label>
          <Input id="asset-category-name" autoFocus required maxLength={80} value={categoryName} disabled={saving}
            placeholder="Nome da categoria" onChange={event => setCategoryName(event.target.value)} />
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" disabled={saving} onClick={() => setNameEditor(null)}>Cancelar</Button>
            <Button type="submit" disabled={saving || !categoryName.trim()}>{saving ? "Salvando…" : nameEditor?.folder ? "Salvar nome" : "Criar categoria"}</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
    <Popover modal={false} open={editingFolder !== null} onOpenChange={open => { if (!open && !saving) setEditingFolder(null); }}>
      <PopoverContent anchor={iconAnchor} aria-label="Escolher ícone" className="grid gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Ícones</span>
          <Button size="icon-xs" variant="ghost" aria-label="Fechar seletor de ícones" disabled={saving} onClick={() => setEditingFolder(null)}><X aria-hidden="true" /></Button>
        </div>
        <Input className="focus-visible:border-foreground/40 focus-visible:ring-foreground/20" aria-label="Buscar ícone" placeholder="Buscar ícone" value={search} onChange={event => { setSearch(event.target.value); setVisibleCount(120); }} />
        <div className="max-h-[min(45svh,300px)] overflow-y-auto p-1" onScroll={event => {
          const area = event.currentTarget;
          if (area.scrollHeight - area.scrollTop - area.clientHeight < 80) {
            setVisibleCount(count => Math.min(count + 120, matchingIcons.length));
          }
        }}>
          <div className="grid grid-cols-8 gap-1" aria-label="Ícones Lucide">
            {matchingIcons.slice(0, visibleCount).map(name => {
              const selected = editingFolder && resolveAssetIconName(preferences.icons[editingFolder.key] ?? defaults[editingFolder.key] ?? "folder") === name;
              return <Button key={name} size="icon" variant="ghost" disabled={saving} aria-label={name} aria-pressed={Boolean(selected)}
                className={selected ? "bg-muted ring-1 ring-foreground/30" : undefined}
                onClick={() => {
                  if (editingFolder) void save({ ...preferences, icons: { ...preferences.icons, [editingFolder.key]: `lucide:${name}` } });
                }}>
                <CatalogIcon name={name} className="size-5" />
              </Button>;
            })}
          </div>
          {matchingIcons.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhum ícone encontrado.</p> : null}
        </div>

        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      </PopoverContent>
    </Popover>
    </>
  );
}
