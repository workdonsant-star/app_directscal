"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useEffect, useState, useTransition } from "react";
import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { ManagementAssetDocumentView } from "./management-asset-document-view";
const RichTextEditor = dynamic(() => import("./rich-text-editor").then((module) => module.RichTextEditor), { loading: () => <p role="status" className="py-6 text-sm text-muted-foreground">Carregando editor…</p> });
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import type { ManagementAssetDocument } from "@/lib/contracts";

export function ManagementAssetEditableReader({ asset, canEdit }: { asset: ManagementAssetDocument; canEdit: boolean }) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(asset.title);
  const [summary, setSummary] = useState(asset.summary);
  const [content, setContent] = useState(asset.content);
  const [saving, setSaving] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dirty = editing && (title !== asset.title || summary !== asset.summary || JSON.stringify(content) !== JSON.stringify(asset.content));

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function startEditing() {
    setTitle(asset.title);
    setSummary(asset.summary);
    setContent(asset.content);
    setError(null);
    setNotice(null);
    setEditing(true);
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/management-assets/${asset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedVersionId: asset.versionId, title, summary, content }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Não foi possível salvar o ativo.");
      setEditing(false);
      setNotice("Ativo atualizado. A nova versão está disponível para a empresa e para o agente.");
      startTransition(() => router.refresh());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return <>
    {canEdit && <AppTopbarActionsPortal>
      {editing ? <>
        <Button variant="secondary" disabled={saving} onClick={() => dirty ? setDiscardOpen(true) : setEditing(false)}>Cancelar</Button>
        <Button disabled={saving || !dirty || !title.trim() || !summary.trim()} onClick={save}>{saving ? "Salvando…" : "Salvar atualização"}</Button>
      </> : <Button variant="secondary" disabled={refreshing} onClick={startEditing}><Pencil className="size-4" aria-hidden="true" />Editar ativo</Button>}
    </AppTopbarActionsPortal>}
    {notice && <p role="status" className="mb-6 text-sm text-muted-foreground">{notice}</p>}
    {editing ? <div className="w-full max-w-[1028px] lg:pl-[260px]">
      <h1 className="text-ui-page">Atualizar ativo de gestão</h1>
      <p className="mt-2 text-sm text-muted-foreground">Ao salvar, uma nova versão será publicada. A versão anterior permanece no histórico.</p>
      <div className="my-6 space-y-5">
        <div className="space-y-2"><label htmlFor="asset-title" className="text-sm font-medium">Título</label><Input id="asset-title" value={title} maxLength={200} disabled={saving} onChange={(event) => setTitle(event.target.value)} /></div>
        <div className="space-y-2"><label htmlFor="asset-summary" className="text-sm font-medium">Resumo</label><Input id="asset-summary" value={summary} maxLength={2000} disabled={saving} onChange={(event) => setSummary(event.target.value)} /></div>
      </div>
      {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
      <RichTextEditor initialContent={asset.content} editable={!saving} ariaLabel="Conteúdo do ativo de gestão" onChange={setContent} />
    </div> : <ManagementAssetDocumentView asset={asset} />}
    <Dialog open={discardOpen} onOpenChange={setDiscardOpen}>
      <DialogContent>
        <DialogTitle>Descartar alterações?</DialogTitle>
        <DialogDescription>As alterações ainda não salvas serão perdidas. A versão publicada será mantida.</DialogDescription>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setDiscardOpen(false)}>Continuar editando</Button>
          <Button onClick={() => { setDiscardOpen(false); setEditing(false); }}>Descartar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
