"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OperationalMemberRegistrationWorkspace } from "@/lib/types";
import { cn } from "@/lib/utils";

type OperationalMemberRegistrationFormProps = {
  workspace: OperationalMemberRegistrationWorkspace;
};

type FormState = {
  area: string;
  email: string;
  name: string;
  operationalRole: string;
  participatesInAreaDecisions: "sim" | "nao";
  perceivedResponsibilities: string;
};

const initialForm: FormState = {
  area: "",
  email: "",
  name: "",
  operationalRole: "",
  participatesInAreaDecisions: "nao",
  perceivedResponsibilities: "",
};

async function getResponseMessage(response: Response, fallback: string) {
  const data: unknown = await response.json().catch(() => null);

  if (data && typeof data === "object" && "message" in data) {
    const message = data.message;

    if (typeof message === "string") return message;
  }

  return fallback;
}

function textareaClasses(className?: string) {
  return cn(
    "border-input bg-transparent text-foreground min-h-24 w-full rounded-lg border px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
    className,
  );
}

export function OperationalMemberRegistrationForm({
  workspace,
}: OperationalMemberRegistrationFormProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function updateField<Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/omdx/operational-members", {
        body: JSON.stringify({
          area: form.area,
          email: form.email,
          name: form.name,
          operationalRole: form.operationalRole,
          participatesInAreaDecisions:
            form.participatesInAreaDecisions === "sim",
          perceivedResponsibilities: form.perceivedResponsibilities,
          token: workspace.token,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(
          await getResponseMessage(
            response,
            "Não foi possível registrar o cadastro.",
          ),
        );
      }

      setSent(true);
      setMessage("Cadastro enviado e aprovado pelo domínio autorizado.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar o cadastro.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border bg-card p-6 text-card-foreground">
        <h1 className="text-xl font-semibold">Cadastro recebido</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Seu papel na operação foi registrado para atualizar o cadastro de
          pessoas da empresa.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-card p-5 text-card-foreground"
    >
      <div>
        <h1 className="text-xl font-semibold">Cadastro de pessoa</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Preencha rapidamente seu papel na operação para atualizar o cadastro
          de pessoas da empresa.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium">
          Nome
          <Input
            required
            autoComplete="name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          E-mail corporativo
          <Input
            required
            autoComplete="email"
            type="email"
            placeholder={`nome@${workspace.authorizedDomain}`}
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Área
          <Input
            required
            value={form.area}
            onChange={(event) => updateField("area", event.target.value)}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Papel operacional
          <Input
            required
            value={form.operationalRole}
            onChange={(event) =>
              updateField("operationalRole", event.target.value)
            }
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Responsabilidades percebidas
          <textarea
            required
            className={textareaClasses()}
            value={form.perceivedResponsibilities}
            onChange={(event) =>
              updateField("perceivedResponsibilities", event.target.value)
            }
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Participa de decisões da área?
          <Select
            value={form.participatesInAreaDecisions}
            onValueChange={(value) =>
              updateField(
                "participatesInAreaDecisions",
                value === "sim" ? "sim" : "nao",
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sim">Sim</SelectItem>
              <SelectItem value="nao">Não</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>

      {message && (
        <p className="mt-4 rounded-lg border bg-background px-3 py-2 text-sm text-foreground">
          {message}
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <Button disabled={submitting} type="submit">
          Enviar cadastro
        </Button>
      </div>
    </form>
  );
}
