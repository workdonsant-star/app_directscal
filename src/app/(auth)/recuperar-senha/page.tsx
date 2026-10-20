import type { Metadata } from "next";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

export const metadata: Metadata = {
  title: "Recuperar senha — Directscal Maturidade",
  referrer: "no-referrer",
};

export default async function PasswordResetPage() {
  return (
    <AuthPageShell
      title="Recupere o acesso"
      description="Informe o e-mail da conta para iniciar a recuperação de senha."
      visualVariant="app"
    >
      <PasswordResetForm />
    </AuthPageShell>
  );
}
