import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { isDevPasswordLoginEnabled } from "@/lib/auth/access-control";
import { getSignedInRedirectPath } from "@/lib/auth/navigation";
import { getCurrentAuthSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Criar conta — Directscal Maturidade",
};

export default async function SignUpPage() {
  if (!isDevPasswordLoginEnabled()) {
    redirect("/entrar");
  }

  const session = await getCurrentAuthSession();

  if (session) {
    redirect(getSignedInRedirectPath(session.user));
  }

  return (
    <AuthPageShell
      title="Crie seu acesso"
      description="Registre uma conta para navegar pela operação mockada de Maturidade."
    >
      <SignUpForm />
    </AuthPageShell>
  );
}
