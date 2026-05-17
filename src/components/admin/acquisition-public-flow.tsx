"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

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
import type {
  AcquisitionCampaign,
  AcquisitionFormField,
  AdminModule,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type AcquisitionPublicFlowProps = {
  campaign: AcquisitionCampaign | null;
  selectedModule: AdminModule | null;
  token: string;
};

type AcquisitionStep = "choice" | "email";

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

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.26h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.55Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.24-2.5c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.6-4.12H3.05v2.58A9.99 9.99 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.4 13.92a6 6 0 0 1 0-3.84V7.5H3.05a10 10 0 0 0 0 9l3.35-2.58Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.96c1.47 0 2.8.51 3.84 1.5l2.86-2.87A9.61 9.61 0 0 0 12 2a9.99 9.99 0 0 0-8.95 5.5l3.35 2.58C7.2 7.72 9.4 5.96 12 5.96Z"
        fill="#EA4335"
      />
    </svg>
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

export async function startCampaignGoogleSignIn({
  createIntent,
  signInWithGoogle,
  signOutCurrentSession,
  token,
}: {
  createIntent: () => Promise<Response>;
  signInWithGoogle: (callbackUrl: string) => Promise<unknown>;
  signOutCurrentSession: () => Promise<unknown>;
  token: string;
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
      : `/a/${token}/completar`;

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
  selectedModule,
  token,
}: AcquisitionPublicFlowProps) {
  const router = useRouter();
  const fields = useMemo(
    () => (campaign ? sortedFields(campaign.fields) : []),
    [campaign],
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<AcquisitionStep>("choice");
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);
  const [password, setPassword] = useState("");

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

  async function handleGoogleSignIn() {
    setAuthError(null);
    setIsGoogleSubmitting(true);

    try {
      const result = await startCampaignGoogleSignIn({
        createIntent: () =>
          fetch("/api/acquisition/oauth-intents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          }),
        signInWithGoogle: (callbackUrl) =>
          signIn("google", { callbackUrl }, { prompt: "select_account" }),
        signOutCurrentSession: () => signOut({ redirect: false }),
        token,
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
          token,
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

          {step === "choice" ? (
            <div className="grid gap-5 text-center">
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.08em]">
                  {selectedModule.shortName}
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-[-0.01em] text-foreground">
                  Acesse a prévia
                </h1>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Escolha como continuar para acessar o{" "}
                  {selectedModule.shortName} como cliente a partir desta
                  campanha.
                </p>
              </div>

              <div className="grid gap-3">
                <Button
                  type="button"
                  className="h-11 w-full gap-2"
                  disabled={isGoogleSubmitting}
                  onClick={handleGoogleSignIn}
                >
                  <GoogleIcon />
                  {isGoogleSubmitting
                    ? "Abrindo Google"
                    : "Continuar com Google"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full bg-background"
                  disabled={isGoogleSubmitting}
                  onClick={handleEmailStep}
                >
                  Continuar com e-mail
                </Button>
              </div>

              {authError ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-left text-sm text-destructive">
                  {authError}
                </p>
              ) : null}

              <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                Ao continuar, seus dados serão usados para liberar o acesso
                inicial e registrar o lead desta campanha.
              </p>

              <p className="text-sm text-muted-foreground">
                Já tem uma conta{" "}
                <Link
                  href="/entrar"
                  className="rounded-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
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

              <div className="mb-7">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.08em]">
                  {selectedModule.shortName}
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-[-0.01em] text-foreground">
                  Continue com e-mail
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Preencha os dados da campanha e defina uma senha para criar o
                  acesso de cliente.
                </p>
              </div>

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
                  className="h-11 w-full"
                  disabled={isRegisterSubmitting}
                >
                  {isRegisterSubmitting ? "Criando acesso" : "Criar acesso"}
                </Button>
              </form>
            </>
          )}
        </div>
      </section>
      <aside className="hidden min-h-dvh border-l bg-muted/20 lg:block">
        <AcquisitionBackgroundVideo className="h-dvh w-full object-cover" />
      </aside>
    </main>
  );
}
