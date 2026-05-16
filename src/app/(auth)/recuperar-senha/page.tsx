import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { PasswordResetForm } from "@/components/auth/password-reset-form";
import {
  authSessionCookieName,
  getAuthSessionFromCookie,
} from "@/lib/auth/mock-auth";
import { getSignedInRedirectPath } from "@/lib/auth/navigation";

export const metadata: Metadata = {
  title: "Recuperar senha — Directscal OMDx",
};

export default async function PasswordResetPage() {
  const cookieStore = await cookies();
  const session = getAuthSessionFromCookie(
    cookieStore.get(authSessionCookieName)?.value,
  );

  if (session) {
    redirect(getSignedInRedirectPath(session.user));
  }

  return (
    <AuthPageShell
      title="Recupere o acesso"
      description="Informe o e-mail da conta para iniciar a recuperação de senha."
    >
      <PasswordResetForm />
    </AuthPageShell>
  );
}
