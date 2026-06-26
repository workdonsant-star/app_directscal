import Link from "next/link";

import { OperationalMemberRegistrationForm } from "@/components/omdx/operational-member-registration-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOperationalMemberRegistrationWorkspace } from "@/lib/data/operational-onboarding-data-source";

type OperationalMemberRegistrationPageProps = {
  params: Promise<{ token: string }>;
};

export const metadata = {
  title: "Cadastro de pessoa — Directscal",
};

export default async function OperationalMemberRegistrationPage({
  params,
}: OperationalMemberRegistrationPageProps) {
  const { token } = await params;
  const workspace = await getOperationalMemberRegistrationWorkspace(token);

  if (!workspace) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10 text-foreground">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Este link não é válido ou foi desativado.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <Link
          href="/"
          aria-label="Directscal"
          className="inline-flex w-fit rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <picture>
            <source
              srcSet="/directscal-logo-dark.svg"
              media="(prefers-color-scheme: dark)"
            />
            <img
              src="/directscal-logo-light.svg"
              alt="Directscal"
              className="h-5 w-auto"
            />
          </picture>
        </Link>

        <div className="rounded-lg border bg-card px-4 py-3 text-card-foreground">
          <p className="text-sm font-medium">{workspace.organizationName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Domínio autorizado:{" "}
            <span className="font-mono">{workspace.authorizedDomain}</span>
          </p>
        </div>

        <OperationalMemberRegistrationForm workspace={workspace} />
      </div>
    </main>
  );
}
