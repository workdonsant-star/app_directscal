"use client";

import { type FormEvent, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AcquisitionFormField } from "@/lib/types";
import { cn } from "@/lib/utils";

type AcquisitionProgressiveFormValues = {
  password?: string;
  values: Record<string, string>;
};

type AcquisitionProgressiveFormProps = {
  fields: AcquisitionFormField[];
  includePassword?: boolean;
  isSubmitting: boolean;
  onFirstBack?: () => void;
  onSubmit: (data: AcquisitionProgressiveFormValues) => Promise<void>;
  submitError?: string | null;
  submittingLabel: string;
};

type CampaignStep = {
  field: AcquisitionFormField;
  id: string;
  kind: "campaign";
};

type PasswordStep =
  | {
      id: "campaign-auth-password";
      kind: "password";
      label: string;
    }
  | {
      id: "campaign-auth-confirm-password";
      kind: "confirm-password";
      label: string;
    };

type ProgressiveStep = CampaignStep | PasswordStep;
type ProgressiveSection = ProgressiveStep[];

function textareaClasses(className?: string) {
  return cn(
    "border-input bg-transparent text-foreground min-h-20 w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
    className,
  );
}

function inputType(field: AcquisitionFormField) {
  if (field.type === "email") return "email";
  if (field.type === "phone") return "tel";
  if (field.type === "number") return "number";
  return "text";
}

function autoCompleteValue(field: AcquisitionFormField) {
  if (field.id === "nome") return "name";
  if (field.id === "email") return "email";
  if (field.id === "whatsapp") return "tel";
  if (field.id === "empresa") return "organization";
  if (field.id === "website") return "url";
  return undefined;
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeCnpj(value: string) {
  return value.replace(/\D/g, "");
}

function formatCnpjInput(value: string) {
  const digits = normalizeCnpj(value).slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

const companyRegistryValueKeys = new Set([
  "razao_social",
  "nome_fantasia",
  "situacao_cadastral",
  "data_inicio_atividade",
  "cnae_fiscal",
  "cnae_fiscal_descricao",
  "natureza_juridica",
  "porte_receita",
  "endereco_registrado",
  "municipio_registro",
  "uf_registro",
]);

function withoutCompanyRegistryValues(values: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([key]) => !companyRegistryValueKeys.has(key),
    ),
  );
}

async function getResponseMessage(response: Response, fallback: string) {
  const data: unknown = await response.json().catch(() => null);

  if (data && typeof data === "object" && "message" in data) {
    const message = data.message;
    if (typeof message === "string") return message;
  }

  return fallback;
}

export function getProgressiveSectionSizes(stepCount: number) {
  if (stepCount <= 0) return [];

  return Array.from(
    { length: Math.ceil(stepCount / 3) },
    (_, index) => Math.min(3, stepCount - index * 3),
  );
}

function groupSteps(steps: ProgressiveStep[]) {
  const sections: ProgressiveSection[] = [];
  let offset = 0;

  for (const sectionSize of getProgressiveSectionSizes(steps.length)) {
    sections.push(steps.slice(offset, offset + sectionSize));
    offset += sectionSize;
  }

  return sections;
}

function buildSections(
  fields: AcquisitionFormField[],
  includePassword: boolean,
) {
  const campaignSteps: CampaignStep[] = [...fields]
    .sort((a, b) => a.order - b.order)
    .map((field) => ({ field, id: field.id, kind: "campaign" }));
  const sections = groupSteps(campaignSteps);

  if (!includePassword) return sections;

  sections.push([
    {
      id: "campaign-auth-password",
      kind: "password",
      label: "Senha",
    },
    {
      id: "campaign-auth-confirm-password",
      kind: "confirm-password",
      label: "Confirmar senha",
    },
  ]);

  return sections;
}

function validateStep({
  confirmPassword,
  password,
  step,
  values,
}: {
  confirmPassword: string;
  password: string;
  step: ProgressiveStep;
  values: Record<string, string>;
}) {
  if (step.kind === "password") {
    return password.length < 8
      ? "A senha precisa ter pelo menos 8 caracteres."
      : null;
  }

  if (step.kind === "confirm-password") {
    if (!confirmPassword) return "Confirme a senha para continuar.";
    return password !== confirmPassword
      ? "As senhas informadas não conferem."
      : null;
  }

  const value = values[step.field.id]?.trim() ?? "";

  if (step.field.required && !value) return "Campo obrigatório";
  if (step.field.type === "email" && value && !validateEmail(value)) {
    return "Informe um e-mail válido";
  }

  return null;
}

export function AcquisitionProgressiveForm({
  fields,
  includePassword = false,
  isSubmitting,
  onFirstBack,
  onSubmit,
  submitError = null,
  submittingLabel,
}: AcquisitionProgressiveFormProps) {
  const sections = useMemo(
    () => buildSections(fields, includePassword),
    [fields, includePassword],
  );
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isResolvingCnpj, setIsResolvingCnpj] = useState(false);
  const [password, setPassword] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const isBackPointerDown = useRef(false);
  const isResolvingCnpjRef = useRef(false);
  const currentSection = sections[currentSectionIndex];
  const isLastSection = currentSectionIndex === sections.length - 1;
  const progress =
    sections.length > 0
      ? ((currentSectionIndex + 1) / sections.length) * 100
      : 0;

  if (!currentSection) return null;

  function clearError(stepId: string) {
    setErrors((current) => {
      if (!current[stepId]) return current;

      const next = { ...current };
      delete next[stepId];
      return next;
    });
  }

  function sectionErrors({
    nextConfirmPassword = confirmPassword,
    nextPassword = password,
    nextValues = values,
    section = currentSection,
  }: {
    nextConfirmPassword?: string;
    nextPassword?: string;
    nextValues?: Record<string, string>;
    section?: ProgressiveSection;
  } = {}) {
    return Object.fromEntries(
      section.flatMap((step) => {
        const error = validateStep({
          confirmPassword: nextConfirmPassword,
          password: nextPassword,
          step,
          values: nextValues,
        });

        return error ? [[step.id, error]] : [];
      }),
    );
  }

  async function advanceSection({
    nextConfirmPassword = confirmPassword,
    nextPassword = password,
    nextValues = values,
    sourceStepId,
  }: {
    nextConfirmPassword?: string;
    nextPassword?: string;
    nextValues?: Record<string, string>;
    sourceStepId?: string;
  } = {}) {
    if (isSubmitting || isResolvingCnpjRef.current) return;

    const nextErrors = sectionErrors({
      nextConfirmPassword,
      nextPassword,
      nextValues,
    });

    if (Object.keys(nextErrors).length > 0) {
      if (sourceStepId && nextErrors[sourceStepId]) {
        setErrors((current) => ({
          ...current,
          [sourceStepId]: nextErrors[sourceStepId],
        }));
      } else if (!sourceStepId) {
        setErrors(nextErrors);
      }
      return;
    }

    let resolvedValues = nextValues;
    const cnpjStep = currentSection.find(
      (step) => step.kind === "campaign" && step.field.id === "cnpj",
    );

    if (
      cnpjStep &&
      (!resolvedValues.razao_social ||
        normalizeCnpj(resolvedValues.cnpj ?? "") !==
          normalizeCnpj(values.cnpj ?? ""))
    ) {
      isResolvingCnpjRef.current = true;
      setIsResolvingCnpj(true);

      try {
        const response = await fetch("/api/acquisition/company-by-cnpj", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cnpj: resolvedValues.cnpj }),
        });

        if (!response.ok) {
          setErrors({
            cnpj: await getResponseMessage(
              response,
              "Não foi possível consultar o CNPJ.",
            ),
          });
          return;
        }

        const data: unknown = await response.json().catch(() => null);
        const registryValues =
          data &&
          typeof data === "object" &&
          "values" in data &&
          data.values &&
          typeof data.values === "object" &&
          !Array.isArray(data.values)
            ? (data.values as Record<string, string>)
            : null;

        if (!registryValues?.razao_social) {
          setErrors({ cnpj: "A consulta não retornou a razão social." });
          return;
        }

        resolvedValues = { ...resolvedValues, ...registryValues };
        setValues(resolvedValues);
      } catch {
        setErrors({
          cnpj: "Não foi possível consultar o CNPJ agora. Tente novamente.",
        });
        return;
      } finally {
        isResolvingCnpjRef.current = false;
        setIsResolvingCnpj(false);
      }
    }

    setErrors({});

    if (!isLastSection) {
      setCurrentSectionIndex((index) =>
        Math.min(sections.length - 1, index + 1),
      );
      return;
    }

    await onSubmit({
      password: includePassword ? nextPassword : undefined,
      values: resolvedValues,
    });
  }

  function goBack() {
    isBackPointerDown.current = false;
    setErrors({});

    if (currentSectionIndex === 0) {
      onFirstBack?.();
      return;
    }

    setCurrentSectionIndex((index) => Math.max(0, index - 1));
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void advanceSection();
  }

  function updateValue(fieldId: string, value: string) {
    setValues((current) => {
      if (fieldId !== "cnpj") return { ...current, [fieldId]: value };

      const withoutPreviousRegistry = withoutCompanyRegistryValues(current);

      return { ...withoutPreviousRegistry, cnpj: formatCnpjInput(value) };
    });
    clearError(fieldId);
  }

  function renderField(step: ProgressiveStep, index: number) {
    const error = errors[step.id];
    const shouldFocus = index === 0;

    if (step.kind === "password") {
      return (
        <Input
          autoFocus={shouldFocus}
          id={`acquisition-${step.id}`}
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(error)}
          className="h-10 rounded-md px-3"
          disabled={isResolvingCnpj}
          minLength={8}
          value={password}
          onBlur={() => {
            if (isBackPointerDown.current) return;
            void advanceSection({ sourceStepId: step.id });
          }}
          onChange={(event) => {
            setPassword(event.target.value);
            clearError(step.id);
          }}
        />
      );
    }

    if (step.kind === "confirm-password") {
      return (
        <Input
          autoFocus={shouldFocus}
          id={`acquisition-${step.id}`}
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(error)}
          className="h-10 rounded-md px-3"
          disabled={isResolvingCnpj}
          minLength={8}
          value={confirmPassword}
          onBlur={(event) => {
            if (isBackPointerDown.current) return;
            void advanceSection({
              nextConfirmPassword: event.target.value,
              sourceStepId: step.id,
            });
          }}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            clearError(step.id);
          }}
        />
      );
    }

    const fieldId = step.field.id;

    if (step.field.type === "textarea") {
      return (
        <textarea
          autoFocus={shouldFocus}
          id={`acquisition-${step.id}`}
          value={values[fieldId] ?? ""}
          placeholder={step.field.placeholder ?? undefined}
          aria-invalid={Boolean(error)}
          disabled={isResolvingCnpj}
          className={textareaClasses(
            error
              ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
              : undefined,
          )}
          onBlur={(event) => {
            if (isBackPointerDown.current) return;
            const nextValues = { ...values, [fieldId]: event.target.value };
            void advanceSection({ nextValues, sourceStepId: step.id });
          }}
          onChange={(event) => updateValue(fieldId, event.target.value)}
        />
      );
    }

    if (step.field.type === "select" && step.field.options) {
      return (
        <Select
          value={values[fieldId] ?? ""}
          items={step.field.options.map((option) => ({
            value: option,
            label: option,
          }))}
          onValueChange={(value) => {
            if (typeof value !== "string") return;

            const nextValues = { ...values, [fieldId]: value };
            setValues(nextValues);
            clearError(fieldId);
            void advanceSection({ nextValues, sourceStepId: step.id });
          }}
        >
          <SelectTrigger
            autoFocus={shouldFocus}
            id={`acquisition-${step.id}`}
            aria-invalid={Boolean(error)}
            disabled={isResolvingCnpj}
            className={cn(
              error &&
                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {step.field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        autoFocus={shouldFocus}
        id={`acquisition-${step.id}`}
        type={inputType(step.field)}
        autoComplete={autoCompleteValue(step.field)}
        value={values[fieldId] ?? ""}
        placeholder={step.field.placeholder ?? undefined}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-10 rounded-md px-3",
          error &&
            "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
        )}
        disabled={isResolvingCnpj}
        inputMode={fieldId === "cnpj" ? "numeric" : undefined}
        maxLength={fieldId === "cnpj" ? 18 : undefined}
        onBlur={(event) => {
          if (isBackPointerDown.current) return;
          const nextValues = { ...values, [fieldId]: event.target.value };
          void advanceSection({ nextValues, sourceStepId: step.id });
        }}
        onChange={(event) => updateValue(fieldId, event.target.value)}
      />
    );
  }

  return (
    <form
      className="grid h-[370px] grid-rows-[auto_1fr_auto] gap-4"
      noValidate
      onSubmit={handleFormSubmit}
    >
      <div className="grid gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Informações do cadastro</span>
          <span className="tabular-nums">
            {currentSectionIndex + 1} de {sections.length}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Progresso do cadastro"
          aria-valuemin={1}
          aria-valuemax={sections.length}
          aria-valuenow={currentSectionIndex + 1}
          className="h-1 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-transform duration-200 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(${progress - 100}%)` }}
          />
        </div>
      </div>

      <div
        key={currentSection.map((step) => step.id).join("-")}
        className="grid min-h-0 grid-cols-1 content-start gap-3 overflow-y-auto overscroll-contain pr-1"
      >
        {currentSection.map((step, index) => {
          const error = errors[step.id];

          return (
            <div key={step.id} className="grid gap-1.5">
              <label
                htmlFor={`acquisition-${step.id}`}
                className="text-sm font-medium text-foreground"
              >
                {step.kind === "campaign" ? step.field.label : step.label}
                {step.kind === "campaign" && step.field.required ? (
                  <span className="text-muted-foreground"> *</span>
                ) : null}
              </label>
              {renderField(step, index)}
              {error ? (
                <p className="text-xs font-medium text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}

        {submitError ? (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {submitError}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          data-acquisition-back="true"
          variant="ghost"
          size="lg"
          className="h-10 px-3"
          disabled={
            isSubmitting ||
            isResolvingCnpj ||
            (currentSectionIndex === 0 && !onFirstBack)
          }
          onPointerCancel={() => {
            isBackPointerDown.current = false;
          }}
          onPointerDown={() => {
            isBackPointerDown.current = true;
          }}
          onClick={goBack}
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        <p className="text-right text-xs leading-4 text-muted-foreground" aria-live="polite">
          {isSubmitting
            ? submittingLabel
            : isResolvingCnpj
              ? "Consultando CNPJ"
            : "O próximo bloco aparece ao concluir estes campos."}
        </p>
      </div>
    </form>
  );
}

export type { AcquisitionProgressiveFormValues };
