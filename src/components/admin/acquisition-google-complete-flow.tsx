"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  AcquisitionProgressiveForm,
  type AcquisitionProgressiveFormValues,
} from "@/components/admin/acquisition-progressive-form";
import { AuthLegalNotice } from "@/components/auth/auth-legal-notice";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import type {
  AcquisitionCampaign,
  AcquisitionFormField,
  AdminModule,
  AuthUser,
} from "@/lib/types";

type AcquisitionGoogleCompleteFlowProps = {
  campaign: AcquisitionCampaign | null;
  selectedModule: AdminModule | null;
  slug: string;
  user: AuthUser;
};

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
            (field) =>
              field.id !== "nome" &&
              field.id !== "email" &&
              field.id !== "empresa",
          )
        : [],
    [campaign],
  );
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

  async function handleSubmit({ values }: AcquisitionProgressiveFormValues) {
    setSubmitError(null);

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
      contentAlignment="center"
      title="Complete seu acesso"
      description={`Você entrou como ${user.email}. Informe os dados da empresa para liberar seu ambiente de cliente.`}
      visualVariant="app"
    >
      <div className="grid gap-4">
        <AcquisitionProgressiveForm
          fields={fields}
          isSubmitting={isSubmitting}
          onFirstBack={() => router.push(`/a/${slug}`)}
          onSubmit={handleSubmit}
          submitError={submitError}
          submittingLabel="Liberando acesso"
        />
        <AuthLegalNotice />
      </div>
    </AuthPageShell>
  );
}
