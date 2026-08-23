"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AcquisitionCampaign,
  AcquisitionFormField,
  AdminModule,
  AuthUser,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type AcquisitionGoogleCompleteFlowProps = {
  campaign: AcquisitionCampaign | null;
  selectedModule: AdminModule | null;
  slug: string;
  user: AuthUser;
};

function textareaClasses(className?: string) {
  return cn(
    "border-input bg-transparent text-foreground min-h-24 w-full rounded-lg border px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
    className,
  );
}

function inputType(field: AcquisitionFormField) {
  if (field.type === "email") return "email";
  if (field.type === "phone") return "tel";
  if (field.type === "number") return "number";
  return "text";
}

function sortedFields(fields: AcquisitionFormField[]) {
  return [...fields].sort((a, b) => a.order - b.order);
}

async function getResponseMessage(response: Response, fallback: string) {
  const data: unknown = await response.json().catch(() => null);

  if (data && typeof data === "object" && "message" in data) {
    const message = data.message;

    if (typeof message === "string") return message;
  }

  return fallback;
}

export function AcquisitionGoogleCompleteFlow({
  campaign,
  selectedModule,
  slug,
  user,
}: AcquisitionGoogleCompleteFlowProps) {
  const router = useRouter();
  const fields = useMemo(
    () =>
      campaign
        ? sortedFields(campaign.fields).filter(
            (field) => field.id !== "nome" && field.id !== "email",
          )
        : [],
    [campaign],
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!campaign || !selectedModule) {
    return (
      <AuthPageShell
        title="Link inválido"
        description="Este link de aquisição não foi encontrado ou não está disponível."
        visualVariant="app"
      >
        <p className="text-xs leading-[18px] text-muted-foreground">
          Solicite um novo link para a equipe Directscal.
        </p>
      </AuthPageShell>
    );
  }

  function updateValue(fieldId: string, value: string) {
    setValues((current) => ({ ...current, [fieldId]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = values[field.id]?.trim() ?? "";

      if (field.required && !value) {
        nextErrors[field.id] = "Campo obrigatório";
      }
    });

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/acquisition/google-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, values }),
      });

      if (!response.ok) {
        setSubmitError(
          await getResponseMessage(
            response,
            "Não foi possível completar o acesso.",
          ),
        );
        setIsSubmitting(false);
        return;
      }

      router.push("/omdx");
      router.refresh();
    } catch {
      setSubmitError("Não foi possível completar o acesso agora.");
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      contentAlignment="start"
      title="Complete seu acesso"
      description={`Você entrou como ${user.email}. Informe os dados da empresa para liberar seu ambiente de cliente.`}
      visualVariant="app"
    >
          <form className="grid gap-5" noValidate onSubmit={handleSubmit}>
            {fields.map((field) => {
              const error = errors[field.id];

              return (
                <div key={field.id} className="grid gap-2">
                  <label
                    htmlFor={field.id}
                    className="text-sm font-medium text-foreground"
                  >
                    {field.label}
                    {field.required && (
                      <span className="text-muted-foreground"> *</span>
                    )}
                  </label>

                  {field.type === "textarea" ? (
                    <textarea
                      id={field.id}
                      value={values[field.id] ?? ""}
                      placeholder={field.placeholder ?? undefined}
                      className={textareaClasses(
                        error
                          ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                          : undefined,
                      )}
                      onChange={(event) =>
                        updateValue(field.id, event.target.value)
                      }
                    />
                  ) : field.type === "select" && field.options ? (
                    <Select
                      value={values[field.id] ?? ""}
                      items={field.options.map((option) => ({
                        value: option,
                        label: option,
                      }))}
                      onValueChange={(value) => {
                        if (typeof value === "string") {
                          updateValue(field.id, value);
                        }
                      }}
                    >
                      <SelectTrigger
                        id={field.id}
                        className={cn(
                          "h-11 rounded-md px-3",
                          error &&
                            "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.id}
                      type={inputType(field)}
                      value={values[field.id] ?? ""}
                      placeholder={field.placeholder ?? undefined}
                      aria-invalid={Boolean(error)}
                      className="h-11 rounded-md px-3"
                      onChange={(event) =>
                        updateValue(field.id, event.target.value)
                      }
                    />
                  )}

                  {error && (
                    <p className="text-xs font-medium text-destructive">
                      {error}
                    </p>
                  )}
                </div>
              );
            })}

            {submitError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {submitError}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="h-[45px] w-full text-sm font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Liberando acesso" : "Acessar Maturidade"}
            </Button>
          </form>
    </AuthPageShell>
  );
}
