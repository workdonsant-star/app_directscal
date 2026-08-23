"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

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
} from "@/lib/types";
import { cn } from "@/lib/utils";

type AcquisitionPublicFlowProps = {
  campaign: AcquisitionCampaign | null;
  initialAuthError?: string | null;
  selectedModule: AdminModule | null;
  slug: string;
};

type AcquisitionStep = "choice" | "email";

async function getResponseMessage(response: Response, fallback: string) {
  const data: unknown = await response.json().catch(() => null);

  if (data && typeof data === "object" && "message" in data) {
    const message = data.message;

    if (typeof message === "string") return message;
  }

  return fallback;
}

export async function startCampaignGoogleSignIn({
  createIntent,
  slug,
  signInWithGoogle,
  signOutCurrentSession,
}: {
  createIntent: () => Promise<Response>;
  slug: string;
  signInWithGoogle: (callbackUrl: string) => Promise<unknown>;
  signOutCurrentSession: () => Promise<unknown>;
}) {
  const response = await createIntent();

  if (!response.ok) {
    return {
      message: await getResponseMessage(
        response,
        "Não foi possível iniciar a entrada com Google.",
      ),
      ok: false,
    } as const;
  }

  const data: unknown = await response.json().catch(() => null);
  const callbackCandidate =
    data && typeof data === "object"
      ? (data as { callbackUrl?: unknown }).callbackUrl
      : null;
  const callbackUrl =
    typeof callbackCandidate === "string"
      ? callbackCandidate
      : `/a/${slug}/completar`;

  await signOutCurrentSession();
  await signInWithGoogle(callbackUrl);

  return { ok: true } as const;
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

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sortedFields(fields: AcquisitionFormField[]) {
  return [...fields].sort((a, b) => a.order - b.order);
}

export function AcquisitionPublicFlow({
  campaign,
  initialAuthError = null,
  selectedModule,
  slug,
}: AcquisitionPublicFlowProps) {
  const router = useRouter();
  const fields = useMemo(
    () => (campaign ? sortedFields(campaign.fields) : []),
    [campaign],
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(initialAuthError);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<AcquisitionStep>("choice");
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  const [password, setPassword] = useState("");

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

  if (campaign.status === "pausado") {
    return (
      <AuthPageShell
        title="Campanha pausada"
        description="Este link existe, mas a campanha não está ativa neste momento."
        visualVariant="app"
      >
        <p className="text-xs leading-[18px] text-muted-foreground">
          A equipe Directscal pode reativar o acesso ou enviar um novo link.
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
      } else if (field.type === "email" && value && !validateEmail(value)) {
        nextErrors[field.id] = "Informe um e-mail válido";
      }
    });

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleGoogleSignIn() {
    setAuthError(null);
    setIsGoogleSubmitting(true);

    try {
      const result = await startCampaignGoogleSignIn({
        createIntent: () =>
          fetch("/api/acquisition/oauth-intents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
          }),
        signInWithGoogle: (callbackUrl) =>
          signIn("google", { callbackUrl }, { prompt: "select_account" }),
        signOutCurrentSession: () => signOut({ redirect: false }),
        slug,
      });

      if (!result.ok) {
        setAuthError(result.message);
        setIsGoogleSubmitting(false);
        return;
      }
    } catch {
      setAuthError("Não foi possível iniciar a entrada com Google.");
      setIsGoogleSubmitting(false);
    }
  }

  function handleEmailStep() {
    setAuthError(null);
    setStep("email");
  }

  function handleChoiceStep() {
    setAuthError(null);
    setStep("choice");
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);

    if (!validateForm()) return;

    if (password.length < 8) {
      setAuthError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setAuthError("As senhas informadas não conferem.");
      return;
    }

    setIsRegisterSubmitting(true);

    try {
      const response = await fetch("/api/acquisition/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          slug,
          values,
        }),
      });

      if (!response.ok) {
        setAuthError(
          await getResponseMessage(
            response,
            "Não foi possível criar o acesso.",
          ),
        );
        setIsRegisterSubmitting(false);
        return;
      }

      const data = (await response.json()) as { email?: string };
      const signInResult = await signIn("credentials", {
        callbackUrl: "/omdx",
        email: data.email ?? values.email,
        flow: "acquisition",
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setAuthError("Acesso criado, mas não foi possível entrar com a senha.");
        setIsRegisterSubmitting(false);
        return;
      }

      router.push("/omdx");
      router.refresh();
    } catch {
      setAuthError("Não foi possível criar o acesso agora.");
      setIsRegisterSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      contentAlignment={step === "email" ? "start" : "center"}
      title={
        step === "choice"
          ? `Crie seu acesso ao ${selectedModule.shortName}`
          : "Continue com e-mail"
      }
      description={
        step === "choice"
          ? "Escolha como continuar para liberar seu ambiente de cliente."
          : "Preencha os dados da campanha e defina uma senha para criar seu acesso."
      }
      visualVariant="app"
    >
      {step === "choice" ? (
        <div className="grid gap-5">
          <div className="grid gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-[45px] w-full gap-2.5 bg-background text-sm font-normal"
                  disabled={isGoogleSubmitting}
                  onClick={handleGoogleSignIn}
                >
                  <Image
                    src="/auth-figma-google.svg"
                    alt=""
                    width={18}
                    height={18}
                    className="size-4"
                    aria-hidden="true"
                  />
                  {isGoogleSubmitting
                    ? "Abrindo Google"
                    : "Continuar com Google"}
                </Button>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-xs font-normal text-foreground/80 dark:text-muted-foreground">
                  <div className="h-px bg-border" />
                  <span>ou</span>
                  <div className="h-px bg-border" />
                </div>

                <Button
                  type="button"
                  size="lg"
                  className="h-[45px] w-full text-sm font-medium"
                  disabled={isGoogleSubmitting}
                  onClick={handleEmailStep}
                >
                  Continuar com e-mail
                </Button>
          </div>

          {authError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {authError}
            </p>
          ) : null}

          <p className="text-xs leading-[18px] text-muted-foreground">
            Ao continuar, seus dados serão usados para liberar o acesso e
            registrar seu cadastro nesta campanha.
          </p>

          <p className="text-xs leading-[18px] text-muted-foreground">
            Já tem uma conta?{" "}
            <Link
              href="/entrar"
              className="rounded-sm text-foreground/80 underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:text-muted-foreground"
            >
              Entrar
            </Link>
          </p>
        </div>
      ) : (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-5 -ml-2"
            onClick={handleChoiceStep}
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Button>

              <form
                className="grid gap-5"
                noValidate
                onSubmit={handleRegisterSubmit}
              >
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

                <div className="grid gap-2">
                  <label
                    htmlFor="campaign-auth-password"
                    className="text-sm font-medium text-foreground"
                  >
                    Senha
                  </label>
                  <Input
                    id="campaign-auth-password"
                    type="password"
                    autoComplete="new-password"
                    className="h-11 rounded-md px-3"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <label
                    htmlFor="campaign-auth-confirm-password"
                    className="text-sm font-medium text-foreground"
                  >
                    Confirmar senha
                  </label>
                  <Input
                    id="campaign-auth-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    className="h-11 rounded-md px-3"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                </div>

                {authError ? (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {authError}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="h-[45px] w-full text-sm font-medium"
                  disabled={isRegisterSubmitting}
                >
                  {isRegisterSubmitting ? "Criando acesso" : "Criar acesso"}
                </Button>
              </form>
        </>
      )}
    </AuthPageShell>
  );
}
