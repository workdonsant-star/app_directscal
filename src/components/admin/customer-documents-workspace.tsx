"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Folder, FolderPlus, Trash2, Upload } from "lucide-react";
import { useAppRuntime } from "@/components/app-runtime";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CustomerDocument } from "@/lib/contracts/customer-documents";
import { CustomerDocumentDownloadLink } from "@/components/management-assets/customer-document-download-link";
import type { ManagementAssetCategoryFolder } from "@/lib/data/management-asset-categories";
import { normalizeManagementAssetCategory } from "@/lib/data/management-asset-categories";
import type { AdminManagementAssetListItem } from "@/lib/contracts";

export function CustomerDocumentsWorkspace({ companyId, initialDocuments, initialFolders, assets = [], renderTabs, reportsOnly = false }: {
  companyId: string;
  /** Quando informado, os botões vão para a linha das abas e o título da seção sai. */
  renderTabs?: (actions: ReactNode) => ReactNode;
  initialDocuments: CustomerDocument[];
  initialFolders: ManagementAssetCategoryFolder[];
  assets?: AdminManagementAssetListItem[];
  reportsOnly?: boolean;
}) {
  const runtime = useAppRuntime();
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [folders, setFolders] = useState(initialFolders);
  const [folderName, setFolderName] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"asset" | "report">(reportsOnly ? "report" : "asset");
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const base = `/api/admin/companies/${companyId}`;

  async function createFolder() {
    setPending(true); setError(null); setNotice(null);
    try {
      const response = await runtime.request(`${base}/document-categories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: folderName }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Não foi possível criar a pasta.");
      const category = body.category as { key: string; title: string };
      setFolders(current => [...current, { ...category, href: `/ativos-de-gestao/categorias/${encodeURIComponent(category.key)}`, count: 0 }]);
      setCategoryKey(category.key); setFolderName(""); setNotice("Pasta criada. Ela já aparece na visão do cliente.");
      setFolderDialogOpen(false);
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível criar a pasta."); }
    finally { setPending(false); }
  }

  async function sendFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || (kind === "asset" && !categoryKey)) { setError("Escolha um arquivo e, para ativos, uma pasta."); return; }
    setPending(true); setError(null); setNotice(null);
    try {
      const body = new FormData();
      body.set("kind", kind); body.set("title", title); body.set("file", file);
      if (kind === "asset" && categoryKey) body.set("categoryKey", categoryKey);
      const response = await runtime.request(`${base}/documents`, { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Não foi possível enviar o arquivo.");
      setDocuments(current => [result.document as CustomerDocument, ...current]);
      setTitle(""); setFile(null); setFileInputKey(current => current + 1);
      setFileDialogOpen(false);
      setNotice("Arquivo enviado e disponível para o cliente."); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível enviar o arquivo."); }
    finally { setPending(false); }
  }

  async function removeDocument(document: CustomerDocument) {
    if (!window.confirm(`Excluir “${document.title}” da visão do cliente?`)) return;
    setPending(true); setError(null); setNotice(null);
    try {
      const response = await runtime.request(`${base}/documents`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId: document.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Não foi possível excluir o arquivo.");
      setDocuments(current => current.filter(item => item.id !== document.id));
      setNotice("Arquivo excluído."); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível excluir o arquivo."); }
    finally { setPending(false); }
  }

  const uploadedAssets = documents.filter(item => item.kind === "asset");
  const reports = documents.filter(item => item.kind === "report");
  const activeFolder = folders.find(folder => folder.key === selectedFolder);
  const folderAssets = activeFolder ? assets.filter(asset => normalizeManagementAssetCategory(asset.category) === normalizeManagementAssetCategory(activeFolder.title)) : [];
  const folderDocuments = activeFolder ? uploadedAssets.filter(document => document.categoryKey === activeFolder.key) : [];
  const actions = reportsOnly
    ? <Button type="button" onClick={() => { setError(null); setKind("report"); setFileDialogOpen(true); }}><Upload aria-hidden="true" />Enviar PDF</Button>
    : <><Button type="button" variant="outline" onClick={() => { setError(null); setFolderDialogOpen(true); }}><FolderPlus aria-hidden="true" />Nova pasta</Button><Button type="button" onClick={() => { setError(null); setFileDialogOpen(true); }}><Upload aria-hidden="true" />Novo arquivo</Button></>;
  return <>{renderTabs ? renderTabs(actions) : null}<section aria-labelledby={renderTabs ? undefined : "customer-documents-title"} aria-label={renderTabs ? reportsOnly ? "Diagnósticos" : "Arquivos" : undefined} className="space-y-6">
    {renderTabs ? null : <div className="flex flex-wrap items-end justify-between gap-4"><h2 id="customer-documents-title" className="text-ui-section">{reportsOnly ? "Diagnósticos" : "Arquivos"}</h2><div className="flex gap-2">{actions}</div></div>}
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    {notice ? <p role="status" className="text-sm text-foreground">{notice}</p> : null}
    {reportsOnly ? <div className="space-y-3"><h2 className="text-ui-section">Diagnósticos enviados</h2>{reports.length ? <ul className="divide-y border-t">{reports.map(document => <li key={document.id} className="flex items-center gap-3 py-4"><FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div className="min-w-0 flex-1"><CustomerDocumentDownloadLink document={document} /><p className="text-xs text-muted-foreground">PDF · {document.fileName}</p></div><Button type="button" variant="ghost" size="icon-sm" aria-label={`Excluir ${document.title}`} onClick={() => removeDocument(document)} disabled={pending}><Trash2 aria-hidden="true" /></Button></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhum diagnóstico em PDF foi enviado para esta empresa.</p>}</div> : selectedFolder ? <div className="space-y-4">
      <Button type="button" variant="ghost" className="-ml-3" onClick={() => setSelectedFolder(null)}><ArrowLeft aria-hidden="true" />Todas as pastas</Button>
      <h3 className="font-heading text-xl font-semibold">{activeFolder?.title ?? "Relatórios de diagnóstico"}</h3>
      {folderAssets.length || folderDocuments.length || (selectedFolder === "reports" && reports.length) ? <ul className="divide-y border-t">
        {folderAssets.map(asset => <li key={asset.id} className="flex items-center gap-3 py-3"><FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><Link className="min-w-0 flex-1 font-medium hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={runtime.href(`/admin/empresas/${companyId}/criacao-dos-ativos/${asset.id}`)}>{asset.title}</Link><span className="text-xs text-muted-foreground">{asset.status === "publicado" ? "Publicado" : asset.status === "arquivado" ? "Arquivado" : "Rascunho"}</span></li>)}
        {(selectedFolder === "reports" ? reports : folderDocuments).map(document => <li key={document.id} className="flex items-center gap-3 py-3"><FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div className="min-w-0 flex-1"><CustomerDocumentDownloadLink document={document} /><p className="text-xs text-muted-foreground">{document.fileName}</p></div><Button type="button" variant="ghost" size="icon-sm" aria-label={`Excluir ${document.title}`} onClick={() => removeDocument(document)} disabled={pending}><Trash2 aria-hidden="true" /></Button></li>)}
      </ul> : <p className="text-sm text-muted-foreground">Esta pasta está vazia.</p>}
    </div> : <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{folders.map(folder => {
      const count = assets.filter(asset => normalizeManagementAssetCategory(asset.category) === normalizeManagementAssetCategory(folder.title)).length + uploadedAssets.filter(document => document.categoryKey === folder.key).length;
      return <li key={folder.key}><button type="button" className="flex w-full items-center gap-3 rounded-lg border px-4 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setSelectedFolder(folder.key)}><Folder className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" /><span className="min-w-0 flex-1 truncate font-medium">{folder.title}</span><span className="text-xs tabular-nums text-muted-foreground">{count}</span></button></li>;
    })}{reports.length ? <li><button type="button" className="flex w-full items-center gap-3 rounded-lg border px-4 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setSelectedFolder("reports")}><Folder className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" /><span className="min-w-0 flex-1 truncate font-medium">Relatórios de diagnóstico</span><span className="text-xs tabular-nums text-muted-foreground">{reports.length}</span></button></li> : null}</ul>}
    <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}><DialogContent><DialogHeader><DialogTitle>Nova pasta</DialogTitle><DialogDescription>A pasta aparecerá como categoria na sidebar do cliente.</DialogDescription></DialogHeader><div className="grid gap-2"><label htmlFor="customer-folder-name" className="text-sm font-medium">Nome da pasta</label><Input id="customer-folder-name" aria-label="Nome da nova pasta" maxLength={80} value={folderName} onChange={event => setFolderName(event.target.value)} disabled={pending} /></div>{folderDialogOpen && error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<DialogFooter><Button type="button" variant="outline" onClick={() => setFolderDialogOpen(false)} disabled={pending}>Cancelar</Button><Button type="button" onClick={createFolder} disabled={pending || !folderName.trim()}>{pending ? "Criando…" : "Criar pasta"}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}><DialogContent className="max-w-lg"><form onSubmit={sendFile} className="space-y-4"><DialogHeader><DialogTitle>{reportsOnly ? "Enviar diagnóstico em PDF" : "Novo arquivo"}</DialogTitle><DialogDescription>{reportsOnly ? "O PDF ficará disponível na área Diagnósticos do cliente assim que for enviado." : "Escolha o destino e envie um arquivo pronto para o cliente."}</DialogDescription></DialogHeader>
        {reportsOnly ? null : <div className="grid gap-2"><label htmlFor="customer-file-kind" className="text-sm font-medium">Destino</label><Select value={kind} items={[{ value: "asset", label: "Ativo de gestão" }, { value: "report", label: "Relatório de diagnóstico" }]} onValueChange={value => { if (value === "asset" || value === "report") { setKind(value); setFile(null); setFileInputKey(current => current + 1); } }} disabled={pending}><SelectTrigger id="customer-file-kind"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="asset">Ativo de gestão</SelectItem><SelectItem value="report">Relatório de diagnóstico</SelectItem></SelectContent></Select></div>}
        {kind === "asset" ? <div className="grid gap-2"><label htmlFor="customer-file-folder" className="text-sm font-medium">Pasta</label><Select value={categoryKey} items={folders.map(folder => ({ value: folder.key, label: folder.title }))} onValueChange={value => setCategoryKey(typeof value === "string" ? value : null)} disabled={pending}><SelectTrigger id="customer-file-folder"><SelectValue placeholder="Selecione uma pasta" /></SelectTrigger><SelectContent>{folders.map(folder => <SelectItem key={folder.key} value={folder.key}>{folder.title}</SelectItem>)}</SelectContent></Select></div> : null}
        <div className="grid gap-2"><label htmlFor="customer-file-title" className="text-sm font-medium">Título</label><Input id="customer-file-title" required maxLength={160} value={title} onChange={event => setTitle(event.target.value)} disabled={pending} /></div>
        <div className="grid gap-2"><label htmlFor="customer-file-input" className="text-sm font-medium">Arquivo</label><Input key={fileInputKey} id="customer-file-input" type="file" required accept={kind === "report" ? ".pdf,application/pdf" : ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"} onChange={event => setFile(event.target.files?.[0] ?? null)} disabled={pending} /><p className="text-xs text-muted-foreground">{kind === "report" ? "PDF" : "PDF ou DOCX"} · até 10 MB</p></div>
        {fileDialogOpen && error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter><Button type="button" variant="outline" onClick={() => setFileDialogOpen(false)} disabled={pending}>Cancelar</Button><Button type="submit" disabled={pending || !file || !title.trim() || (kind === "asset" && !categoryKey)}><Upload aria-hidden="true" />{pending ? "Enviando…" : "Enviar e publicar"}</Button></DialogFooter>
      </form></DialogContent></Dialog>
  </section></>;
}
