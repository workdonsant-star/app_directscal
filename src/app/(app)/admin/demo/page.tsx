import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, RotateCcw } from "lucide-react";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Demo — Admin Directscal",
};

const demoAreas = [
  { title: "Analytics", description: "Resultados, dimensões e indicadores de uso.", href: "/demo" },
  { title: "Pesquisas", description: "Criação, links e fluxo de resposta fictício.", href: "/demo/pesquisas" },
  { title: "Diagnósticos", description: "Relatórios e downloads de exemplo.", href: "/demo/relatorios" },
  { title: "Action Points", description: "Ações e rotinas por liderança.", href: "/demo/action-points" },
  { title: "Ativos de gestão", description: "Biblioteca e edição local dos documentos fictícios.", href: "/demo/ativos" },
  { title: "Agente", description: "Consulta demonstrativa com fontes do acervo fictício.", href: "/demo/agente" },
  { title: "Configurações", description: "Setores, empresa e estado ilustrativo do Slack.", href: "/demo/configuracoes" },
  { title: "Perfil", description: "Dados de perfil usados na apresentação.", href: "/demo/perfil" },
];

export default function AdminDemoPage() {
  return (
    <>
      <AppTopbar />
      <AppPage className="gap-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <p className="font-label text-ui-label text-muted-foreground">APRESENTAÇÃO</p>
            <h1 className="text-ui-page">Demo</h1>
            <p className="text-muted-foreground">
              Explore a experiência do cliente com dados fictícios. As alterações ficam no navegador e podem ser reiniciadas na própria demo.
            </p>
          </div>
          <Button nativeButton={false} render={<Link href="/demo" target="_blank" rel="noopener noreferrer" />}>
            Abrir demo <ArrowUpRight className="size-4" />
          </Button>
        </div>

        <section aria-labelledby="demo-areas-title" className="space-y-5">
          <div className="space-y-1">
            <h2 id="demo-areas-title" className="text-ui-section">Áreas da apresentação</h2>
            <p className="text-sm text-muted-foreground">Abra uma área diretamente em uma nova aba.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {demoAreas.map((area) => (
              <Link
                key={area.href}
                href={area.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg border border-border bg-card p-5 outline-none transition-colors hover:bg-action-neutral-hover focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium">{area.title}</h3>
                  <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{area.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="demo-state-title" className="flex max-w-3xl items-start gap-3 border-t border-border pt-6">
          <RotateCcw aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <h2 id="demo-state-title" className="font-medium">Estado reiniciável</h2>
            <p className="text-sm text-muted-foreground">
              Use o controle Demo na apresentação para restaurar o cenário antes de outra reunião. A demo não acessa empresas, autenticação ou serviços operacionais.
            </p>
          </div>
        </section>
      </AppPage>
    </>
  );
}
