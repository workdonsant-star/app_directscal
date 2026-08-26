"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  AcquisitionProgressiveForm,
  type AcquisitionProgressiveFormValues,
} from "@/components/admin/acquisition-progressive-form";
import { AuthLegalNotice } from "@/components/auth/auth-legal-notice";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { Button } from "@/components/ui/button";
import type {
  AcquisitionCampaign,
  AcquisitionFormField,
  AdminModule,
} from "@/lib/types";

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
    () =>
      campaign
        ? sortedFields(campaign.fields).filter(
            (field) => field.id !== "empresa",
          )
        : [],
    [campaign],
  );
  const [authError, setAuthError] = useState<string | null>(initialAuthError);
  const [step, setStep] = useState<AcquisitionStep>("choice");
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);

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

  async function handleRegisterSubmit({
    password,
    values,
  }: AcquisitionProgressiveFormValues) {
    setAuthError(null);

    setIsRegisterSubmitting(true);

    try {
      const response = await fetch("/api/acquisition/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: password ?? "",
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
        password: password ?? "",
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
      contentAlignment="center"
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

          <AuthLegalNotice />

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
        <div className="grid gap-4">
          <AcquisitionProgressiveForm
            fields={fields}
            includePassword
            isSubmitting={isRegisterSubmitting}
            onFirstBack={handleChoiceStep}
            onSubmit={handleRegisterSubmit}
            submitError={authError}
            submittingLabel="Criando acesso"
          />
          <AuthLegalNotice />
        </div>
      )}
    </AuthPageShell>
  );
}
