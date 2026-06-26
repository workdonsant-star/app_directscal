import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import {
  isDevPasswordLoginEnabled,
  isGoogleAuthConfigured,
  isSuperadminPasswordLoginEnabled,
} from "@/lib/auth/access-control";
import { getSignedInRedirectPath } from "@/lib/auth/navigation";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Entrar — Directscal Maturidade",
};

function getAuthErrorMessage(error?: string | string[]) {
  const errorCode = Array.isArray(error) ? error[0] : error;

  if (errorCode === "AccessDenied") {
    return "Este e-mail ainda não tem um cadastro ativo no módulo Maturidade.";
  }

  if (errorCode === "OAuthAccountNotLinked") {
    return "Este e-mail ainda não tem um vínculo ativo com Google no módulo Maturidade.";
  }

  if (errorCode === "CallbackRouteError" || errorCode === "Configuration") {
    return "Não foi possível validar a entrada com Google neste ambiente.";
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
  const superadminPasswordLoginEnabled =
    isSuperadminPasswordLoginEnabled() && isSupabaseConfigured();

  return (
    <AuthPageShell
      title={
        <>
          Analise seus dados{" "}
          <br />e controle sua operação
        </>
      }
      description="Acesse o que construímos para sua operação crescer com solidez."
      visualVariant="app"
    >
      <SignInForm
        authErrorMessage={getAuthErrorMessage(resolvedSearchParams?.error)}
        googleUnavailableMessage={
          isGoogleAuthConfigured()
            ? null
            : "Google ainda não está configurado neste ambiente."
        }
        passwordLoginEnabled={
          superadminPasswordLoginEnabled || isDevPasswordLoginEnabled()
        }
        passwordLoginMode={
          superadminPasswordLoginEnabled ? "superadmin" : "dev"
        }
      />
    </AuthPageShell>
  );
}
