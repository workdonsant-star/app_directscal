"use client";

import {
  Bold,
  FileText,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Plus,
  Save,
} from "lucide-react";
import type { ClipboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SopDocument, SopStatus, UpdateSopInput } from "@/lib/types";

type SopsWorkspaceProps = {
  initialSops: SopDocument[];
  organizationId: string;
};

const emptyContent =
  "<h2>Objetivo</h2><p>Descreva o resultado esperado deste procedimento.</p><h2>Procedimento</h2><ol><li>Registre o primeiro passo.</li><li>Defina o responsável pela execução.</li></ol><h2>Critério de pronto</h2><p>Explique quando este SOP pode ser considerado concluído.</p>";

const statusLabels: Record<SopStatus, string> = {
  arquivado: "Arquivado",
  publicado: "Publicado",
  rascunho: "Rascunho",
};

function createDraft(organizationId: string): SopDocument {
  const now = new Date().toISOString();

  return {
    id: `sop_${Date.now().toString(36)}`,
    organizationId,
    title: "Novo SOP",
    department: "Operação",
    owner: "Responsável",
    status: "rascunho",
    updatedAt: now,
    contentHtml: emptyContent,
  };
}

function storageKey(organizationId: string) {
  return `directscal:sops:v1:${organizationId}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function parseStoredSops(value: string | null) {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as SopDocument[]) : null;
  } catch {
    return null;
  }
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function SopsWorkspace({
  initialSops,
  organizationId,
}: SopsWorkspaceProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [sops, setSops] = useState(initialSops);
  const [selectedId, setSelectedId] = useState(initialSops[0]?.id ?? "");
  const [notice, setNotice] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  const selectedSop = useMemo(
    () => sops.find((sop) => sop.id === selectedId) ?? sops[0] ?? null,
    [selectedId, sops],
  );

  useEffect(() => {
    window.queueMicrotask(() => {
      const stored = parseStoredSops(
        window.localStorage.getItem(storageKey(organizationId)),
      );

      if (stored) {
        setSops(stored);
        setSelectedId(stored[0]?.id ?? "");
      }

      setStorageReady(true);
    });
  }, [organizationId]);

  useEffect(() => {
    if (!storageReady) return;

    window.localStorage.setItem(storageKey(organizationId), JSON.stringify(sops));
  }, [organizationId, sops, storageReady]);

  function updateSelected(input: Partial<UpdateSopInput>) {
    if (!selectedSop) return;

    setSops((current) =>
      current.map((sop) =>
        sop.id === selectedSop.id
          ? { ...sop, ...input, updatedAt: new Date().toISOString() }
          : sop,
      ),
    );
  }

  function handleEditorInput() {
    const contentHtml = editorRef.current?.innerHTML ?? "";
    updateSelected({ contentHtml });
  }

  function handleEditorPaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    handleEditorInput();
  }

  function runCommand(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleEditorInput();
  }

  function addSop() {
    const draft = createDraft(organizationId);
    setSops((current) => [draft, ...current]);
    setSelectedId(draft.id);
    setNotice("Novo SOP criado como rascunho.");
  }

  function saveSop() {
    if (!selectedSop) return;
    setNotice("SOP salvo na área da conta do cliente.");
  }

  if (!selectedSop) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
        <FileText className="text-muted-foreground size-8" />
        <h2 className="text-foreground mt-4 text-lg font-semibold">
          Nenhum SOP cadastrado
        </h2>
        <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
          Crie o primeiro procedimento para manter o conhecimento operacional
          documentado dentro da conta do cliente.
        </p>
        <Button className="mt-5" onClick={addSop}>
          <Plus className="size-4" />
          Criar SOP
        </Button>
      </div>
    );
  }

  return (
    <div className="grid min-h-[calc(100dvh-10rem)] gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside id="documentos" className="min-w-0 scroll-mt-20 border-r pr-0 lg:pr-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-foreground text-2xl font-semibold tracking-tight">
              SOPs
            </h1>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              Procedimentos por cliente, com dono, área e documentação
              operacional.
            </p>
          </div>
          <Button size="icon" aria-label="Criar SOP" onClick={addSop}>
            <Plus className="size-4" />
          </Button>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border">
          {sops.map((sop) => (
            <button
              key={sop.id}
              type="button"
              onClick={() => setSelectedId(sop.id)}
              className={cn(
                "flex w-full cursor-pointer flex-col gap-2 border-b px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selectedSop.id === sop.id && "bg-muted",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground truncate text-sm font-medium">
                  {sop.title}
                </span>
                <Badge
                  variant={sop.status === "publicado" ? "secondary" : "outline"}
                  className="shrink-0"
                >
                  {statusLabels[sop.status]}
                </Badge>
              </div>
              <div className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
                <span className="truncate">{sop.department}</span>
                <span className="tabular-nums">{formatDate(sop.updatedAt)}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section id="editor" className="min-w-0 scroll-mt-20">
        <div className="flex flex-col gap-4 border-b pb-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.12em]">
                Conta do cliente
              </p>
              <h2 className="text-foreground mt-2 truncate text-2xl font-semibold tracking-tight">
                {selectedSop.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {notice && (
                <span className="text-muted-foreground text-sm">{notice}</span>
              )}
              <Button onClick={saveSop}>
                <Save className="size-4" />
                Salvar
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_160px]">
            <label className="grid gap-1.5">
              <span className="text-foreground text-xs font-medium">Título</span>
              <Input
                value={selectedSop.title}
                onChange={(event) => updateSelected({ title: event.target.value })}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-foreground text-xs font-medium">Área</span>
              <Input
                value={selectedSop.department}
                onChange={(event) =>
                  updateSelected({ department: event.target.value })
                }
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-foreground text-xs font-medium">Dono</span>
              <Input
                value={selectedSop.owner}
                onChange={(event) => updateSelected({ owner: event.target.value })}
              />
            </label>
            <div className="grid gap-1.5">
              <span className="text-foreground text-xs font-medium">Status</span>
              <div className="flex rounded-lg border p-0.5">
                {(["rascunho", "publicado"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateSelected({ status })}
                    className={cn(
                      "h-7 flex-1 cursor-pointer rounded-md px-2 text-xs font-medium transition-colors",
                      selectedSop.status === status
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {statusLabels[status]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border">
          <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Título"
              onClick={() => runCommand("formatBlock", "h2")}
            >
              <Heading2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Negrito"
              onClick={() => runCommand("bold")}
            >
              <Bold className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Itálico"
              onClick={() => runCommand("italic")}
            >
              <Italic className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Lista com marcadores"
              onClick={() => runCommand("insertUnorderedList")}
            >
              <List className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Lista numerada"
              onClick={() => runCommand("insertOrderedList")}
            >
              <ListOrdered className="size-4" />
            </Button>
          </div>

          <div
            ref={editorRef}
            key={selectedSop.id}
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditorInput}
            onPaste={handleEditorPaste}
            className="sop-editor min-h-[520px] bg-background px-6 py-5 text-sm leading-7 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            dangerouslySetInnerHTML={{ __html: selectedSop.contentHtml }}
          />
        </div>

        <div className="mt-4 grid gap-3 border-y py-4 sm:grid-cols-3">
          <Metric label="Dono" value={selectedSop.owner} />
          <Metric label="Conteúdo" value={`${stripHtml(selectedSop.contentHtml).length} caracteres`} />
          <Metric label="Atualizado" value={formatDate(selectedSop.updatedAt)} />
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className="text-foreground mt-1 truncate text-sm font-medium tabular-nums">
        {value}
      </p>
    </div>
  );
}
