"use client";

import { Check, Plus } from "lucide-react";
import Link from "next/link";
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
import type { Diagnostic, DiagnosticTemplate } from "@/lib/types";

type DrawerMode = "create" | "edit" | "links";

type DiagnosticsWorkspaceProps = {
  diagnostics: Diagnostic[];
  template: DiagnosticTemplate;
};

const groupLinks = [
  { label: "Fundador", token: "fundador" },
  { label: "Liderança", token: "lideranca" },
  { label: "Operação", token: "operacao" },
];

export function DiagnosticsWorkspace({
  diagnostics,
  template,
}: DiagnosticsWorkspaceProps) {
  const [localDiagnostics, setLocalDiagnostics] = useState(() => diagnostics);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DrawerMode>("create");
  const [selectedDiagnostic, setSelectedDiagnostic] =
    useState<Diagnostic | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function openCreate() {
    setMode("create");
    setSelectedDiagnostic(null);
    setNotice(null);
    setOpen(true);
  }

  function openEdit(diagnostic: Diagnostic) {
    setMode("edit");
    setSelectedDiagnostic(diagnostic);
    setNotice(null);
    setOpen(true);
  }

  function closeDrawer() {
    setOpen(false);
  }

  function handleSaveDraft() {
    setNotice("Rascunho salvo nesta sessão mockada.");
    setOpen(false);
  }

  function handleActivate(form: DiagnosticFormState) {
    setSelectedDiagnostic({
      ...(selectedDiagnostic ?? {
        id: "diag_mock",
        organizationId: "org_mock",
        organizationName: form.company,
        createdAt: "2026-05-07T00:00:00.000Z",
        responses: {
          total: 0,
          fundador: 0,
          lideranca: 0,
          operacao: 0,
        },
        generalScore: null,
      }),
      name: form.name,
      company: form.company,
      organizationName: form.company,
      description: form.description || null,
      templateId: template.id,
      status: "ativo",
      updatedAt: "2026-05-07T00:00:00.000Z",
      activatedAt: "2026-05-07T00:00:00.000Z",
      closedAt: null,
      deadline: form.deadline || null,
    });
    setMode("links");
    setNotice("Diagnóstico ativado nesta sessão mockada.");
  }

  function handleDelete(diagnostic: Diagnostic) {
    setLocalDiagnostics((current) =>
      current.filter((item) => item.id !== diagnostic.id),
    );

    if (selectedDiagnostic?.id === diagnostic.id) {
      setSelectedDiagnostic(null);
      setOpen(false);
    }

    setNotice("Diagnóstico excluído nesta sessão mockada.");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-foreground text-3xl font-semibold">
            Diagnósticos
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Crie, configure e acompanhe coletas do OMDx sem sair do contexto da
            lista.
          </p>
        </div>
        <Button onClick={openCreate}>
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
        diagnostics={localDiagnostics}
        onConfigure={openEdit}
        onDelete={handleDelete}
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="overflow-y-auto data-[side=right]:!w-[min(100vw,56rem)] data-[side=right]:!max-w-none">
          {mode === "links" && selectedDiagnostic ? (
            <GeneratedLinks
              diagnostic={selectedDiagnostic}
              onBack={() => {
                setMode(selectedDiagnostic.status === "rascunho" ? "edit" : "create");
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
  onBack,
}: {
  diagnostic: Diagnostic;
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

        {groupLinks.map((group) => (
          <div
            key={group.token}
            className="flex flex-col gap-2 rounded-lg border bg-card p-3"
          >
            <span className="text-foreground text-sm font-medium">
              {group.label}
            </span>
            <code className="text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap rounded-md bg-muted px-2 py-1 text-xs">
              {`https://omdx.directscal.com/r/${diagnostic.id}-${group.token}`}
            </code>
          </div>
        ))}

        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onBack}>
            Voltar para configuração
          </Button>
          <Button render={<Link href={`/omdx/${diagnostic.id}/compartilhar`} />}>
            Abrir compartilhamento
          </Button>
        </div>
      </div>
    </>
  );
}
