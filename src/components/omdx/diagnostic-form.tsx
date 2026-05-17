"use client";

import {
  CalendarDays,
  FileText,
  Save,
  Send,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getRespondentGroups } from "@/lib/data/omdx-domain";
import type { Diagnostic, DiagnosticTemplate } from "@/lib/types";

type DiagnosticFormProps = {
  mode: "create" | "edit";
  diagnostic?: Diagnostic;
  organizationName: string;
  template: DiagnosticTemplate;
  onSaveDraft: (form: FormState) => void;
  onActivate: (form: FormState) => void;
  onCancel: () => void;
};

export type DiagnosticFormState = {
  name: string;
  description: string;
  deadline: string;
};

type FormState = DiagnosticFormState;

type FormErrors = Partial<Record<"name", string>>;

function getInitialFormState(diagnostic?: Diagnostic): FormState {
  return {
    name: diagnostic?.name ?? "",
    description: diagnostic?.description ?? "",
    deadline: diagnostic?.deadline ?? "",
  };
}

export function DiagnosticForm({
  mode,
  diagnostic,
  organizationName,
  template,
  onSaveDraft,
  onActivate,
  onCancel,
}: DiagnosticFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    getInitialFormState(diagnostic),
  );
  const [errors, setErrors] = useState<FormErrors>({});

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "name") {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  function validate() {
    const nextErrors: FormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Informe o nome do diagnóstico.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSaveDraft() {
    if (!validate()) return;
    onSaveDraft(form);
  }

  function handleActivate() {
    if (!validate()) return;
    onActivate(form);
  }

  const title = mode === "edit" ? "Configurar rascunho" : "Novo diagnóstico";
  const summaryName = form.name.trim() || "Diagnóstico sem nome";
  const respondentGroups = getRespondentGroups();

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => event.preventDefault()}
    >
      <section className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-foreground text-base font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm">
            Defina o contexto da coleta antes de liberar os links por grupo.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="diagnostic-name"
                  className="text-foreground text-sm font-medium"
                >
                  Nome do diagnóstico
                </label>
                <Input
                  id="diagnostic-name"
                  value={form.name}
                  aria-invalid={Boolean(errors.name)}
                  placeholder="Ex.: OMDx - Q3 2026"
                  onChange={(event) => updateField("name", event.target.value)}
                />
                {errors.name && (
                  <p className="text-destructive text-xs">{errors.name}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="diagnostic-company"
                  className="text-foreground text-sm font-medium"
                >
                  Empresa
                </label>
                <Input
                  id="diagnostic-company"
                  value={organizationName}
                  readOnly
                  aria-readonly
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="diagnostic-description"
                  className="text-foreground text-sm font-medium"
                >
                  Descrição opcional
                </label>
                <textarea
                  id="diagnostic-description"
                  value={form.description}
                  rows={4}
                  placeholder="Contexto interno para orientar a coleta."
                  className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full resize-none rounded-lg border px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="diagnostic-deadline"
                  className="text-foreground text-sm font-medium"
                >
                  Prazo de resposta opcional
                </label>
                <Input
                  id="diagnostic-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(event) =>
                    updateField("deadline", event.target.value)
                  }
                />

                <label
                  htmlFor="diagnostic-template"
                  className="text-foreground mt-3 text-sm font-medium"
                >
                  Template
                </label>
                <Select
                  value={template.id}
                  disabled
                  items={[{ value: template.id, label: template.name }]}
                >
                  <SelectTrigger id="diagnostic-template" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={template.id}>{template.name}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-foreground text-base font-semibold">
            Resumo da configuração
          </h3>
          <p className="text-muted-foreground text-sm">
            Revisão antes de salvar ou ativar a coleta.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs uppercase">
                Status
              </span>
              <span className="text-foreground text-sm font-medium">
                Rascunho
              </span>
            </div>

            <Separator />

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-start gap-3">
                <FileText className="text-muted-foreground mt-0.5 size-4" />
                <div>
                  <p className="text-foreground font-medium">{summaryName}</p>
                  <p className="text-muted-foreground text-xs">
                    {organizationName}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays className="text-muted-foreground mt-0.5 size-4" />
                <div>
                  <p className="text-foreground font-medium">
                    {form.deadline || "Sem prazo definido"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Prazo opcional para organizar a coleta.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="text-muted-foreground mt-0.5 size-4" />
                <div>
                  <p className="text-foreground font-medium">
                    3 links de resposta
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Fundador, liderança e operação respondem por links
                    separados.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <div>
                <p className="text-foreground text-sm font-medium">
                  {template.name}
                </p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  {template.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border bg-background p-2">
                  <p className="text-muted-foreground">Dimensões</p>
                  <p className="text-foreground mt-1 font-medium tabular-nums">
                    {template.dimensions.length}
                  </p>
                </div>
                <div className="rounded-lg border bg-background p-2">
                  <p className="text-muted-foreground">Escala</p>
                  <p className="text-foreground mt-1 font-medium tabular-nums">
                    1-5
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <p className="text-foreground text-sm font-medium">
                Próximo passo
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Ao ativar o diagnóstico, o módulo libera os links públicos por
                grupo para compartilhamento com o time.
              </p>
              <div className="mt-1 flex flex-col gap-2">
                {respondentGroups.map((group) => (
                  <div
                    key={group.label}
                    className="rounded-lg border bg-background p-2"
                  >
                    <p className="text-foreground text-xs font-medium">
                      {group.label}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                      {group.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button type="button" onClick={handleActivate}>
                <Send className="size-4" />
                Ativar diagnóstico
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
              >
                <Save className="size-4" />
                Salvar como rascunho
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
              >
                Cancelar
              </Button>
            </div>
        </div>
      </section>
    </form>
  );
}
