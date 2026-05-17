"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  createAcquisitionSlug,
  fieldTypeLabel,
  isCoreAcquisitionField,
  notifyAdminDataChanged,
} from "@/lib/data/admin-data-source";
import type {
  AcquisitionCampaign,
  AcquisitionCampaignStatus,
  AcquisitionFormField,
  AcquisitionFormFieldType,
  AdminModule,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type CampaignEditorDrawerProps = {
  campaign: AcquisitionCampaign | null;
  mode?: "create" | "edit";
  modules: AdminModule[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const campaignStatusOptions: {
  value: AcquisitionCampaignStatus;
  label: string;
}[] = [
  { value: "ativo", label: "Ativo" },
  { value: "pausado", label: "Pausado" },
];

const fieldTypeOptions: { value: AcquisitionFormFieldType; label: string }[] = [
  { value: "text", label: fieldTypeLabel("text") },
  { value: "email", label: fieldTypeLabel("email") },
  { value: "phone", label: fieldTypeLabel("phone") },
  { value: "number", label: fieldTypeLabel("number") },
  { value: "select", label: fieldTypeLabel("select") },
  { value: "textarea", label: fieldTypeLabel("textarea") },
];

function textareaClasses(className?: string) {
  return cn(
    "border-input bg-transparent text-foreground min-h-20 w-full rounded-lg border px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30",
    className,
  );
}

function sortFields(fields: AcquisitionFormField[]) {
  return [...fields].sort((a, b) => a.order - b.order);
}

function createCustomField(order: number): AcquisitionFormField {
  return {
    id: `custom_${Date.now()}`,
    label: "Novo campo",
    type: "text",
    required: false,
    placeholder: null,
    options: null,
    order,
  };
}

export function CampaignEditorDrawer({
  campaign,
  mode = "edit",
  modules,
  open,
  onOpenChange,
}: CampaignEditorDrawerProps) {
  const [draft, setDraft] = useState<AcquisitionCampaign | null>(campaign);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const moduleOptions = modules.map((module) => ({
    value: module.id,
    label: module.shortName,
  }));

  function updateCampaign(
    key: "moduleId" | "name" | "source" | "status",
    value: AcquisitionCampaign[keyof AcquisitionCampaign],
  ) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateSlug(value: string) {
    const slug = createAcquisitionSlug(value);

    setDraft((current) =>
      current
        ? {
            ...current,
            slug,
            publicPath: `/a/${slug}`,
          }
        : current,
    );
  }

  function updateField(
    fieldId: string,
    patch: Partial<AcquisitionFormField>,
  ) {
    setDraft((current) => {
      if (!current) return current;

      return {
        ...current,
        fields: current.fields.map((field) =>
          field.id === fieldId ? { ...field, ...patch } : field,
        ),
      };
    });
  }

  function addField() {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        fields: [...current.fields, createCustomField(current.fields.length)],
      };
    });
  }

  function removeField(fieldId: string) {
    if (isCoreAcquisitionField(fieldId)) return;

    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        fields: current.fields
          .filter((field) => field.id !== fieldId)
          .map((field, index) => ({ ...field, order: index })),
      };
    });
  }

  async function handleSave() {
    if (!draft) return;
    setIsSaving(true);
    setSaveError(null);

    const nextDraft = {
      ...draft,
      fields: sortFields(draft.fields).map((field, index) => ({
        ...field,
        order: index,
      })),
    };

    try {
      const response = await fetch("/api/admin/campaigns", {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextDraft),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        setSaveError(data?.message ?? "Não foi possível salvar a campanha.");
        setIsSaving(false);
        return;
      }

      notifyAdminDataChanged();
      onOpenChange(false);
    } catch {
      setSaveError("Não foi possível salvar a campanha agora.");
      setIsSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto data-[side=right]:!w-[min(100vw,58rem)] data-[side=right]:!max-w-none">
        <SheetHeader className="border-b">
          <SheetTitle>
            {mode === "create" ? "Criar campanha" : "Configurar campanha"}
          </SheetTitle>
          <SheetDescription>
            Selecione o módulo, ajuste o link de aquisição e defina os campos
            que o lead vai preencher.
          </SheetDescription>
        </SheetHeader>

        {draft && (
          <div className="flex flex-col gap-6 p-4">
            <section className="grid gap-4 rounded-lg border bg-card p-4 lg:grid-cols-[1fr_14rem_12rem]">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="campaign-name"
                  className="text-sm font-medium text-foreground"
                >
                  Nome da campanha
                </label>
                <Input
                  id="campaign-name"
                  value={draft.name}
                  onChange={(event) => updateCampaign("name", event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="campaign-module"
                  className="text-sm font-medium text-foreground"
                >
                  Módulo
                </label>
                <Select
                  value={draft.moduleId}
                  items={moduleOptions}
                  onValueChange={(value) => {
                    if (typeof value === "string") {
                      updateCampaign("moduleId", value);
                    }
                  }}
                >
                  <SelectTrigger id="campaign-module">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {moduleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="campaign-status"
                  className="text-sm font-medium text-foreground"
                >
                  Status
                </label>
                <Select
                  value={draft.status}
                  items={campaignStatusOptions}
                  onValueChange={(value) => {
                    if (value === "ativo" || value === "pausado") {
                      updateCampaign("status", value);
                    }
                  }}
                >
                  <SelectTrigger id="campaign-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {campaignStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="campaign-source"
                  className="text-sm font-medium text-foreground"
                >
                  Origem
                </label>
                <Input
                  id="campaign-source"
                  value={draft.source}
                  onChange={(event) =>
                    updateCampaign("source", event.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-2 lg:col-span-2">
                <label
                  htmlFor="campaign-slug"
                  className="text-sm font-medium text-foreground"
                >
                  Slug de aquisição
                </label>
                <div className="flex min-w-0 items-center rounded-lg border border-input bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
                  <span className="shrink-0 border-r px-2.5 text-sm text-muted-foreground">
                    /a/
                  </span>
                  <Input
                    id="campaign-slug"
                    className="h-8 border-0 bg-transparent focus-visible:ring-0"
                    value={draft.slug}
                    onChange={(event) => updateSlug(event.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Link público: {draft.publicPath}
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-semibold text-foreground">
                    Campos do formulário
                  </h3>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Nome, e-mail e empresa permanecem como campos base para
                    manter as listagens de leads e empresas consistentes.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={addField}>
                  <Plus className="size-4" />
                  Adicionar campo
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {sortFields(draft.fields).map((field) => {
                  const isCore = isCoreAcquisitionField(field.id);

                  return (
                    <div
                      key={field.id}
                      className="grid gap-3 rounded-lg border bg-card p-3 lg:grid-cols-[1.1fr_10rem_1fr_auto]"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`${field.id}-label`}
                            className="text-sm font-medium text-foreground"
                          >
                            Label
                          </label>
                          {isCore && <AdminStatusBadge status="ativo" />}
                        </div>
                        <Input
                          id={`${field.id}-label`}
                          value={field.label}
                          onChange={(event) =>
                            updateField(field.id, { label: event.target.value })
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor={`${field.id}-type`}
                          className="text-sm font-medium text-foreground"
                        >
                          Tipo
                        </label>
                        <Select
                          value={field.type}
                          items={fieldTypeOptions}
                          disabled={isCore}
                          onValueChange={(value) => {
                            if (typeof value !== "string") return;
                            const nextType = value as AcquisitionFormFieldType;
                            updateField(field.id, {
                              type: nextType,
                              options:
                                nextType === "select"
                                  ? field.options ?? ["Opção 1", "Opção 2"]
                                  : null,
                            });
                          }}
                        >
                          <SelectTrigger id={`${field.id}-type`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor={`${field.id}-placeholder`}
                          className="text-sm font-medium text-foreground"
                        >
                          Placeholder
                        </label>
                        <Input
                          id={`${field.id}-placeholder`}
                          value={field.placeholder ?? ""}
                          onChange={(event) =>
                            updateField(field.id, {
                              placeholder: event.target.value || null,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-end gap-2">
                        <label className="flex h-8 items-center gap-2 rounded-lg border px-2.5 text-sm text-foreground">
                          <input
                            type="checkbox"
                            className="size-4 accent-primary"
                            checked={field.required}
                            onChange={(event) =>
                              updateField(field.id, {
                                required: event.target.checked,
                              })
                            }
                          />
                          Obrigatório
                        </label>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remover campo"
                          disabled={isCore}
                          onClick={() => removeField(field.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      {field.type === "select" && (
                        <div className="flex flex-col gap-2 lg:col-span-4">
                          <label
                            htmlFor={`${field.id}-options`}
                            className="text-sm font-medium text-foreground"
                          >
                            Opções
                          </label>
                          <textarea
                            id={`${field.id}-options`}
                            className={textareaClasses("min-h-16")}
                            value={(field.options ?? []).join(", ")}
                            onChange={(event) =>
                              updateField(field.id, {
                                options: event.target.value
                                  .split(",")
                                  .map((option) => option.trim())
                                  .filter(Boolean),
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {saveError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {saveError}
              </p>
            ) : null}

            <div className="sticky bottom-0 -mx-4 -mb-4 flex justify-end gap-2 border-t bg-popover p-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button disabled={isSaving} onClick={handleSave}>
                <Save className="size-4" />
                {isSaving
                  ? "Salvando"
                  : mode === "create"
                    ? "Criar campanha"
                    : "Salvar configuração"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
