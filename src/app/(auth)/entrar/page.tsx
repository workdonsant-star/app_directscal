import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import {
  isDevPasswordLoginEnabled,
  isGoogleAuthConfigured,
} from "@/lib/auth/access-control";
import { getSignedInRedirectPath } from "@/lib/auth/navigation";
import { getCurrentAuthSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Entrar — Directscal OMDx",
};

function getAuthErrorMessage(error?: string | string[]) {
  const errorCode = Array.isArray(error) ? error[0] : error;

  if (errorCode === "AccessDenied") {
    return "Este e-mail não está autorizado para acessar o OMDx.";
  }

  if (errorCode) {
    return "Não foi possível concluir a entrada com Google.";
  }

  return null;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string | string[] }>;
}) {
  const session = await getCurrentAuthSession();

  if (session) {
    redirect(getSignedInRedirectPath(session.user));
  }

  const resolvedSearchParams = await searchParams;

  return (
    <AuthPageShell
      title="Acesse sua conta"
    >
      <SignInForm
        authErrorMessage={getAuthErrorMessage(resolvedSearchParams?.error)}
        googleUnavailableMessage={
          isGoogleAuthConfigured()
            ? null
            : "Google ainda não está configurado neste ambiente."
        }
        passwordLoginEnabled={isDevPasswordLoginEnabled()}
      />
    </AuthPageShell>
  );
}
