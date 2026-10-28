"use client";

import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { useDemo } from "./demo-store";
import { DiagnosticsWorkspace } from "@/components/omdx/diagnostics-workspace";
import { PublicResponseForm } from "@/components/omdx/public-response-form";
import { PublicResponseState } from "@/components/omdx/public-response-state";
import { Badge } from "@/components/ui/badge";
import { demoDiagnostics, demoResponseWorkspace, demoSectors, demoShareLinks, demoTemplate, demoUser } from "@/lib/data/demo/demo-workspaces";

export function DemoSurveys() {
 const { state } = useDemo();
 return <DiagnosticsWorkspace currentUserId={demoUser.id} currentUserEmail="marina@vertex.example" currentUserRole="cliente" organizationName={demoUser.company} diagnostics={demoDiagnostics(state)} sectors={state.sectors ?? demoSectors} shareLinksByDiagnosticId={demoShareLinks(state, typeof window === "undefined" ? undefined : window.location.origin)} template={demoTemplate} />;
}
export function DemoResponse({ token }: { token: string }) {
 const { state } = useDemo();
 const workspace = demoResponseWorkspace(state, token);
 if (!workspace || workspace.diagnostic.status !== "ativo") return <PublicResponseState title="Coleta indisponível" description="Este diagnóstico não está ativo para novas respostas." />;
 return <main className="min-h-dvh bg-background"><nav className="border-b bg-background"><div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-3 px-4"><div className="shrink-0"><Image src="/directscal-logo.svg" alt="Directscal" width={132} height={28} priority className="dark:hidden" style={{ height: "auto", width: "132px" }} /><Image src="/directscal-logo-dark.svg" alt="Directscal" width={132} height={28} priority className="hidden dark:block" style={{ height: "auto", width: "132px" }} /></div><div className="flex flex-wrap items-center justify-end gap-2"><Badge variant="outline">Maturidade</Badge><Badge variant="outline"><ShieldCheck aria-hidden="true" className="size-3" />Resposta anônima</Badge></div></div></nav><div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-10 pt-10 md:pt-12"><header className="flex flex-col gap-2"><p className="text-sm font-medium text-primary">Diagnóstico de maturidade operacional</p><h1 className="text-2xl font-medium tracking-normal text-foreground md:text-3xl">{workspace.diagnostic.name}</h1><p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{workspace.diagnostic.company} está coletando percepções para identificar gargalos de execução, alinhamento e foco operacional.</p></header><PublicResponseForm questionOrderSeed={token} workspace={workspace} alreadySubmitted={state.responseTokens.includes(token)} /></div></main>;
}
