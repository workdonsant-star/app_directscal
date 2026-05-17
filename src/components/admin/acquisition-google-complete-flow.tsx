"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  token: string;
  user: AuthUser;
};

function AcquisitionBackgroundVideo({ className }: { className: string }) {
  return (
    <video
      aria-hidden="true"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className={className}
    >
      <source src="/liquid_background.mp4" type="video/mp4" />
    </video>
  );
}

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
  token,
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
      <main className="flex min-h-dvh items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>
              Este link de aquisição não foi encontrado ou não está disponível.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Solicite um novo link para a equipe Directscal.
            </p>
          </CardContent>
        </Card>
      </main>
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
        body: JSON.stringify({ token, values }),
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
    <main className="min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-[minmax(380px,0.92fr)_minmax(0,1.08fr)]">
      <section className="flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
        <div className="w-full max-w-[420px]">
          <Link
            href="/"
            aria-label="Directscal"
            className="mb-10 inline-flex rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <picture>
              <source
                srcSet="/directscal-logo-dark.svg"
                media="(prefers-color-scheme: dark)"
              />
              <img
                src="/directscal-logo.svg"
                alt="Directscal"
                className="h-5 w-auto"
              />
            </picture>
          </Link>

          <div className="mb-8 overflow-hidden rounded-lg border bg-muted/20 lg:hidden">
            <AcquisitionBackgroundVideo className="aspect-[16/10] w-full object-cover" />
          </div>

          <div className="mb-7">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.08em]">
              {selectedModule.shortName}
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.01em] text-foreground">
              Complete o acesso
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Você entrou como {user.email}. Informe os dados da empresa para
              liberar o ambiente de cliente.
            </p>
          </div>

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

            <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
              {isSubmitting ? "Liberando acesso" : "Entrar no OMDx"}
            </Button>
          </form>
        </div>
      </section>
      <aside className="hidden min-h-dvh border-l bg-muted/20 lg:block">
        <AcquisitionBackgroundVideo className="h-dvh w-full object-cover" />
      </aside>
    </main>
  );
}
