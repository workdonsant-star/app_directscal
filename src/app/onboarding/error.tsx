"use client";

import { Button } from "@/components/ui/button";

export default function OnboardingError() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-2xl content-center gap-5 px-6 py-10">
      <h1 className="text-ui-page">Não foi possível carregar a configuração</h1>
      <p className="text-sm leading-6 text-muted-foreground">Seu progresso está salvo. Tente novamente para continuar a preparação da empresa.</p>
      <div><Button onClick={() => window.location.reload()}>Tentar novamente</Button></div>
    </main>
  );
}
