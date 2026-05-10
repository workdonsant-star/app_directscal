"use client";

import Image from "next/image";
import { type FormEvent, useMemo, useState } from "react";

import { useAdminData } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitAcquisitionLead } from "@/lib/data/admin-data-source";
import type { AcquisitionFormField, Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

type AcquisitionPublicFlowProps = {
  token: string;
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

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sortedFields(fields: AcquisitionFormField[]) {
  return [...fields].sort((a, b) => a.order - b.order);
}

export function AcquisitionPublicFlow({ token }: AcquisitionPublicFlowProps) {
  const { campaigns, modules } = useAdminData();
  const campaign = campaigns.find((item) => item.token === token);
  const selectedModule = campaign
    ? modules.find((item) => item.id === campaign.moduleId)
    : undefined;
  const fields = useMemo(
    () => (campaign ? sortedFields(campaign.fields) : []),
    [campaign],
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedLead, setSubmittedLead] = useState<Lead | null>(null);

  if (!campaign || !selectedModule) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>
              Este link de aquisição não foi encontrado ou não está disponível
              nesta prévia.
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

  if (campaign.status === "pausado") {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Campanha pausada</CardTitle>
            <CardDescription>
              Este link existe, mas a campanha não está ativa neste momento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              A equipe Directscal pode reativar o acesso ou enviar um novo link.
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
      } else if (field.type === "email" && value && !validateEmail(value)) {
        nextErrors[field.id] = "Informe um e-mail válido";
      }
    });

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) return;

    const lead = submitAcquisitionLead({ token, values });
    setSubmittedLead(lead);
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/directscal-logo.svg"
              alt="Directscal"
              width={142}
              height={16}
              priority
              className="h-4 w-auto object-contain dark:hidden"
            />
            <Image
              src="/directscal-logo-dark.svg"
              alt="Directscal"
              width={142}
              height={16}
              priority
              className="hidden h-4 w-auto object-contain dark:block"
            />
          </div>
          <span className="text-muted-foreground text-xs font-medium">
            {selectedModule.shortName}
          </span>
        </div>

        {submittedLead ? (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Acesso de teste liberado</CardTitle>
              <CardDescription>
                {submittedLead.companyName} foi registrada para conhecer o{" "}
                {selectedModule.shortName}.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.08em]">
                    Módulo
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {selectedModule.shortName}
                  </p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.08em]">
                    Tempo estimado
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    8 a 10 minutos
                  </p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.08em]">
                    Próximo passo
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    Análise consultiva
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  O OMDx mede maturidade operacional em cultura, visão,
                  comunicação, processos, liderança e performance. Nesta prévia,
                  o acesso é demonstrativo e não cria uma conta real.
                </p>
                <p>
                  A equipe Directscal usa este cadastro para qualificar o
                  contexto da empresa e orientar o melhor próximo passo.
                </p>
              </div>

              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-sm font-medium text-foreground">
                  Cadastro recebido
                </p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  O lead já aparece na visão de superadmin deste navegador.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>{campaign.name}</CardTitle>
              <CardDescription>
                Preencha os dados para acessar uma prévia do{" "}
                {selectedModule.shortName}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                {fields.map((field) => {
                  const error = errors[field.id];

                  return (
                    <div key={field.id} className="flex flex-col gap-2">
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

                <div className="flex justify-end pt-2">
                  <Button type="submit">Acessar prévia</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
