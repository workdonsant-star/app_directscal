"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type SlackConnection = {
  teamName: string | null;
  installedAt: string;
} | null;

const resultMessages: Record<string, string> = {
  conectado: "Slack conectado. Mencione o app em um canal ou envie uma mensagem direta.",
  erro: "Não foi possível concluir a conexão com o Slack. Tente novamente.",
  indisponivel: "A integração com o Slack não está configurada para este ambiente.",
};

export function SlackIntegrationSettings({
  available,
  connection,
  result,
}: {
  available: boolean;
  connection: SlackConnection;
  result: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultMessage = result ? resultMessages[result] : null;

  async function disconnect() {
    try {
      setPending(true);
      setError(null);
      const response = await fetch("/api/integrations/slack/installation", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error();

      router.replace("/configuracoes");
      router.refresh();
    } catch {
      setError("Não foi possível desconectar o Slack.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="min-w-0 bg-surface-sidebar ring-0">
      <CardContent className="grid min-w-0 gap-5 px-5">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-heading text-[17px] leading-6 font-semibold">Slack</h2>
            <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">
              O time pergunta ao agente da Directscal direto no Slack. As respostas usam
              apenas os ativos publicados para a empresa e sempre citam a fonte.
            </p>
          </div>
          {connection ? (
            <Button variant="outline" disabled={pending} onClick={disconnect}>
              {pending ? "Desconectando" : "Desconectar"}
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={!available}
              nativeButton={false}
              render={<a href="/api/integrations/slack/install" />}
            >
              Conectar Slack
            </Button>
          )}
        </div>

        <p className="text-sm">
          {connection ? (
            <>
              Conectado ao workspace{" "}
              <span className="font-medium">{connection.teamName ?? "sem nome"}</span> desde{" "}
              <span className="tabular-nums">
                {new Date(connection.installedAt).toLocaleDateString("pt-BR")}
              </span>
              .
            </>
          ) : available ? (
            <span className="text-muted-foreground">Nenhum workspace conectado.</span>
          ) : (
            <span className="text-muted-foreground">
              A conexão fica disponível depois que a Directscal habilitar o app do Slack.
            </span>
          )}
        </p>

        {resultMessage || error ? (
          <p role="status" className="text-sm text-muted-foreground">
            {error ?? resultMessage}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
