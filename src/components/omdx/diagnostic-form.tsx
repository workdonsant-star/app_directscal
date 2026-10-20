"use client";

import { useState } from "react";

import { DiagnosticDeadlinePicker } from "@/components/omdx/diagnostic-deadline-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type {
  AuthRole,
  Diagnostic,
  OrganizationSector,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type DiagnosticFormProps = {
  mode: "create" | "edit";
  diagnostic?: Diagnostic;
  currentUserEmail: string;
  currentUserRole: AuthRole;
  sectors: OrganizationSector[];
  pending?: boolean;
  error?: string | null;
  onActivate: (form: DiagnosticFormState) => void;
  onCancel: () => void;
};

export type DiagnosticFormState = {
  name: string;
  description: string;
  deadline: string;
  leaderIds: string[];
};

type FormErrors = Partial<Record<"name" | "leaders" | "deadline", string>>;
function getInitialFormState({
  currentUserEmail,
  currentUserRole,
  diagnostic,
  sectors,
}: {
  currentUserEmail: string;
  currentUserRole: AuthRole;
  diagnostic?: Diagnostic;
  sectors: OrganizationSector[];
}): DiagnosticFormState {
  const configuredLeaderIds = diagnostic?.sectors?.flatMap(
    (sector) => sector.leaderIds,
  );
  const ownLeaderId = sectors.find(
    (sector) =>
      sector.inviteStatus === "ativo" &&
      sector.leader.email.toLowerCase() === currentUserEmail.toLowerCase(),
  )?.leader.id;

  return {
    name: diagnostic?.name ?? "",
    description: diagnostic?.description ?? "",
    deadline: diagnostic?.deadline ?? "",
    leaderIds:
      configuredLeaderIds && configuredLeaderIds.length > 0
        ? [...new Set(configuredLeaderIds)]
        : currentUserRole === "admin" && ownLeaderId
          ? [ownLeaderId]
          : [],
  };
}

export function DiagnosticForm({
  currentUserEmail,
  currentUserRole,
  diagnostic,
  sectors,
  pending = false,
  error,
  onActivate,
  onCancel,
}: DiagnosticFormProps) {
  const [form, setForm] = useState<DiagnosticFormState>(() =>
    getInitialFormState({ currentUserEmail, currentUserRole, diagnostic, sectors }),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const leaderItems = sectors.map((sector) => ({
    value: sector.leader.id,
    label: `${sector.leader.name ?? sector.leader.email} · ${sector.name}`,
  }));
  function updateField(
    field: "name" | "description" | "deadline",
    value: string,
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "name" || field === "deadline") {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  function handleActivate() {
    if (pending) return;
    const nextErrors: FormErrors = {};
    if (!form.deadline) nextErrors.deadline = "Informe o prazo de resposta.";
    if (!form.name.trim()) nextErrors.name = "Informe o nome do diagnóstico.";
    if (!form.leaderIds.length) nextErrors.leaders = "Selecione ao menos uma liderança responsável.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onActivate(form);
  }

  const fieldClassName = "rounded-[5px] border-transparent bg-input";


  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      aria-busy={pending}
      onSubmit={(event) => { event.preventDefault(); handleActivate(); }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 sm:px-8">
        <fieldset disabled={pending} className="grid min-w-0 gap-5">
          <section aria-label="Informações da coleta" className="flex min-w-0 flex-col gap-5">
            <div className="grid gap-2">
              <label htmlFor="diagnostic-name" className="text-sm font-medium">Nome do diagnóstico</label>
              <Input
                id="diagnostic-name"
                className={fieldClassName}
                value={form.name}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "diagnostic-name-error" : undefined}
                placeholder="Ex.: Maturidade - Q3 2026"
                onChange={(event) => updateField("name", event.target.value)}
              />
              {errors.name && <p id="diagnostic-name-error" role="alert" className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="grid gap-2">
              <label htmlFor="diagnostic-deadline" className="text-sm font-medium">Prazo de resposta</label>
              <DiagnosticDeadlinePicker value={form.deadline} onChange={(value) => updateField("deadline", value)} disabled={pending} invalid={Boolean(errors.deadline)} describedBy={errors.deadline ? "diagnostic-deadline-error" : undefined} />
              {errors.deadline && <p id="diagnostic-deadline-error" role="alert" className="text-xs text-destructive">{errors.deadline}</p>}
              <p className="text-xs text-muted-foreground">Respostas até o fim do dia, no horário de São Paulo.</p>
            </div>

            <div className="grid gap-2">
              <label htmlFor="diagnostic-description" className="text-sm font-medium">Descrição <span className="font-normal text-muted-foreground">(opcional)</span></label>
              <textarea
                id="diagnostic-description"
                value={form.description}
                rows={3}
                placeholder="Contexto interno para orientar a coleta."
                className={cn(fieldClassName, "min-h-24 w-full resize-y border px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50")}
                onChange={(event) => updateField("description", event.target.value)}
              />
            </div>

          </section>

          <section aria-labelledby="diagnostic-leaders-title" className="flex min-w-0 flex-col gap-2">
            <label htmlFor="diagnostic-leaders" id="diagnostic-leaders-title" className="text-sm font-medium">Lideranças responsáveis</label>
            <Select<string, true>
              multiple
              value={form.leaderIds}
              items={leaderItems}
              disabled={pending || sectors.length === 0}
              onValueChange={(leaderIds) => {
                setForm((current) => ({ ...current, leaderIds }));
                setErrors((current) => ({ ...current, leaders: undefined }));
              }}
            >
              <SelectTrigger id="diagnostic-leaders" className="w-full" aria-invalid={Boolean(errors.leaders)} aria-describedby={errors.leaders ? "diagnostic-leaders-error" : "diagnostic-leaders-hint"}>
                <SelectValue placeholder="Selecionar lideranças">
                  {(value: string[]) => value.length === 0
                    ? "Selecionar lideranças"
                    : value.length === 1
                      ? leaderItems.find((item) => item.value === value[0])?.label
                      : `${value.length} lideranças selecionadas`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {sectors.map((sector) => (
                  <SelectItem key={sector.id} value={sector.leader.id} disabled={!sector.active || sector.inviteStatus !== "ativo"}>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{sector.leader.name ?? sector.leader.email}</span>
                      <span className="truncate text-xs text-muted-foreground">{sector.name}{sector.leader.position ? ` · ${sector.leader.position}` : ""}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p id="diagnostic-leaders-hint" className="text-xs leading-relaxed text-muted-foreground">{sectors.length ? "Selecione uma ou mais lideranças participantes." : "Cadastre as lideranças em Configurações para criar a pesquisa."}</p>
            {errors.leaders && <p id="diagnostic-leaders-error" role="alert" className="text-xs text-destructive">{errors.leaders}</p>}
          </section>
        </fieldset>
        {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
      </div>

      <footer className="flex shrink-0 items-center justify-end gap-2 bg-popover px-6 py-5 sm:px-8">
        <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={pending}>{pending ? "Ativando…" : "Ativar diagnóstico"}</Button>
      </footer>
    </form>
  );
}
