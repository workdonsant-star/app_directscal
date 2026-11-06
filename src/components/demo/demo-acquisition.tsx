"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AcquisitionProgressiveForm, type AcquisitionProgressiveFormValues } from "@/components/admin/acquisition-progressive-form";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { Button } from "@/components/ui/button";
import { demoAdminSnapshot } from "@/lib/data/demo/demo-admin-data";
import { registerDemoLead } from "@/lib/data/demo/demo-acquisition";
import { updateDemo, useDemo } from "./demo-store";

export function DemoAcquisition({ slug, googleCompletion = false }: { slug: string; googleCompletion?: boolean }) {
  const router = useRouter();
  const { state } = useDemo();
  const campaign = (state.adminCampaigns ?? demoAdminSnapshot.campaigns).find(item => item.slug === slug);
  const selectedModule = demoAdminSnapshot.modules.find(module => module.id === campaign?.moduleId);
  const [step, setStep] = useState<"choice" | "email">(googleCompletion ? "email" : "choice");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!campaign || !selectedModule) return <AuthPageShell title="Link inválido" description="Este link de aquisição não foi encontrado ou não está disponível." visualVariant="app"><p className="text-xs text-muted-foreground">Solicite um novo link para a equipe Directscal.</p></AuthPageShell>;
  if (campaign.status === "pausado") return <AuthPageShell title="Campanha pausada" description="Este link existe, mas a campanha não está ativa neste momento." visualVariant="app"><p className="text-xs text-muted-foreground">A equipe Directscal pode reativar o acesso ou enviar um novo link.</p></AuthPageShell>;
  if (submitted) return <AuthPageShell title="Cadastro recebido na demo" description="O lead fictício foi adicionado à apresentação, sem criar uma conta ou enviar dados a serviços externos." visualVariant="app"><Button nativeButton={false} render={<Link href="/demo" />}>Abrir a demo</Button></AuthPageShell>;

  async function submit({ values }: AcquisitionProgressiveFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      updateDemo(current => registerDemoLead(current, slug, values, googleCompletion ? "google" : "password"));
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível registrar o lead fictício.");
    } finally {
      setSubmitting(false);
    }
  }

  return <AuthPageShell contentAlignment="center" title={step === "choice" ? `Crie seu acesso ao ${selectedModule.shortName}` : googleCompletion ? "Complete seu acesso" : "Continue com e-mail"} description={step === "choice" ? "Escolha como continuar para liberar seu ambiente de cliente." : "Preencha os dados da campanha para experimentar o fluxo da apresentação."} visualVariant="app">
    {step === "choice" ? <div className="grid gap-5">
      <div className="grid gap-3">
        <Button type="button" variant="outline" size="lg" className="h-[45px] w-full gap-2.5 bg-background text-sm font-normal" onClick={() => router.push(`/demo/a/${slug}/completar`)}><Image src="/auth-figma-google.svg" alt="" width={18} height={18} className="size-4" aria-hidden="true" />Continuar com Google (simulação)</Button>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-xs text-foreground/80 dark:text-muted-foreground"><div className="h-px bg-border" /><span>ou</span><div className="h-px bg-border" /></div>
        <Button type="button" size="lg" className="h-[45px] w-full text-sm font-medium" onClick={() => setStep("email")}>Continuar com e-mail</Button>
      </div>
      <p className="text-xs text-muted-foreground">Este formulário usa apenas dados fictícios nesta apresentação.</p>
      <p className="text-xs text-muted-foreground">Já tem uma conta? <Link href="/demo/entrar" className="underline underline-offset-2">Entrar</Link></p>
    </div> : <div className="grid gap-4">
      <AcquisitionProgressiveForm fields={[...campaign.fields].sort((a, b) => a.order - b.order)} includePassword={!googleCompletion} isSubmitting={submitting} onFirstBack={() => googleCompletion ? router.push(`/demo/a/${slug}`) : setStep("choice")} onSubmit={submit} submitError={error} submittingLabel="Registrando na demo" />
      <p className="text-xs text-muted-foreground">Nenhum acesso real será criado.</p>
    </div>}
  </AuthPageShell>;
}
