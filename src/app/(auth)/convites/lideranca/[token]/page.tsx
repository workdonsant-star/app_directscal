import type { Metadata } from "next";
import Link from "next/link";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { LeadershipInvitationGoogleAction } from "@/components/auth/leadership-invitation-google-action";
import { Badge } from "@/components/ui/badge";
import { getLeadershipInvitationPreview } from "@/lib/data/organization-structure-data-source";

export const metadata: Metadata = {
  title: "Convite de liderança — Directscal",
};

function formatExpiration(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getAuthErrorMessage(error?: string) {
  if (error === "conta-google") {
    return "A conta Google escolhida não corresponde ao e-mail deste convite.";
  }

  if (error === "sessao-google") {
    return "Havia outra sessão aberta. Escolha novamente a conta Google do convite.";
  }

  if (error === "confirmacao") {
    return "Não foi possível concluir a confirmação. Tente novamente pelo convite.";
  }

  return null;
}

function getAccessDescription(accessLevel: "owner" | "admin") {
  return accessLevel === "owner"
    ? "Acesso completo, incluindo configurações e contratos da empresa."
    : "Acesso às funcionalidades da empresa, sem configurações e contratos.";
}

export default async function LeadershipInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { token } = await params;
  const { erro } = await searchParams;
  const invitation = await getLeadershipInvitationPreview(token);
  const authError = getAuthErrorMessage(erro);

  if (!invitation) {
    return (
      <AuthPageShell
        title="Este convite não está mais disponível"
        description="O link pode ter expirado ou ter sido substituído por um novo envio."
        visualVariant="app"
      >
        <Link
          href="/entrar"
          className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          Ir para o login
        </Link>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title="Você foi indicado como liderança"
      description={`${invitation.companyName} incluiu você na estrutura usada pelo diagnóstico de maturidade.`}
      visualVariant="app"
    >
      <div className="grid gap-5">
        <Badge variant="outline" className="w-fit">
          Convite válido
        </Badge>

        <dl className="grid gap-4 rounded-lg border p-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Setor</dt>
            <dd className="mt-1 font-medium">{invitation.sectorName}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Cargo</dt>
            <dd className="mt-1 font-medium">{invitation.leaderPosition}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Nível de acesso</dt>
            <dd className="mt-1 font-medium">
              {invitation.accessLevel === "owner" ? "Superadmin" : "Admin"}
            </dd>
            <dd className="mt-1 text-muted-foreground">
              {getAccessDescription(invitation.accessLevel)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Conta Google</dt>
            <dd className="mt-1 break-all font-medium">
              {invitation.leaderEmail}
            </dd>
          </div>
        </dl>

        <p className="text-sm leading-6 text-muted-foreground">
          Esta conta Google será usada para confirmar seu nome e sua foto. Após
          a confirmação, você entrará no painel com o acesso indicado acima. O
          convite é válido até {" "}
          {formatExpiration(invitation.expiresAt)}.
        </p>

        {authError ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm leading-5 text-destructive"
            role="alert"
          >
            {authError}
          </p>
        ) : null}

        <LeadershipInvitationGoogleAction
          invitedEmail={invitation.leaderEmail}
          token={token}
        />
      </div>
    </AuthPageShell>
  );
}
