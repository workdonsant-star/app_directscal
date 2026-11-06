import { notFound, redirect } from "next/navigation";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { ActionPointsPeopleView } from "@/components/action-points/action-points-people-view";
import { ActionPointsDownload } from "@/components/action-points/action-points-download";
import { AiChatWorkspace } from "@/components/ai-chat/ai-chat-workspace";
import { DemoAssets } from "@/components/demo/demo-assets";
import { DemoResponse, DemoSurveys } from "@/components/demo/demo-surveys";
import { DemoSettings } from "@/components/demo/demo-settings";
import { DemoAdminCompany } from "@/components/demo/demo-admin-company";
import { DemoUploadedReports } from "@/components/demo/demo-uploaded-reports";
import { DemoAdminDelivery } from "@/components/demo/demo-admin-delivery";
import { ProductGuide } from "@/components/help/product-guide";
import { DemoAdmin } from "@/components/demo/demo-admin";
import { DemoAiEngines } from "@/components/demo/demo-ai-engines";
import { DemoAcquisition } from "@/components/demo/demo-acquisition";
import { DemoAuth } from "@/components/demo/demo-auth";
import { GeneratorBriefingWorkspace } from "@/components/admin/generators/generator-briefing-workspace";
import { isGeneratorKind } from "@/components/admin/generators/generator-config";
import { AnalyticsOverview } from "@/components/omdx/analytics/analytics-overview";
import { PublicResponseThankYou } from "@/components/omdx/public-response-thank-you";
import { ReportWorkspace } from "@/components/reports/report-workspace";
import { buildDemoUsage, demoAssets, demoBoard, demoReportEditorial, demoReports } from "@/lib/data/demo/demo-data";
import { demoUser } from "@/lib/data/demo/demo-workspaces";
import { buildAnalyticsExample } from "@/lib/data/analytics-example";
import { isDimensionId } from "@/lib/data/omdx-domain";

export default async function DemoPage({ params, searchParams }: {
 params: Promise<{ path?: string[] }>;
 searchParams: Promise<{ diagnostico?: string; pesquisa?: string; secao?: string; dimensao?: string }>;
}) {
 const path = (await params).path ?? [];
 const section = path.join("/");
 const query = await searchParams;
 if (path[0] === "admin") {
  if (path[1] === "geradores" && path.length === 3 && isGeneratorKind(path[2])) return <><AppTopbar /><AppPage><GeneratorBriefingWorkspace kind={path[2]} /></AppPage></>;
  if (path[1] === "motores-de-ia" && path.length === 2) return <><AppTopbar /><AppPage><DemoAiEngines /></AppPage></>;
  if (path[1] === "empresas" && path[2] === "demo-vertex") {
   if (path[3] === "relatorio" && path.length === 4) return <DemoAdminCompany section="reports" />;
   if (path[3] === "rotinas" && path.length === 4) return <DemoAdminCompany section="routines" />;
   if (path[3] === "action-points" && path.length === 4) return <DemoAdminCompany section="action-points" />;
   if (path[3] === "criacao-dos-ativos" && path.length <= 5) return <DemoAdminCompany section={path[4] === "perguntas" ? "questions" : "assets"} assetId={path[4] === "perguntas" ? undefined : path[4]} />;
  }
  if (path[1] === "entregas" && demoReports.some(report => report.diagnostic.id === path[2]) && path.length <= 5 && (!path[3] || ["dados", "relatorio", "action-points", "ativos", "publicar"].includes(path[3])) && (!path[4] || path[3] === "ativos")) {
   if (!path[3] || path[3] === "dados") redirect(`/demo/admin/entregas/${path[2]}/relatorio`);
   return <DemoAdminDelivery deliveryId={path[2]} step={path[3]} assetId={path[4]} />;
  }
  if (path[1] === "guia" && path.length === 2) return <><AppTopbar /><AppPage><ProductGuide audience="operation" /></AppPage></>;

  const adminSection = path.length === 1 ? "home"
   : path.length === 2 && ["empresas", "especialistas", "operacao", "perfil", "campanhas", "leads"].includes(path[1]) ? path[1]
   : path.length === 3 && path[1] === "leads" ? "lead-detail"
   : path.length === 3 && path[1] === "empresas" && path[2] === "demo-vertex" ? "empresa"
   : path.length === 4 && path[1] === "empresas" && path[2] === "demo-vertex" && path[3] === "operacao" ? "empresa-operacao"
   : null;
  if (!adminSection) notFound();
  const breadcrumb = adminSection === "empresa" || adminSection === "empresa-operacao" ? [{ label: "Empresas", href: "/demo/admin/empresas" }, { label: "Vertex Logistics" }] : adminSection === "lead-detail" ? [{ label: "Leads", href: "/demo/admin/leads" }, { label: "Detalhe" }] : undefined;
  return <><AppTopbar breadcrumb={breadcrumb} /><AppPage><DemoAdmin diagnosticId={query.diagnostico} leadId={adminSection === "lead-detail" ? path[2] : undefined} section={adminSection as "home" | "empresas" | "especialistas" | "operacao" | "empresa" | "empresa-operacao" | "perfil" | "campanhas" | "leads" | "lead-detail"} /></AppPage></>;
 }
 if (section === "entrar") return <DemoAuth mode="login" />;
 if (section === "criar-conta") return <DemoAuth mode="signup" />;
 if (section === "recuperar-senha") return <DemoAuth mode="reset" />;
 if (path[0] === "a" && path[1] && (path.length === 2 || (path.length === 3 && path[2] === "completar"))) return <DemoAcquisition slug={path[1]} googleCompletion={path[2] === "completar"} />;
 if (section === "pesquisas") return <DemoSurveys />;
 if (section === "responder") return <DemoResponse token={`${query.pesquisa ?? "demo-survey-active"}~operacao`} />;
 if (path[0] === "r" && path[1]) return path[2] === "obrigado" ? <PublicResponseThankYou /> : <DemoResponse token={decodeURIComponent(path[1])} />;
 if (section === "configuracoes" || section === "perfil") return <DemoSettings section={query.secao} personal={section === "perfil"} />;
 if (path[0] === "insights" && isDimensionId(path[1])) {
  const params = new URLSearchParams({ dimensao: path[1] });
  if (query.diagnostico) params.set("diagnostico", query.diagnostico);
  redirect(`/demo?${params.toString()}#nivel-perguntas`);
 }
 if (section === "ativos" || path[0] === "ativos-de-gestao") {
  const assetId = path.length >= 3 && ["sops", "playbooks", "governanca", "matriz-raci"].includes(path[1]) ? path[2] : undefined;
  if (assetId && !demoAssets.some(a => a.id === assetId)) notFound();
  return <DemoAssets assetId={assetId} categoryHref={assetId ? undefined : `/${section}`} />;
 }
 if (path[0] === "ativos" && path[1] && demoAssets.some(a => a.id === path[1])) return <DemoAssets assetId={path[1]} />;
 if (section === "relatorio" || (path[0] === "relatorios" && path[1])) {
  const report = section === "relatorio" ? demoReports[1] : demoReports.find(r => r.diagnostic.id === path[1]);
  if (!report) notFound();
  return <ReportWorkspace compact report={report} editorial={demoReportEditorial(report)} specialist={{ name: "Clara Mendes", email: "clara@directscal.example", title: "Consultora de estruturação", location: "São Paulo, SP", avatarUrl: null }} reportsHref="/demo/relatorios" actionPointsHref={`/demo/action-points?diagnostico=${report.diagnostic.id}`} downloadHref={`/demo/relatorio/download?diagnostico=${report.diagnostic.id}`} />;
 }
 let content;
 if (!section) content = <AnalyticsOverview {...buildAnalyticsExample(query.diagnostico)} processUsage={buildDemoUsage()} actionPointsHref="/demo/action-points" initialDimension={{ cultura: "Cultura", visao: "Visão", comunicacao: "Comunicação", processos: "Processos", lideranca: "Liderança", performance: "Performance" }[query.dimensao ?? "cultura"] ?? "Cultura"} />;
 else if (section === "action-points") content = <ActionPointsPeopleView board={demoBoard} />;
 else if (section === "agente") return <><AppTopbar /><AppPage className="min-h-0"><AiChatWorkspace user={{ ...demoUser, avatar: demoUser.avatarUrl }} /></AppPage></>;
 else if (section === "relatorios") content = <section aria-labelledby="reports-title" className="space-y-6"><div className="space-y-1"><h1 id="reports-title" className="text-ui-page">Diagnósticos</h1><p className="text-sm text-muted-foreground">Consulte os diagnósticos em PDF enviados pela Directscal.</p></div><DemoUploadedReports /></section>;
 else notFound();
 return <><AppTopbar actions={section === "action-points" && demoBoard.source ? <ActionPointsDownload diagnosticId={demoBoard.source.diagnosticId} /> : undefined} /><AppPage>{content}</AppPage></>;
}
