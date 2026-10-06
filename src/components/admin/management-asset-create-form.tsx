"use client";

import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  FilePlus2,
  UserRound,
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
import {
  editableManagementAssetTypeValues,
  managementAssetTypeLabels,
  type CreateManagementAssetInput,
  type EditableManagementAssetType,
} from "@/lib/contracts";
import { cn } from "@/lib/utils";

export type ManagementAssetTemplateOption = {
  id: string;
  type: EditableManagementAssetType;
  label: string;
  description: string;
  title: string | null;
  summary: string | null;
  category: string | null;
  ownerLabel: string | null;
  reviewCycle: string | null;
};

type Option = { id: string; name: string };

type FormState = {
  organizationId: string;
  type: EditableManagementAssetType;
  title: string;
  summary: string;
  category: string;
  ownerLabel: string;
  reviewCycle: string;
  specialistId: string;
  templateId: string;
};

type Step = 1 | 2 | 3;
type FormErrors = Partial<Record<keyof FormState, string>>;

const steps: Array<{ id: Step; label: string }> = [
  { id: 1, label: "Informações" },
  { id: 2, label: "Responsáveis e ponto de partida" },
  { id: 3, label: "Revisão" },
];

const reviewCycles = ["Mensal", "Trimestral", "Semestral", "Anual", "Sob demanda"];
const blankTemplate = "em-branco";
const noSpecialist = "sem-especialista";

const textareaClassName =
  "min-h-24 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30";

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function ManagementAssetCreateForm({
  organizations,
  initialOrganizationId,
  organizationLocked = false,
  specialists,
  templates,
  pending,
  onCancel,
  onSubmit,
}: {
  organizations: Option[];
  initialOrganizationId?: string;
  organizationLocked?: boolean;
  specialists: Option[];
  templates: ManagementAssetTemplateOption[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateManagementAssetInput) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<FormState>({
    organizationId: initialOrganizationId ?? organizations[0]?.id ?? "",
    type: "sop",
    title: "",
    summary: "",
    category: "",
    ownerLabel: "",
    reviewCycle: "Semestral",
    specialistId: noSpecialist,
    templateId: blankTemplate,
  });

  const typeTemplates = templates.filter((template) => template.type === form.type);
  const selectedTemplate =
    templates.find((template) => template.id === form.templateId) ?? null;
  const organizationName =
    organizations.find((organization) => organization.id === form.organizationId)
      ?.name ?? "Empresa não selecionada";
  const specialistName =
    specialists.find((specialist) => specialist.id === form.specialistId)?.name ??
    "Sem especialista";

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function chooseTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);

    setForm((current) => ({
      ...current,
      templateId,
      // O modelo só preenche campos ainda vazios; nada que o especialista
      // digitou é sobrescrito.
      title: current.title || template?.title || "",
      summary: current.summary || template?.summary || "",
      category: current.category || template?.category || "",
      ownerLabel: current.ownerLabel || template?.ownerLabel || "",
      reviewCycle: template?.reviewCycle ?? current.reviewCycle,
    }));
  }

  function validateBasics() {
    const next: FormErrors = {};

    if (!form.organizationId) next.organizationId = "Selecione a empresa.";
    if (form.title.trim().length < 3) next.title = "Informe um título com ao menos 3 caracteres.";
    if (form.summary.trim().length < 10) {
      next.summary = "Escreva um resumo com ao menos 10 caracteres.";
    }
    if (form.category.trim().length < 2) next.category = "Informe a categoria.";

    setErrors((current) => ({ ...current, ...next }));
    if (Object.keys(next).length > 0) setStep(1);

    return Object.keys(next).length === 0;
  }

  function validateOwnership() {
    if (form.ownerLabel.trim().length >= 2) return true;

    setErrors((current) => ({
      ...current,
      ownerLabel: "Informe a área ou a pessoa responsável.",
    }));
    setStep(2);
    return false;
  }

  function handleNext() {
    if (step === 1 && !validateBasics()) return;
    if (step === 2 && !validateOwnership()) return;
    setStep((current) => Math.min(3, current + 1) as Step);
  }

  function handleSubmit() {
    if (!validateBasics() || !validateOwnership()) return;

    onSubmit({
      organizationId: form.organizationId,
      type: form.type,
      title: form.title.trim(),
      summary: form.summary.trim(),
      category: form.category.trim(),
      ownerLabel: form.ownerLabel.trim(),
      reviewCycle: form.reviewCycle,
      specialistId: form.specialistId === noSpecialist ? null : form.specialistId,
      templateId: form.templateId === blankTemplate ? null : form.templateId,
    });
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => event.preventDefault()}
    >
      <nav
        aria-label="Etapas da criação do ativo"
        className="shrink-0 border-b px-4 py-3 sm:px-6"
      >
        <ol className="grid grid-cols-3 gap-2">
          {steps.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  step === item.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={step === item.id ? "step" : undefined}
                onClick={() => setStep(item.id)}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] tabular-nums",
                    step > item.id && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {step > item.id ? <Check className="size-3" /> : item.id}
                </span>
                <span className="hidden truncate sm:block">{item.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {step === 1 && (
          <section
            aria-labelledby="asset-details-title"
            className="flex flex-col gap-6 p-4 sm:p-6"
          >
            <div className="flex flex-col gap-1">
              <h3 id="asset-details-title" className="text-base font-semibold text-foreground">
                Informações do ativo
              </h3>
              <p className="max-w-[65ch] text-sm text-muted-foreground">
                Todo ativo pertence a uma empresa. O cliente só enxerga a versão
                publicada.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="asset-organization" label="Empresa" error={errors.organizationId}>
                <Select
                  disabled={organizationLocked}
                  value={form.organizationId}
                  items={organizations.map((organization) => ({
                    value: organization.id,
                    label: organization.name,
                  }))}
                  onValueChange={(value) => {
                    if (typeof value === "string") update("organizationId", value);
                  }}
                >
                  <SelectTrigger
                    id="asset-organization"
                    className="w-full"
                    aria-invalid={Boolean(errors.organizationId)}
                  >
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((organization) => (
                      <SelectItem key={organization.id} value={organization.id}>
                        {organization.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field id="asset-type" label="Tipo">
                <Select
                  value={form.type}
                  items={editableManagementAssetTypeValues.map((type) => ({
                    value: type,
                    label: managementAssetTypeLabels[type],
                  }))}
                  onValueChange={(value) => {
                    if (typeof value === "string") {
                      setForm((current) => ({
                        ...current,
                        type: value as EditableManagementAssetType,
                        templateId: blankTemplate,
                      }));
                    }
                  }}
                >
                  <SelectTrigger id="asset-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {editableManagementAssetTypeValues.map((type) => (
                      <SelectItem key={type} value={type}>
                        {managementAssetTypeLabels[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field id="asset-title" label="Título" error={errors.title}>
              <Input
                id="asset-title"
                value={form.title}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "asset-title-error" : undefined}
                placeholder="Ex.: Alçadas de desconto comercial"
                onChange={(event) => update("title", event.target.value)}
              />
            </Field>

            <Field
              id="asset-summary"
              label="Resumo"
              error={errors.summary}
              hint="Aparece no card da biblioteca e ajuda o agente a reconhecer o assunto."
            >
              <textarea
                id="asset-summary"
                value={form.summary}
                rows={3}
                aria-invalid={Boolean(errors.summary)}
                aria-describedby={errors.summary ? "asset-summary-error" : undefined}
                placeholder="Em uma ou duas frases, o que este ativo resolve."
                className={textareaClassName}
                onChange={(event) => update("summary", event.target.value)}
              />
            </Field>

            <Field
              id="asset-category"
              label="Categoria"
              error={errors.category}
              hint="Área usada no filtro da biblioteca, como Comercial ou Financeiro."
            >
              <Input
                id="asset-category"
                value={form.category}
                aria-invalid={Boolean(errors.category)}
                aria-describedby={errors.category ? "asset-category-error" : undefined}
                placeholder="Ex.: Comercial"
                onChange={(event) => update("category", event.target.value)}
              />
            </Field>
          </section>
        )}

        {step === 2 && (
          <section
            aria-labelledby="asset-ownership-title"
            className="flex flex-col gap-6 p-4 sm:p-6"
          >
            <div className="flex flex-col gap-1">
              <h3 id="asset-ownership-title" className="text-base font-semibold text-foreground">
                Responsáveis e ponto de partida
              </h3>
              <p className="max-w-[65ch] text-sm text-muted-foreground">
                Defina quem responde pelo conteúdo na empresa e de onde o texto
                começa.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="asset-owner"
                label="Líder responsável"
                error={errors.ownerLabel}
                hint="Área ou pessoa que responde pelo processo na empresa."
              >
                <Input
                  id="asset-owner"
                  value={form.ownerLabel}
                  aria-invalid={Boolean(errors.ownerLabel)}
                  aria-describedby={errors.ownerLabel ? "asset-owner-error" : undefined}
                  placeholder="Ex.: Diretoria Comercial"
                  onChange={(event) => update("ownerLabel", event.target.value)}
                />
              </Field>

              <Field id="asset-review-cycle" label="Ciclo de revisão">
                <Select
                  value={form.reviewCycle}
                  items={reviewCycles.map((cycle) => ({ value: cycle, label: cycle }))}
                  onValueChange={(value) => {
                    if (typeof value === "string") update("reviewCycle", value);
                  }}
                >
                  <SelectTrigger id="asset-review-cycle" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewCycles.map((cycle) => (
                      <SelectItem key={cycle} value={cycle}>
                        {cycle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field id="asset-specialist" label="Especialista Directscal">
              <Select
                value={form.specialistId}
                items={[
                  { value: noSpecialist, label: "Sem especialista" },
                  ...specialists.map((specialist) => ({
                    value: specialist.id,
                    label: specialist.name,
                  })),
                ]}
                onValueChange={(value) => {
                  if (typeof value === "string") update("specialistId", value);
                }}
              >
                <SelectTrigger id="asset-specialist" className="w-full">
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

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-2 text-sm font-medium text-foreground">
                Ponto de partida
              </legend>
              {[
                {
                  id: blankTemplate,
                  label: "Documento em branco",
                  description: "Comece do zero no editor.",
                },
                ...typeTemplates,
              ].map((template) => (
                <label
                  key={template.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                    form.templateId === template.id
                      ? "border-primary/40 bg-primary/5"
                      : "hover:bg-muted/40",
                  )}
                >
                  <input
                    type="radio"
                    name="asset-template"
                    value={template.id}
                    checked={form.templateId === template.id}
                    onChange={() => chooseTemplate(template.id)}
                    className="mt-1 size-4 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {template.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {template.description}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          </section>
        )}

        {step === 3 && (
          <section
            aria-labelledby="asset-review-title"
            className="grid min-h-full md:grid-cols-[minmax(0,1fr)_18rem]"
          >
            <div className="flex flex-col gap-5 p-4 sm:p-6">
              <div>
                <h3 id="asset-review-title" className="text-base font-semibold text-foreground">
                  Revisão
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Confirme os dados antes de abrir o editor.
                </p>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <FileText className="size-4" /> {managementAssetTypeLabels[form.type]}
                  </dt>
                  <dd className="mt-2 font-medium text-foreground">
                    {form.title.trim() || "Ativo sem título"}
                  </dd>
                  <dd className="mt-1 text-xs text-muted-foreground">
                    {form.category.trim() || "Sem categoria"}
                  </dd>
                </div>
                <div className="rounded-lg border p-4">
                  <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Building2 className="size-4" /> Empresa
                  </dt>
                  <dd className="mt-2 font-medium text-foreground">{organizationName}</dd>
                  <dd className="mt-1 text-xs text-muted-foreground">
                    Revisão {form.reviewCycle.toLocaleLowerCase("pt-BR")}
                  </dd>
                </div>
                <div className="rounded-lg border p-4">
                  <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <UserRound className="size-4" /> Responsáveis
                  </dt>
                  <dd className="mt-2 font-medium text-foreground">
                    {form.ownerLabel.trim() || "Sem responsável"}
                  </dd>
                  <dd className="mt-1 text-xs text-muted-foreground">{specialistName}</dd>
                </div>
                <div className="rounded-lg border p-4">
                  <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <FilePlus2 className="size-4" /> Ponto de partida
                  </dt>
                  <dd className="mt-2 font-medium text-foreground">
                    {selectedTemplate?.label ?? "Documento em branco"}
                  </dd>
                </div>
              </dl>

              <p className="text-sm text-muted-foreground">{form.summary.trim()}</p>
            </div>

            <aside className="border-t bg-muted/20 p-4 sm:p-6 md:border-t-0 md:border-l">
              <p className="text-sm font-medium text-foreground">O que acontece agora</p>
              <ol className="mt-4 flex list-decimal flex-col gap-3 pl-4 text-xs leading-relaxed text-muted-foreground">
                <li>O ativo é criado como rascunho, visível só para a operação.</li>
                <li>O editor abre para você escrever ou ajustar o conteúdo.</li>
                <li>Depois da revisão, a publicação libera o ativo para o cliente e para o agente.</li>
              </ol>
              <Separator className="my-5" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Nada é publicado nesta etapa.
              </p>
            </aside>
          </section>
        )}
      </div>

      <footer className="shrink-0 border-t bg-card p-4 sm:px-6">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancelar
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setStep((current) => (current - 1) as Step)}
              >
                <ChevronLeft className="size-4" />
                Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" onClick={handleNext}>
                Continuar
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={pending}>
                <FilePlus2 className="size-4" />
                {pending ? "Criando rascunho" : "Criar rascunho e abrir editor"}
              </Button>
            )}
          </div>
        </div>
      </footer>
    </form>
  );
}
