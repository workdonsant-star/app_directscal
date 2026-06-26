"use client";

import { Check, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  DiagnosticForm,
  type DiagnosticFormState,
} from "@/components/omdx/diagnostic-form";
import { DiagnosticsTable } from "@/components/omdx/diagnostics-table";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  Diagnostic,
  DiagnosticShareLink,
  DiagnosticTemplate,
} from "@/lib/types";

type DrawerMode = "create" | "edit" | "links";

type DiagnosticsWorkspaceProps = {
  diagnostics: Diagnostic[];
  organizationName: string;
  shareLinksByDiagnosticId: Record<string, DiagnosticShareLink[]>;
  template: DiagnosticTemplate;
};

type GeneratedDiagnostic = {
  id: string;
  company: string;
  name: string;
};

type DiagnosticMutationResponse = {
  diagnosticId?: string;
  links?: DiagnosticShareLink[];
  message?: string;
  redirectTo?: string;
};

async function readMutationResponse(response: Response) {
  const data: unknown = await response.json().catch(() => null);

  return data && typeof data === "object"
    ? (data as DiagnosticMutationResponse)
    : {};
}

function buildDiagnosticPayload(
  form: DiagnosticFormState,
  template: DiagnosticTemplate,
) {
  return {
    deadline: form.deadline || null,
    description: form.description || null,
    name: form.name,
    templateId: template.id,
  };
}

export function DiagnosticsWorkspace({
  diagnostics,
  organizationName,
  shareLinksByDiagnosticId,
  template,
}: DiagnosticsWorkspaceProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DrawerMode>("create");
  const [selectedDiagnostic, setSelectedDiagnostic] =
    useState<Diagnostic | null>(null);
  const [generatedDiagnostic, setGeneratedDiagnostic] =
    useState<GeneratedDiagnostic | null>(null);
  const [generatedLinks, setGeneratedLinks] = useState<DiagnosticShareLink[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function openCreate() {
    setMode("create");
    setSelectedDiagnostic(null);
    setGeneratedDiagnostic(null);
    setGeneratedLinks([]);
    setNotice(null);
    setOpen(true);
  }

  function openEdit(diagnostic: Diagnostic) {
    setMode("edit");
    setSelectedDiagnostic(diagnostic);
    setGeneratedDiagnostic(null);
    setGeneratedLinks([]);
    setNotice(null);
    setOpen(true);
  }

  function closeDrawer() {
    setOpen(false);
  }

  async function saveDiagnostic(form: DiagnosticFormState) {
    const payload = buildDiagnosticPayload(form, template);
    const response =
      mode === "edit" && selectedDiagnostic
        ? await fetch(`/api/omdx/diagnostics/${selectedDiagnostic.id}`, {
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
            method: "PATCH",
          })
        : await fetch("/api/omdx/diagnostics", {
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          });
    const data = await readMutationResponse(response);

    if (!response.ok) {
      throw new Error(data.message ?? "Não foi possível salvar o diagnóstico.");
    }

    return {
      diagnosticId: data.diagnosticId ?? selectedDiagnostic?.id,
      links: data.links ?? [],
    };
  }

  async function handleSaveDraft(form: DiagnosticFormState) {
    try {
      setPending(true);
      await saveDiagnostic(form);
      setNotice("Rascunho salvo no banco.");
      setOpen(false);
      router.refresh();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o diagnóstico.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleActivate(form: DiagnosticFormState) {
    try {
      setPending(true);
      const saved = await saveDiagnostic(form);

      if (!saved.diagnosticId) {
        throw new Error("Não foi possível identificar o diagnóstico.");
      }

      const activateResponse = await fetch(
        `/api/omdx/diagnostics/${saved.diagnosticId}/activate`,
        {
          method: "POST",
        },
      );
      const activateData = await readMutationResponse(activateResponse);

      if (!activateResponse.ok) {
        if (activateData.redirectTo) {
          router.push(activateData.redirectTo);
          return;
        }

        throw new Error(
          activateData.message ?? "Não foi possível ativar o diagnóstico.",
        );
      }

      setGeneratedDiagnostic({
        id: saved.diagnosticId,
        company: selectedDiagnostic?.company ?? organizationName,
        name: form.name,
      });
      setGeneratedLinks(
        saved.links.length > 0
          ? saved.links
          : shareLinksByDiagnosticId[saved.diagnosticId] ?? [],
      );
      setMode("links");
      setNotice("Diagnóstico ativado no banco.");
      router.refresh();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Não foi possível ativar o diagnóstico.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(diagnostic: Diagnostic) {
    try {
      setPending(true);
      const response = await fetch(`/api/omdx/diagnostics/${diagnostic.id}`, {
        method: "DELETE",
      });
      const data = await readMutationResponse(response);

      if (!response.ok) {
        throw new Error(data.message ?? "Não foi possível excluir o diagnóstico.");
      }

      if (selectedDiagnostic?.id === diagnostic.id) {
        setSelectedDiagnostic(null);
        setOpen(false);
      }

      setNotice("Diagnóstico excluído do banco.");
      router.refresh();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o diagnóstico.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <Button onClick={openCreate} disabled={pending}>
          <Plus className="size-4" />
          Criar diagnóstico
        </Button>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm text-foreground">
          <Check className="text-primary size-4" />
          {notice}
        </div>
      )}

      <DiagnosticsTable
        diagnostics={diagnostics}
        shareLinksByDiagnosticId={shareLinksByDiagnosticId}
        onConfigure={openEdit}
        onDelete={handleDelete}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="overflow-y-auto data-[side=right]:!w-[min(100vw,56rem)] data-[side=right]:!max-w-none">
          {mode === "links" && generatedDiagnostic ? (
            <GeneratedLinks
              diagnostic={generatedDiagnostic}
              links={generatedLinks}
              onBack={() => {
                setMode(selectedDiagnostic?.status === "rascunho" ? "edit" : "create");
              }}
            />
          ) : (
            <>
              <SheetHeader className="border-b">
                <SheetTitle>
                  {mode === "edit" ? "Configurar rascunho" : "Criar diagnóstico"}
                </SheetTitle>
                <SheetDescription>
                  O formulário fica dentro da área de diagnósticos, sem abrir
                  uma página dedicada.
                </SheetDescription>
              </SheetHeader>
              <div className="p-4">
                <DiagnosticForm
                  mode={mode === "edit" ? "edit" : "create"}
                  diagnostic={selectedDiagnostic ?? undefined}
                  organizationName={organizationName}
                  template={template}
                  onSaveDraft={handleSaveDraft}
                  onActivate={handleActivate}
                  onCancel={closeDrawer}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function GeneratedLinks({
  diagnostic,
  links,
  onBack,
}: {
  diagnostic: GeneratedDiagnostic;
  links: DiagnosticShareLink[];
  onBack: () => void;
}) {
  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle>Links gerados</SheetTitle>
        <SheetDescription>
          Compartilhe um link por grupo para preservar a leitura por camada da
          empresa.
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-4 p-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-foreground text-sm font-medium">
            {diagnostic.name}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {diagnostic.company}
          </p>
        </div>

        {links.map((link) => (
          <div
            key={link.group}
            className="flex flex-col gap-2 rounded-lg border bg-card p-3"
          >
            <span className="text-foreground text-sm font-medium">
              {link.group === "fundador"
                ? "Fundador"
                : link.group === "lideranca"
                  ? "Liderança"
                  : "Operação"}
            </span>
            <code className="text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-muted px-2 py-1 text-xs">
              {link.publicUrl}
            </code>
          </div>
        ))}

        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onBack}>
            Voltar para configuração
          </Button>
          <Button
            nativeButton={false}
            render={<Link href={`/omdx/${diagnostic.id}/compartilhar`} />}
          >
            Abrir compartilhamento
          </Button>
        </div>
      </div>
    </>
  );
}
