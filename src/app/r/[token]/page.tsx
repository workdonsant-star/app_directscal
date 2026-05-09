import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDiagnosticByResponseToken } from "@/lib/data/omdx-data-source";

export const metadata: Metadata = {
  title: "Responder OMDx — Directscal",
};

type PublicResponsePreviewPageProps = {
  params: Promise<{ token: string }>;
};

export default async function PublicResponsePreviewPage({
  params,
}: PublicResponsePreviewPageProps) {
  const { token } = await params;
  const resolved = getDiagnosticByResponseToken(token);

  if (!resolved) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>
              Este link de resposta não foi encontrado ou não pertence a um
              diagnóstico disponível nesta prévia.
            </CardDescription>
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

  const { diagnostic, group } = resolved;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-2">
            <CardTitle>{diagnostic.name}</CardTitle>
            <CardDescription>
              {diagnostic.company} está coletando percepções sobre maturidade
              operacional.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Grupo
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {group.label}
              </p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Tempo estimado
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                8 a 10 minutos
              </p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Uso das respostas
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                Agregado
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              O OMDx mede a maturidade operacional da empresa a partir de uma
              escala de concordância. A sua resposta ajuda a identificar
              gargalos de execução, alinhamento e foco.
            </p>
            <p>
              As respostas serão analisadas de forma consolidada por grupo. O
              objetivo é orientar decisões de estruturação, não avaliar pessoas
              individualmente.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-sm font-medium text-foreground">
              Formulário em próxima etapa
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Esta é uma prévia mockada da introdução pública. O formulário
              Likert completo será implementado no fluxo do respondente.
            </p>
          </div>

          <div className="flex justify-end">
            <Button disabled>Começar</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
