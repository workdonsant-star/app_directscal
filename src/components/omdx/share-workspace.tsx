"use client";

import { ArrowLeft, CalendarDays, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ResponseCounters } from "@/components/omdx/response-counters";
import { ShareLinks } from "@/components/omdx/share-links";
import { StatusBadge } from "@/components/omdx/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Diagnostic, DiagnosticStatus, RespondentGroup } from "@/lib/types";

type ShareWorkspaceProps = {
  diagnostic: Diagnostic;
};

export function ShareWorkspace({ diagnostic }: ShareWorkspaceProps) {
  const [status, setStatus] = useState<DiagnosticStatus>(diagnostic.status);
  const [copiedGroup, setCopiedGroup] = useState<RespondentGroup | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isClosed = status === "encerrado";

  async function handleCopy(group: RespondentGroup, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedGroup(group);
      setNotice("Link copiado para a área de transferência.");

      window.setTimeout(() => {
        setCopiedGroup((current) => (current === group ? null : current));
      }, 1800);
    } catch {
      setNotice("Não foi possível copiar automaticamente. Selecione o link e copie manualmente.");
    }
  }

  function handleCloseCollection() {
    setStatus("encerrado");
    setCopiedGroup(null);
    setNotice("Coleta encerrada nesta sessão mockada.");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex max-w-3xl flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-foreground">
              Compartilhar diagnóstico
            </h1>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {diagnostic.name} para {diagnostic.company}. Use os links por grupo
            para preservar a leitura entre fundador, liderança e operação.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>Empresa: {diagnostic.company}</span>
            <span className="hidden sm:inline">/</span>
            <span>
              Prazo: {diagnostic.deadline ? diagnostic.deadline : "sem prazo"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" render={<Link href="/omdx/diagnosticos" />}>
            <ArrowLeft className="size-4" />
            Voltar para diagnósticos
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isClosed}
            onClick={handleCloseCollection}
          >
            <Lock className="size-4" />
            Encerrar coleta
          </Button>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border bg-card px-3 py-2 text-sm text-foreground">
          {notice}
        </div>
      )}

      {isClosed && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Coleta encerrada</CardTitle>
            <CardDescription>
              Estado mockado aplicado apenas nesta sessão.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Os links ficam visíveis para referência, mas não devem receber
              novas respostas. Recarregar a página restaura o estado vindo dos
              mocks.
            </p>
          </CardContent>
        </Card>
      )}

      <ResponseCounters diagnostic={diagnostic} status={status} />

      <ShareLinks
        diagnostic={diagnostic}
        disabled={isClosed}
        copiedGroup={copiedGroup}
        onCopy={handleCopy}
      />
    </div>
  );
}
