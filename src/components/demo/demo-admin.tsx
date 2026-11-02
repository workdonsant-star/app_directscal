"use client";

import Link from "next/link";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { AdminCompaniesTable } from "@/components/admin/admin-companies-table";
import { AdminCompanyTabs } from "@/components/admin/admin-company-tabs";
import { OverviewDiagnosticFilter } from "@/components/omdx/overview-diagnostic-filter";
import { AdminCompanyDetail } from "@/components/admin/admin-company-detail";
import { AdminSpecialistsWorkspace } from "@/components/admin/admin-specialists-workspace";
import { SpecialistsProvider } from "@/components/admin/use-specialists";
import { AnalyticsOverview } from "@/components/omdx/analytics/analytics-overview";
import { AdminOperationsWorkspace } from "@/components/admin/admin-operations-workspace";
import { demoAdminAssetId } from "@/lib/data/demo/demo-admin-assets";
import { Button } from "@/components/ui/button";
import { buildAnalyticsExample } from "@/lib/data/analytics-example";
import { demoAdminSnapshot, demoAdminSpecialists, demoAdminCompanyContext, demoAdminDeliveries, DEMO_ORGANIZATION_ID } from "@/lib/data/demo/demo-admin-data";
import { buildDemoUsage, DEMO_COMPANY } from "@/lib/data/demo/demo-data";
import { useDemo } from "@/components/demo/demo-store";

const demoAreas = [
  { title: "Empresas cadastradas", description: "Abra os dados e as áreas de trabalho da empresa.", href: "/demo/admin/empresas" },
  { title: "Especialistas", description: "Consulte a equipe responsável pelas entregas.", href: "/demo/admin/especialistas" },
  { title: "Motores de IA", description: "Cadastre modelos fictícios de Anthropic, OpenAI e Google e defina as etapas do agente.", href: "/demo/admin/motores-de-ia" },
  { title: "Ativos de gestão", description: "Documentos da Vertex Logistics no contexto administrativo.", href: "/demo/admin/empresas/demo-vertex/criacao-dos-ativos" },
];

type Section = "home" | "empresas" | "especialistas" | "operacao" | "empresa" | "empresa-operacao";

export function DemoAdmin({ section, diagnosticId }: { section: Section; diagnosticId?: string }) {
  const { state } = useDemo();
  if (section === "empresas") {
    return <AdminCompaniesTable initialSnapshot={{ ...demoAdminSnapshot, companies: demoAdminSnapshot.companies.filter(company => !state.deletedCompanyIds?.includes(company.id)) }} />;
  }
  if (section === "especialistas") {
    return <AdminSpecialistsWorkspace initialSpecialists={state.adminSpecialists ?? demoAdminSpecialists} />;
  }
  if (section === "empresa-operacao") {
    return <SpecialistsProvider initialSpecialists={state.adminSpecialists ?? demoAdminSpecialists}><AdminCompanyDetail context={demoAdminCompanyContext(state.adminAssignedSpecialistId === undefined ? undefined : state.adminAssignedSpecialistId)} /></SpecialistsProvider>;
  }
  if (section === "operacao") return <SpecialistsProvider initialSpecialists={state.adminSpecialists ?? demoAdminSpecialists}><AdminOperationsWorkspace deliveries={demoAdminDeliveries(state)} /></SpecialistsProvider>;
  if (section === "empresa") {
    const usage = buildDemoUsage();
    const example = buildAnalyticsExample(diagnosticId);
    const adminUsage = { ...usage, processes: usage.processes.map(process => ({ ...process, href: `/demo/admin/empresas/demo-vertex/criacao-dos-ativos/${demoAdminAssetId(process.assetId)}` })) };
    return <div className="flex w-full flex-col gap-8"><header><h1 className="text-ui-page">{DEMO_COMPANY}</h1></header><AdminCompanyTabs companyId={DEMO_ORGANIZATION_ID} active="overview" hasOrganization showActionPoints actions={<OverviewDiagnosticFilter diagnostics={example.diagnosticOptions} id="collection-diagnostic-filter" value={example.selectedDiagnostic} allowAll={false} />} /><AnalyticsOverview {...example} processUsage={adminUsage} showActionPointsLink={false} concise hideHeader /></div>;
  }
  return <div className="flex flex-col gap-10"><div className="flex flex-wrap items-end justify-between gap-6"><div className="max-w-2xl space-y-3"><p className="font-label text-ui-label text-muted-foreground">APRESENTAÇÃO</p><h1 className="text-ui-page">Demo</h1><p className="text-muted-foreground">Explore a visão de superadmin com dados fictícios. As alterações ficam no navegador e podem ser reiniciadas na própria demo.</p></div><Button nativeButton={false} render={<Link href="/demo" />}>Abrir visão do cliente <ArrowUpRight className="size-4" /></Button></div><section aria-labelledby="demo-areas-title" className="space-y-5"><div className="space-y-1"><h2 id="demo-areas-title" className="text-ui-section">Áreas administrativas</h2><p className="text-sm text-muted-foreground">Abra uma área diretamente.</p></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{demoAreas.map(area => <Link key={area.href} href={area.href} className="group rounded-lg border border-border bg-card p-5 outline-none transition-colors hover:bg-action-neutral-hover focus-visible:ring-2 focus-visible:ring-ring"><div className="flex items-start justify-between gap-3"><h3 className="font-medium">{area.title}</h3><ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" /></div><p className="mt-3 text-sm text-muted-foreground">{area.description}</p></Link>)}</div></section><section className="flex max-w-3xl items-start gap-3 border-t border-border pt-6"><RotateCcw aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div className="space-y-1"><h2 className="font-medium">Estado reiniciável</h2><p className="text-sm text-muted-foreground">Use o controle Demo para restaurar o cenário antes de outra reunião.</p></div></section></div>;
}
