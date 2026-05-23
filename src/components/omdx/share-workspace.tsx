"use client";

import { ArrowLeft, CalendarDays, Download, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ReportDownloadMenu } from "@/components/omdx/report-download-menu";
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
} from "@/lib/data/omdx-domain";
import type {
  Diagnostic,
  DiagnosticShareLink,
  DiagnosticStatus,
  RespondentGroup,
} from "@/lib/types";

type ShareWorkspaceProps = {
  diagnostic: Diagnostic;
  links: DiagnosticShareLink[];
};

type MutationResponse = {
  message?: string;
};

async function readMutationResponse(response: Response) {
  const data: unknown = await response.json().catch(() => null);

  return data && typeof data === "object" ? (data as MutationResponse) : {};
}

export function ShareWorkspace({ diagnostic, links }: ShareWorkspaceProps) {
  const router = useRouter();
  const [status, setStatus] = useState<DiagnosticStatus>(diagnostic.status);
  const [copiedGroup, setCopiedGroup] = useState<RespondentGroup | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

  async function handleCloseCollection() {
    try {
      setPending(true);
      const response = await fetch(`/api/omdx/diagnostics/${diagnostic.id}/close`, {
        method: "POST",
      });
      const data = await readMutationResponse(response);

      if (!response.ok) {
        throw new Error(data.message ?? "Não foi possível encerrar a coleta.");
      }

      setStatus("encerrado");
      setCopiedGroup(null);
      setNotice("Coleta encerrada no banco.");
      router.refresh();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Não foi possível encerrar a coleta.",
      );
    } finally {
      setPending(false);
    }
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
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/omdx/diagnosticos" />}
          >
            <ArrowLeft className="size-4" />
            Voltar para diagnósticos
          </Button>
          {canDownloadReport && (
            <ReportDownloadMenu
              diagnosticId={diagnostic.id}
              variant="outline"
            />
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
            disabled={isClosed || pending}
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
              Novas respostas ficam bloqueadas para este diagnóstico.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Os links ficam visíveis para referência, mas a API pública não
              aceita novas respostas depois do encerramento.
            </p>
          </CardContent>
        </Card>
      )}

      <ResponseCounters diagnostic={diagnostic} status={status} />

      <ShareLinks
        links={links}
        disabled={isClosed}
        copiedGroup={copiedGroup}
        onCopy={handleCopy}
      />
    </div>
  );
}
