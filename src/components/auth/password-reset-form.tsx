"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function getResponseMessage(response: Response, fallback: string) {
  const data: unknown = await response.json().catch(() => null);

  if (data && typeof data === "object" && "message" in data) {
    const message = data.message;

    if (typeof message === "string") return message;
  }

  return fallback;
}

export function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const message = await getResponseMessage(
      response,
      "Não foi possível processar a solicitação.",
    );

    if (!response.ok) {
      setError(message);
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage(message);
    setIsSubmitting(false);
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email" className="sr-only">
          E-mail
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          className="h-[45px] px-2.5 text-sm md:text-sm"
          placeholder="Digite seu e-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {successMessage ? (
        <p className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-foreground">
          {successMessage}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        className="h-[45px] w-full text-sm font-medium"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Enviando" : "Enviar instruções"}
      </Button>
      <p className="text-xs leading-[18px] text-muted-foreground">
        Lembrou a senha{" "}
        <Link
          href="/entrar"
          className="rounded-sm text-foreground/80 underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:text-muted-foreground"
        >
          Voltar para entrada
        </Link>
      </p>
    </form>
  );
}
