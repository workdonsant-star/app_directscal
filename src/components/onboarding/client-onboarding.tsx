"use client";

import { Check, ArrowRight } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OrganizationStructureSettings } from "@/components/settings/organization-structure-settings";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { OrganizationSector } from "@/lib/types";
import type { getClientOnboardingProgress } from "@/lib/data/client-onboarding";
import { cn } from "@/lib/utils";

type Props = {
  connection: { teamName: string | null } | null;
  sectors: OrganizationSector[];
  progress: ReturnType<typeof getClientOnboardingProgress>;
  slackAvailable: boolean;
  slackResult: string | null;
};

export function ClientOnboarding({ connection, sectors, progress, slackAvailable, slackResult }: Props) {
  const router = useRouter();
  const [review, setReview] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const step = !progress.slackReady ? 0 : review && progress.sectorsReady ? 2 : 1;
  const labels = ["Conectar Slack", "Setores e lideranças", "Revisar configuração"];

  async function finish() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/settings/onboarding", { method: "POST" });
      const body = await response.json();
      if (!response.ok) {
        setError(body.message ?? "Não foi possível concluir a configuração.");
        router.refresh();
        return;
      }
      window.location.assign("/omdx");
    } catch {
      setError("Não foi possível concluir a configuração. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    await signOut({ callbackUrl: "/entrar", redirect: false });
    window.location.assign("/entrar");
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="flex h-16 items-center justify-between border-b px-6 lg:px-10">
        <span className="font-heading text-lg font-bold">Directscal</span>
        <div className="flex items-center gap-3"><ThemeToggle /><Button variant="ghost" onClick={logout}>Sair</Button></div>
      </header>
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-10 lg:px-10">
        <div>
          <p className="text-sm text-muted-foreground">Configuração inicial</p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Prepare sua empresa para começar</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Conecte o Slack e organize os setores e suas lideranças. Depois, você poderá acessar todas as funcionalidades disponíveis para sua empresa.</p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3" aria-label="Etapas da configuração">
          {labels.map((label, index) => (
            <li key={label} aria-current={index === step ? "step" : undefined} className={cn("flex items-center gap-3 border-b pb-4 text-sm", index === step ? "border-primary font-medium" : "text-muted-foreground")}>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted tabular-nums">{index < step ? <Check className="size-4" aria-hidden="true" /> : index + 1}</span>{label}
            </li>
          ))}
        </ol>
        {step === 0 ? (
          <section className="grid justify-items-start gap-5">
            <div><h2 className="text-ui-section">Conecte o workspace da empresa</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">O Slack conecta seu time aos ativos de gestão e permite escolher os responsáveis pelos action points. Autorize o app no workspace usado pela empresa.</p></div>
            {connection ? <p className="text-sm">Reconecte {connection.teamName ?? "o workspace"} para conceder as permissões necessárias.</p> : null}
            <Button disabled={!slackAvailable} nativeButton={false} render={<a href="/api/integrations/slack/install" />}>
              {connection ? "Reconectar Slack" : "Conectar Slack"}<ArrowRight aria-hidden="true" />
            </Button>
            {!slackAvailable ? <p role="status" className="text-sm text-muted-foreground">A conexão com o Slack precisa ser habilitada pela Directscal para continuar. Seu progresso será preservado.</p> : null}
            {slackResult === "erro" || slackResult === "indisponivel" ? <p role="alert" className="text-sm text-destructive">Não foi possível conectar o Slack. Verifique sua permissão no workspace e tente novamente.</p> : null}
          </section>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Slack conectado: <span className="font-medium text-foreground">{connection?.teamName ?? "Workspace da empresa"}</span></p>
            {step === 1 ? <>
              <OrganizationStructureSettings sectors={sectors} inlineActions />
              <div className="flex justify-end"><Button disabled={!progress.sectorsReady} onClick={() => setReview(true)}>Revisar configuração<ArrowRight aria-hidden="true" /></Button></div>
            </> : <section className="grid gap-6">
              <div><h2 className="text-ui-section">Confira as lideranças</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Cada setor precisa de uma liderança selecionada no Slack. O cargo é opcional e as pessoas vão atuar pelo workspace conectado.</p></div>
              <OrganizationStructureSettings sectors={sectors} inlineActions />
              {!progress.leadersReady ? <p role="status" className="text-sm text-destructive">Selecione uma pessoa ativa no Slack para cada setor antes de continuar.</p> : null}
              {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
              <div className="flex justify-between gap-4"><Button variant="outline" disabled={pending} onClick={() => setReview(false)}>Voltar</Button><Button disabled={pending || !progress.canComplete} onClick={finish}>{pending ? "Concluindo" : "Concluir e acessar o app"}<ArrowRight aria-hidden="true" /></Button></div>
            </section>}
          </>
        )}
      </main>
    </div>
  );
}
