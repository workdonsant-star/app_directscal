import type { Metadata } from "next";
import Link from "next/link";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Acesso confirmado — Directscal" };

export default function LeadershipInvitationConfirmedPage() {
  return (
    <AuthPageShell
      description="Seu acesso foi vinculado à empresa que enviou o convite."
      title="Acesso confirmado"
      visualVariant="app"
    >
      <div className="grid gap-4">
        <Badge className="w-fit" variant="outline">
          Usuário ativo
        </Badge>
        <p className="text-sm leading-6 text-muted-foreground">
          Sua identidade Google foi confirmada. Entre no painel para acessar as
          funcionalidades liberadas para o seu perfil.
        </p>
        <Link
          href="/entrar"
          className="inline-flex h-9 w-fit items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          Entrar no painel
        </Link>
      </div>
    </AuthPageShell>
  );
}
