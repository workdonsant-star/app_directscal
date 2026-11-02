"use client";

import { useAppRuntime } from "@/components/app-runtime";

import {
  Archive,
  ArchiveRestore,
  FilePen,
  RefreshCw,
  Save,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ManagementAssetStatusBadge } from "@/components/admin/management-asset-status-badge";
import { AppPage } from "@/components/app-page";
import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { AppTopbar } from "@/components/app-topbar";
import { RichTextEditor } from "@/components/management-assets/rich-text-editor";
import { RichTextView } from "@/components/management-assets/rich-text-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  managementAssetTypeLabels,
  type AdminManagementAssetDetail,
  type ManagementAssetTransition,
  type RichTextDocument,
} from "@/lib/contracts";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };
type View = "editar" | "previa" | "publicada";

type MetaState = {
  title: string;
  summary: string;
  category: string;
  ownerLabel: string;
  specialistId: string;
  changeNote: string;
};

const noSpecialist = "sem-especialista";
const initialTitles = ["Novo SOP", "Novo Playbook", "Nova Governança", "Nova matriz RACI"];
const initialSummary = "Resumo a definir.";
const initialOwner = "Responsável a definir";

const textareaClassName =
  "min-h-20 w-full resize-y rounded-lg border border-transparent bg-input px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 dark:bg-input/30";

function metaFromAsset(asset: AdminManagementAssetDetail): MetaState {
  return {
    title: asset.title,
    summary: asset.summary,
    category: asset.category ?? "",
    ownerLabel: asset.ownerLabel ?? "",
    specialistId: asset.specialistId ?? noSpecialist,
    changeNote: asset.draft?.changeNote ?? "",
  };
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";

  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

async function request(
  transport: (url: string, init?: RequestInit) => Promise<Response>,
  url: string,
  init: RequestInit,
): Promise<{ asset: AdminManagementAssetDetail; notice?: string }> {
  const response = await transport(url, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  const data = (await response.json().catch(() => ({}))) as {
    asset?: AdminManagementAssetDetail;
    notice?: string;
    message?: string;
  };

  if (!response.ok || !data.asset) {
    throw new Error(data.message ?? "Não foi possível concluir a ação.");
  }

  return { asset: data.asset, notice: data.notice };
}

export function ManagementAssetEditorWorkspace({
  initialAsset,
  embedded = false,
  deliveryId,
  specialists,
  companyId,
}: {
  initialAsset: AdminManagementAssetDetail;
  embedded?: boolean;
  deliveryId?: string;
  specialists: Option[];
  companyId?: string;
}) {
  const runtime = useAppRuntime();
  const [asset, setAsset] = useState(initialAsset);
  const companyPath = `/admin/empresas/${companyId ?? `company_${asset.organizationId}`}`;
  const assetsPath = `${companyPath}/criacao-dos-ativos`;
  const [meta, setMeta] = useState<MetaState>(() => metaFromAsset(initialAsset));
  const [content, setContent] = useState<RichTextDocument | null>(
    initialAsset.draft?.content ?? null,
  );
  const [metaDirty, setMetaDirty] = useState(false);
  const [contentDirty, setContentDirty] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );
  const [view, setView] = useState<View>(initialAsset.draft ? "editar" : "publicada");
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [autoSaveFailed, setAutoSaveFailed] = useState(false);
  const editGeneration = useRef(0);

  const draft = asset.draft;
  const initialDraft = !asset.published && draft?.versionNumber === "1";
  const archived = asset.status === "arquivado";
  const canEditContent = Boolean(draft && draft.status === "rascunho" && !archived);
  const dirty = metaDirty || contentDirty;
  const editorKey = `${draft?.id ?? "sem-rascunho"}-${draft?.status ?? ""}`;

  useEffect(() => {
    if (!dirty) return;

    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const applyServerAsset = useCallback((next: AdminManagementAssetDetail) => {
    setAsset(next);
    setMeta(metaFromAsset(next));
    setContent(next.draft?.content ?? null);
    setMetaDirty(false);
    setContentDirty(false);
    if (!next.draft) setView((current) => current === "editar" ? "publicada" : current);
  }, []);

  function updateMeta<K extends keyof MetaState>(field: K, value: MetaState[K]) {
    editGeneration.current += 1;
    setMeta((current) => ({ ...current, [field]: value }));
    setMetaDirty(true);
    setAutoSaveFailed(false);
  }

  const save = useCallback(async (silent = false): Promise<boolean> => {
    const generation = editGeneration.current;
    try {
      setPending("salvar");
      const { asset: next } = await request(runtime.request, `/api/admin/management-assets/${asset.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          expectedRevision: asset.revision,
          title: meta.title.trim(),
          summary: meta.summary.trim(),
          category: meta.category.trim() || null,
          ownerLabel: meta.ownerLabel.trim(),
          specialistId: meta.specialistId === noSpecialist ? null : meta.specialistId,
          changeNote: meta.changeNote.trim() || null,
          content: canEditContent && contentDirty ? content : null,
        }),
      });
      if (generation === editGeneration.current) {
        applyServerAsset(next);
      } else {
        setAsset(next);
      }
      if (!silent) setNotice({ tone: "ok", text: "Alterações salvas." });
      setAutoSaveFailed(false);
      return generation === editGeneration.current;
    } catch (error) {
      setAutoSaveFailed(true);
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Não foi possível salvar.",
      });
      return false;
    } finally {
      setPending(null);
    }
  }, [asset.id, asset.revision, meta, content, canEditContent, contentDirty, applyServerAsset, runtime]);

  useEffect(() => {
    if (!dirty || archived || pending !== null || autoSaveFailed) return;
    const timer = window.setTimeout(() => { void save(true); }, 1000);
    return () => window.clearTimeout(timer);
  }, [dirty, archived, pending, autoSaveFailed, save]);

  async function transition(action: ManagementAssetTransition) {
    if (dirty && !archived) {
      const saved = await save();
      if (!saved) return;
    }

    try {
      setPending(action);
      const { asset: next, notice: message } = await request(
        runtime.request,
        `/api/admin/management-assets/${asset.id}/transition`,
        { method: "POST", body: JSON.stringify({ action }) },
      );
      applyServerAsset(next);
      setConfirmArchive(false);
      setNotice({ tone: "ok", text: message ?? "Ação concluída." });
      if (action === "abrir_rascunho") setView("editar");
      if (action === "publicar") setView("publicada");
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Não foi possível concluir a ação.",
      });
    } finally {
      setPending(null);
    }
  }

  const primaryAction = useMemo(() => {
    if (archived) {
      return { action: "restaurar" as const, label: "Restaurar ativo", icon: ArchiveRestore };
    }
    if (!draft) {
      return { action: "abrir_rascunho" as const, label: "Editar como nova versão", icon: FilePen };
    }
    return {
      action: "publicar" as const,
      label: `Publicar versão ${draft.versionNumber}`,
      icon: UploadCloud,
    };
  }, [archived, draft]);
  const PrimaryIcon = primaryAction.icon;

  const views: Array<{ value: View; label: string; disabled: boolean }> = [
    { value: "editar", label: draft ? `Versão ${draft.versionNumber}` : "Rascunho", disabled: !draft },
    { value: "previa", label: "Prévia do cliente", disabled: !draft },
    {
      value: "publicada",
      label: asset.published ? `Publicada v${asset.published.versionNumber}` : "Publicada",
      disabled: !asset.published,
    },
  ];

  const PageContent = embedded ? "div" : AppPage;
  const actions = (
          <div className="flex items-center gap-2">
            {!archived ? (
              autoSaveFailed ? (
                <Button variant="outline" onClick={() => { setAutoSaveFailed(false); void save(); }} disabled={pending !== null}>
                  <Save className="size-4" /> Tentar salvar
                </Button>
              ) : <span role="status" className="text-xs text-muted-foreground">{pending === "salvar" ? "Salvando…" : dirty ? "Alterações pendentes" : "Salvo automaticamente"}</span>
            ) : null}
            <Button
              onClick={() => transition(primaryAction.action)}
              disabled={pending !== null}
            >
              <PrimaryIcon className="size-4" />
              {pending === primaryAction.action ? "Processando" : primaryAction.label}
            </Button>
          </div>
  );

  return (
    <>
      {embedded ? <AppTopbarActionsPortal>{actions}</AppTopbarActionsPortal> : (
      <AppTopbar
        breadcrumb={[
          { label: "Empresas", href: "/admin/empresas" },
          { label: asset.organizationName },
        ]}
        actions={actions}
      />
      )}

      <PageContent>
        <div className="grid w-full gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                {view === "editar" && !archived ? (
                  <h1 className="min-w-0 flex-1">
                    <Input
                      aria-label="Título do ativo"
                      value={initialDraft && initialTitles.includes(meta.title) ? "" : meta.title}
                      placeholder={`Título ${asset.type === "raci" ? "da matriz RACI" : `do ${managementAssetTypeLabels[asset.type]}`}`}
                      maxLength={240}
                      className="h-auto rounded-none border-0 bg-transparent px-0 py-0 font-heading text-ui-page focus-visible:border-0 focus-visible:ring-0 md:text-ui-page"
                      onChange={(event) => updateMeta("title", event.target.value)}
                    />
                  </h1>
                ) : <h1 className="min-w-0 flex-1 truncate text-ui-page">{meta.title || asset.title}</h1>}
                <ManagementAssetStatusBadge status={asset.status} />
                {asset.published && draft ? (
                  <ManagementAssetStatusBadge status={draft.status} />
                ) : null}
              </div>
              <Tabs value={view} onValueChange={(value) => setView(value as View)}>
                <TabsList>
                  {views.map((item) => (
                    <TabsTrigger key={item.value} value={item.value} disabled={item.disabled}>
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {notice ? (
              <p
                role={notice.tone === "error" ? "alert" : "status"}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm",
                  notice.tone === "error"
                    ? "border-destructive/40 text-destructive"
                    : "bg-card text-foreground",
                )}
              >
                {notice.text}
              </p>
            ) : null}

            {view === "editar" && draft && content ? (
              <>
                {!canEditContent ? (
                  <p className="text-sm text-muted-foreground">
                    {archived
                      ? "Ativo arquivado. Restaure para voltar a editar."
                      : "O conteúdo desta versão está indisponível para edição."}
                  </p>
                ) : null}
                <RichTextEditor
                  key={editorKey}
                  initialContent={content}
                  editable={canEditContent}
                  ariaLabel={`Conteúdo de ${asset.title}`}
                  onChange={(next) => {
                    if (JSON.stringify(next) === JSON.stringify(content)) return;
                    editGeneration.current += 1;
                    setContent(next);
                    setContentDirty(true);
                    setAutoSaveFailed(false);
                  }}
                />
              </>
            ) : null}

            {view === "previa" && content ? (
              <div className="rounded-lg bg-card px-6 py-8 sm:px-10">
                <RichTextView content={content} callouts={asset.type === "sop"} />
              </div>
            ) : null}

            {view === "publicada" && asset.published ? (
              <div className="rounded-lg bg-card px-6 py-8 sm:px-10">
                <RichTextView
                  content={asset.published.content}
                  callouts={asset.type === "sop"}
                />
              </div>
            ) : null}

            {view === "publicada" && !asset.published ? (
              <div className="rounded-lg bg-card px-6 py-12 text-center">
                <p className="font-heading text-base font-medium">Ainda não publicado</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  O cliente verá este ativo depois da primeira publicação.
                </p>
              </div>
            ) : null}
          </div>

          <aside className="flex flex-col gap-6">
            <section aria-labelledby="asset-meta-title" className="flex flex-col gap-4 rounded-lg bg-card p-4">
              <h2 id="asset-meta-title" className="text-sm font-medium">
                Dados do ativo
              </h2>
              <Field id="meta-summary" label="Resumo">
                <textarea
                  id="meta-summary"
                  value={initialDraft && meta.summary === initialSummary ? "" : meta.summary}
                  placeholder="Resuma em uma frase para a biblioteca e o agente."
                  rows={3}
                  disabled={archived}
                  className={textareaClassName}
                  onChange={(event) => updateMeta("summary", event.target.value)}
                />
              </Field>
              <Field id="meta-owner" label="Líder responsável">
                <Input
                  id="meta-owner"
                  value={initialDraft && meta.ownerLabel === initialOwner ? "" : meta.ownerLabel}
                  placeholder="Pessoa ou área responsável"
                  disabled={archived}
                  onChange={(event) => updateMeta("ownerLabel", event.target.value)}
                />
              </Field>
              <Field id="meta-specialist" label="Especialista Directscal">
                <Select
                  value={meta.specialistId}
                  disabled={archived}
                  items={[
                    { value: noSpecialist, label: "Sem especialista" },
                    ...specialists.map((specialist) => ({
                      value: specialist.id,
                      label: specialist.name,
                    })),
                  ]}
                  onValueChange={(value) => {
                    if (typeof value === "string") updateMeta("specialistId", value);
                  }}
                >
                  <SelectTrigger id="meta-specialist" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={noSpecialist}>Sem especialista</SelectItem>
                    {specialists.map((specialist) => (
                      <SelectItem key={specialist.id} value={specialist.id}>
                        {specialist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {draft ? (
                <Field id="meta-change-note" label={`Nota da versão ${draft.versionNumber}`}>
                  <textarea
                    id="meta-change-note"
                    value={meta.changeNote}
                    rows={2}
                    disabled={!canEditContent}
                    placeholder="O que mudou nesta versão."
                    className={textareaClassName}
                    onChange={(event) => updateMeta("changeNote", event.target.value)}
                  />
                </Field>
              ) : null}
              <p className="text-xs leading-relaxed text-muted-foreground">
                Título, resumo e responsáveis valem imediatamente, inclusive na
                versão publicada. O conteúdo só muda para o cliente na publicação.
              </p>
            </section>

            <section aria-labelledby="asset-index-title" className="flex flex-col gap-3 rounded-lg bg-card p-4">
              <h2 id="asset-index-title" className="text-sm font-medium">
                Publicação e agente
              </h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Versão vigente</dt>
                  <dd className="mt-1 font-medium tabular-nums">
                    {asset.published ? `v${asset.published.versionNumber}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Publicada em</dt>
                  <dd className="mt-1 font-medium tabular-nums">
                    {formatDateTime(asset.published?.publishedAt ?? null)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Trechos indexados</dt>
                  <dd className="mt-1 font-medium tabular-nums">{asset.chunkCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Com vetor semântico</dt>
                  <dd className="mt-1 font-medium tabular-nums">
                    {asset.embeddedChunkCount}/{asset.chunkCount}
                  </dd>
                </div>
              </dl>
              {asset.published && !archived ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="self-start"
                  disabled={pending !== null}
                  onClick={() => transition("reindexar")}
                >
                  <RefreshCw className="size-3.5" />
                  Reindexar vetores
                </Button>
              ) : null}
            </section>

            <section aria-labelledby="asset-history-title" className="flex flex-col gap-3 rounded-lg bg-card p-4">
              <h2 id="asset-history-title" className="text-sm font-medium">
                Histórico de versões
              </h2>
              <ol className="flex flex-col divide-y">
                {asset.versions.map((version) => (
                  <li key={version.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium tabular-nums">Versão {version.versionNumber}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatDateTime(version.publishedAt ?? version.updatedAt)}
                      </p>
                      {version.changeNote ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {version.changeNote}
                        </p>
                      ) : null}
                    </div>
                    <ManagementAssetStatusBadge status={version.status} />
                  </li>
                ))}
              </ol>
            </section>

            {!archived ? (
              <section className="flex flex-col gap-2 rounded-lg border border-dashed p-4">
                {confirmArchive ? (
                  <>
                    <p className="text-sm">
                      O ativo sai da biblioteca do cliente e das respostas do agente.
                      O histórico é preservado.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={pending !== null}
                        onClick={() => transition("arquivar")}
                      >
                        Confirmar arquivamento
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmArchive(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-start"
                    onClick={() => setConfirmArchive(true)}
                  >
                    <Archive className="size-3.5" />
                    Arquivar ativo
                  </Button>
                )}
              </section>
            ) : null}

            <Link
              href={runtime.href(deliveryId ? `/admin/entregas/${deliveryId}/ativos/perguntas` : `${assetsPath}/perguntas`)}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Ver perguntas feitas ao agente
            </Link>
          </aside>
        </div>
      </PageContent>
    </>
  );
}
