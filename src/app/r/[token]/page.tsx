import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { PublicResponseForm } from "@/components/omdx/public-response-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDiagnosticByResponseToken } from "@/lib/data/omdx-data-source";
import { getResponseCookieName } from "@/lib/data/omdx-production-rules";

export const metadata: Metadata = {
  title: "Responder OMDx — Directscal",
};

type PublicResponsePreviewPageProps = {
  params: Promise<{ token: string }>;
};

function PublicResponseState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="min-w-0 w-full max-w-xs sm:max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Solicite um novo link para a pessoa responsável pela coleta OMDx.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default async function PublicResponsePreviewPage({
  params,
}: PublicResponsePreviewPageProps) {
  const { token } = await params;
  const resolved = await getDiagnosticByResponseToken(token);

  if (!resolved) {
    return (
      <PublicResponseState
        title="Link inválido"
        description="Este link de resposta não foi encontrado ou não pertence a um diagnóstico disponível."
      />
    );
  }

  const { diagnostic, expiresAt } = resolved;
  const cookieStore = await cookies();
  const alreadySubmitted = Boolean(
    cookieStore.get(getResponseCookieName(token))?.value,
  );

  if (alreadySubmitted) {
    redirect(`/r/${token}/obrigado`);
  }

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
  const isAvailable =
    diagnostic.status === "ativo" && !diagnostic.closedAt && !isExpired;

  if (!isAvailable) {
    return (
      <PublicResponseState
        title={isExpired ? "Link expirado" : "Coleta indisponível"}
        description={
          isExpired
            ? "Este link expirou e não aceita novas respostas."
            : "Este diagnóstico não está ativo para novas respostas."
        }
      />
    );
  }

  const questionOrderSeed = randomUUID();

  return (
    <main className="min-h-dvh bg-background">
      <nav className="border-b bg-background">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-3 px-4">
          <div className="shrink-0">
            <Image
              src="/directscal-logo.svg"
              alt="Directscal"
              width={132}
              height={28}
              priority
              className="dark:hidden"
              style={{ height: "auto", width: "132px" }}
            />
            <Image
              src="/directscal-logo-dark.svg"
              alt="Directscal"
              width={132}
              height={28}
              priority
              className="hidden dark:block"
              style={{ height: "auto", width: "132px" }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge variant="outline">OMDx</Badge>
            <Badge variant="outline">
              <ShieldCheck aria-hidden="true" className="size-3" />
              Resposta anônima
            </Badge>
          </div>
        </div>
      </nav>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-10 pt-10 md:pt-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium text-primary">
            Diagnóstico de maturidade operacional
          </p>
          <h1 className="text-2xl font-medium tracking-normal text-foreground md:text-3xl">
            {diagnostic.name}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {diagnostic.company} está coletando percepções para identificar
            gargalos de execução, alinhamento e foco operacional.
          </p>
        </header>

        <PublicResponseForm
          questionOrderSeed={questionOrderSeed}
          workspace={resolved}
        />
      </div>
    </main>
  );
}
