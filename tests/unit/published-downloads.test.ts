import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
vi.mock("@react-pdf/renderer",()=>({renderToBuffer:vi.fn(),Font:{registerHyphenationCallback:vi.fn()},StyleSheet:{create:(value:unknown)=>value}}));
vi.mock("@/lib/auth/session",()=>({getCurrentAuthSession:vi.fn()}));
vi.mock("@/lib/data/admin-delivery-data-source",()=>({getAdminDeliveryPublication:vi.fn()}));
vi.mock("@/lib/data/omdx-data-source",()=>({getDiagnosticById:vi.fn(),getDiagnosticActionPlan:vi.fn(),getDiagnosticReport:vi.fn()}));
vi.mock("@/lib/pdf/omdx-action-plan-document",()=>({OmdxActionPlanDocument:()=>null}));
vi.mock("@/lib/pdf/omdx-report-document",()=>({OmdxReportDocument:()=>null}));
import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getAdminDeliveryPublication } from "@/lib/data/admin-delivery-data-source";
import { getDiagnosticById, getDiagnosticActionPlan, getDiagnosticReport } from "@/lib/data/omdx-data-source";
import { buildAnalyticsExampleReports } from "@/lib/data/analytics-example";
import type { AdminDeliveryPublication, DiagnosticActionPlan } from "@/lib/contracts";
import { GET as actions } from "@/app/(app)/omdx/[id]/action-points/route";
import { GET as reportDownload } from "@/app/(app)/omdx/[id]/relatorio/route";
const report=buildAnalyticsExampleReports()[0];
const plan:DiagnosticActionPlan={...report,dimensions:report.dimensions.map(item=>({...item,gap:item.misalignment?.value??null,criticalQuestions:item.questions})),actionPoints:[]};
const editorial={executiveSummary:"Texto aprovado",generalReading:"Leitura",vulnerabilities:"Fragilidades",structuralCauses:"Causas",recommendations:"Ações",conclusion:"Conclusão"};
const publication:AdminDeliveryPublication={diagnosticId:report.diagnostic.id,organizationId:report.diagnostic.organizationId,specialistId:"especialista",status:"publicada",publishedAt:"2026-10-19T12:00:00Z",updatedAt:"2026-10-19T12:00:00Z",report:editorial,dimensionReadings:{},selectedActionPointIds:["action_processos_ritual","action_processos_ritual"]};
const request=new Request("http://localhost/omdx/teste/relatorio");
const context={params:Promise.resolve({id:report.diagnostic.id})};
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(getCurrentAuthSession).mockResolvedValue({user:{id:"dono",name:"Fixture",email:"fixture@example.com",company:"Fixture",role:"cliente"},token:"fixture",createdAt:"2026-10-19T12:00:00Z",expiresAt:"2026-10-20T12:00:00Z"});
 vi.mocked(getDiagnosticById).mockResolvedValue(report.diagnostic);
 vi.mocked(getDiagnosticReport).mockResolvedValue(report);
 vi.mocked(getDiagnosticActionPlan).mockResolvedValue(plan);
 vi.mocked(getAdminDeliveryPublication).mockResolvedValue(publication);
 vi.mocked(renderToBuffer).mockResolvedValue(Buffer.from("%PDF-fixture"));
});
describe("downloads coerentes com a publicação",()=>{
 it("bloqueia ações antes da publicação sem gerar recomendações",async()=>{
  vi.mocked(getAdminDeliveryPublication).mockResolvedValue({...publication,status:"em_analise",publishedAt:null});
  expect((await actions(request,context)).status).toBe(404);
  expect(getDiagnosticActionPlan).not.toHaveBeenCalled();expect(renderToBuffer).not.toHaveBeenCalled();
 });
 it("exporta somente seleção publicada com IDs estáveis e título",async()=>{
  const response=await actions(request,context);
  expect(response.status).toBe(200);expect(response.headers.get("Cache-Control")).toBe("no-store");
  const element=vi.mocked(renderToBuffer).mock.calls[0][0] as ReactElement<{plan:DiagnosticActionPlan}>;
  expect(element.props.plan.actionPoints.map((item:{id:string})=>item.id)).toEqual(["action_processos_ritual"]);
  expect(element.props.plan.actionPoints[0].title).toBe("Mapear os processos críticos da operação");
 });
 it("fornece as seis seções aprovadas ao PDF de relatório",async()=>{
  expect((await reportDownload(request,context)).status).toBe(200);
  const element=vi.mocked(renderToBuffer).mock.calls[0][0] as ReactElement<{editorial:typeof editorial}>;
  expect(element.props.editorial).toEqual(editorial);
 });
 it("nega acesso ao superadmin global antes de buscar dados",async()=>{
  const session=await getCurrentAuthSession();if(!session)throw new Error("Fixture sem sessão");session.user.role="superadmin";
  vi.mocked(getCurrentAuthSession).mockResolvedValue(session);
  expect((await actions(request,context)).status).toBe(403);
  expect((await reportDownload(request,context)).status).toBe(403);
  expect(getDiagnosticById).not.toHaveBeenCalled();
 });
});
