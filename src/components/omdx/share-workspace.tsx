"use client";

import { ArrowLeft, CalendarDays, Download, Lock } from "lucide-react";
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
import {
  canGenerateDiagnosticActionPlan,
  canGenerateDiagnosticReport,
} from "@/lib/data/omdx-data-source";
import type { Diagnostic, DiagnosticStatus, RespondentGroup } from "@/lib/types";

type ShareWorkspaceProps = {
  diagnostic: Diagnostic;
};

export function ShareWorkspace({ diagnostic }: ShareWorkspaceProps) {
  const [status, setStatus] = useState<DiagnosticStatus>(diagnostic.status);
  const [copiedGroup, setCopiedGroup] = useState<RespondentGroup | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isClosed = status === "encerrado";
  const canDownloadReport = canGenerateDiagnosticReport(diagnostic);
  const canDownloadActionPlan = canGenerateDiagnosticActionPlan(diagnostic);

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
          <StatusBadge status={status} />
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
          {canDownloadReport && (
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href={`/omdx/${diagnostic.id}/relatorio`} />}
            >
              <Download className="size-4" />
              Baixar relatório
            </Button>
          )}
          {canDownloadActionPlan && (
            <Button
              variant="outline"
              nativeButton={false}
              render={<a href={`/omdx/${diagnostic.id}/action-points`} />}
            >
              <Download className="size-4" />
              Baixar action points
            </Button>
          )}
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
