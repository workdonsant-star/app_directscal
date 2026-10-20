"use client";

import { Check, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppTopbar } from "@/components/app-topbar";
import { AppPage } from "@/components/app-page";
import {
  DiagnosticForm,
  type DiagnosticFormState,
} from "@/components/omdx/diagnostic-form";
import {
  DiagnosticsTable,
  type DiagnosticsFilter,
} from "@/components/omdx/diagnostics-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEffectiveDiagnosticStatus } from "@/lib/data/omdx-production-rules";
import type {
  AuthRole,
  Diagnostic,
  DiagnosticShareLink,
  DiagnosticTemplate,
  OrganizationSector,
} from "@/lib/types";

type ModalMode = "create" | "edit";

type DiagnosticsWorkspaceProps = {
  currentUserEmail: string;
  currentUserId: string;
  currentUserRole: AuthRole;
  diagnostics: Diagnostic[];
  organizationName: string;
  sectors: OrganizationSector[];
  shareLinksByDiagnosticId: Record<string, DiagnosticShareLink[]>;
  template: DiagnosticTemplate;
};

type DiagnosticMutationResponse = {
  diagnosticId?: string;
  links?: DiagnosticShareLink[];
  message?: string;
  redirectTo?: string;
};

const filters: { value: DiagnosticsFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "ativo", label: "Ativos" },
  { value: "rascunho", label: "Rascunhos" },
  { value: "encerrado", label: "Encerrados" },
];

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
    leaderIds: form.leaderIds,
    name: form.name,
    templateId: template.id,
  };
}

export function DiagnosticsWorkspace({
  currentUserEmail,
  currentUserId,
  currentUserRole,
  diagnostics: storedDiagnostics,
  sectors,
  shareLinksByDiagnosticId,
  template,
}: DiagnosticsWorkspaceProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [selectedDiagnostic, setSelectedDiagnostic] =
    useState<Diagnostic | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [filter, setFilter] = useState<DiagnosticsFilter>("todos");

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const updateTime = () => setNow(new Date());
    const interval = window.setInterval(updateTime, 60_000);
    window.addEventListener("focus", updateTime);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", updateTime);
    };
  }, []);

  const diagnostics = useMemo(
    () => storedDiagnostics.map((diagnostic) => ({
      ...diagnostic,
      status: getEffectiveDiagnosticStatus(diagnostic, now),
    })),
    [storedDiagnostics, now],
  );

  const counts = useMemo(
    () => ({
      todos: diagnostics.length,
      ativo: diagnostics.filter((diagnostic) => diagnostic.status === "ativo")
        .length,
      rascunho: diagnostics.filter(
        (diagnostic) => diagnostic.status === "rascunho",
      ).length,
      encerrado: diagnostics.filter(
        (diagnostic) => diagnostic.status === "encerrado",
      ).length,
    }),
    [diagnostics],
  );

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

  function closeModal() {
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

      setOpen(false);
      setFilter("todos");
      setNotice(null);
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

  async function handleCloseCollection(diagnostic: Diagnostic) {
    if (pending) return;
    try {
      setPending(true);
      setNotice(null);
      const response = await fetch(`/api/omdx/diagnostics/${diagnostic.id}/close`, { method: "POST" });
      const data = await readMutationResponse(response);
      if (!response.ok) throw new Error(data.message ?? "Não foi possível encerrar a coleta.");
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível encerrar a coleta.");
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
    <>
      <AppTopbar
        actions={
          <div className="flex min-w-0 items-center gap-2">
            <Tabs
              value={filter}
              onValueChange={(value) =>
                setFilter(value as DiagnosticsFilter)
              }
            >
              {/* Selector compacto na topbar: mesmo padrão de Action Points,
                  com intervalo menor que o de 32px usado no corpo da página. */}
              <TabsList
                variant="selector"
                className="gap-1"
                aria-label="Filtrar pesquisas por status"
              >
                {filters.map((item) => (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="px-2.5"
                  >
                    {item.label}
                    <span className="font-normal text-muted-foreground tabular-nums">
                      {counts[item.value]}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Button onClick={openCreate} disabled={pending}>
              <Plus className="size-4" />
              Criar diagnóstico
            </Button>
          </div>
        }
      />

      <AppPage>
        <div className="flex w-full flex-col gap-5">
          {notice && (
            <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm text-foreground">
              <Check className="size-4 text-primary" />
              {notice}
            </div>
          )}

          <DiagnosticsTable
            currentUserId={currentUserId}
            diagnostics={diagnostics}
            filter={filter}
            shareLinksByDiagnosticId={shareLinksByDiagnosticId}
            onConfigure={openEdit}
            onDelete={handleDelete}
            onClose={handleCloseCollection}
            pending={pending}
          />
        </div>
      </AppPage>

      <Dialog open={open} onOpenChange={(nextOpen) => { if (!pending) setOpen(nextOpen); }}>
        <DialogContent className="flex max-h-[calc(100svh-2rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 text-card-foreground">
          <DialogClose
            disabled={pending}
            aria-label="Fechar"
            render={<Button type="button" variant="ghost" size="icon-sm" className="absolute top-4 right-4" />}
          >
            <X className="size-4" />
          </DialogClose>
          <DialogHeader className="shrink-0 px-6 pt-6 pb-5 pr-12 sm:px-8 sm:pr-12">
            <DialogTitle>
              {mode === "edit" ? "Configurar rascunho" : "Criar diagnóstico"}
            </DialogTitle>
            <DialogDescription>
              Defina a coleta e selecione as lideranças participantes.
            </DialogDescription>
          </DialogHeader>
          <DiagnosticForm
            currentUserEmail={currentUserEmail}
            currentUserRole={currentUserRole}
            mode={mode === "edit" ? "edit" : "create"}
            diagnostic={selectedDiagnostic ?? undefined}
            sectors={sectors}
            pending={pending}
            error={notice}
            onActivate={handleActivate}
            onCancel={closeModal}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
