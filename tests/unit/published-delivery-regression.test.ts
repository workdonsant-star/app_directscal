import type { GanttWorkspaceData } from "@/lib/contracts";
import { describe, expect, it } from "vitest";
import { buildReportFindings } from "@/lib/data/report-findings";
import { buildAnalyticsExampleReports } from "@/lib/data/analytics-example";
import { countActionPoints } from "@/lib/data/action-points-adherence-example";
import { buildPublishedActionPointsBoard } from "@/lib/data/published-action-points-board";
import { OmdxReportDocument } from "@/lib/pdf/omdx-report-document";

describe("fidelidade da entrega publicada", () => {
  it("não afirma desigualdade nem causa estrutural em base uniforme", () => {
    const report = buildAnalyticsExampleReports()[0];
    report.dimensions = report.dimensions.map(item => ({ ...item, score: 4 }));
    const findings = buildReportFindings(report);
    expect(findings.distribution).toContain("pontuações equivalentes");
    expect(findings.challenges).toEqual([]);
  });
  it("inclui todas as seis seções editoriais no documento PDF", () => {
    const editorial = {
      executiveSummary: "MARCADOR RESUMO APROVADO", generalReading: "MARCADOR LEITURA APROVADA",
      vulnerabilities: "MARCADOR VULNERABILIDADES", structuralCauses: "MARCADOR CAUSAS",
      recommendations: "MARCADOR RECOMENDACOES", conclusion: "MARCADOR CONCLUSAO",
    };
    const document = OmdxReportDocument({report:buildAnalyticsExampleReports()[0],editorial});
    const serialized = JSON.stringify(document);
    Object.values(editorial).forEach(text => expect(serialized).toContain(text));
  });
  it("não converte progresso de implantação em aderência nem inventa responsável ou conversa", () => {
    const workspace: GanttWorkspaceData = { source: { diagnosticId: "d", diagnosticName: "Pesquisa", company: "Fixture", generatedAt: "2026-10-19T12:00:00Z" }, tasks: [{id:"root",title:"Ações",owner:"Operação",blocker:"",status:"andamento" as const,progress:100,start:"2026-10-19",end:"2026-11-19",subitems:[{id:"a",title:"Mapear processos",owner:"Liderança",blocker:"",status:"andamento" as const,progress:100,start:"2026-10-19",end:"2026-11-19",actionPoint:{dimensionId:"processos" as const,dimensionName:"Processos e Execução Operacional",problem:"Leitura aprovada",recommendedAction:"Ação",owner:"Liderança",involved:[],suggestedDeadline:"30 dias",expectedImpact:"Impacto",successIndicator:"Indicador",priority:"Alta" as const,score:3,gap:null}}]}] };
    const board = buildPublishedActionPointsBoard(workspace,[]);
    expect(board.source?.diagnosticId).toBe("d");
    expect(board.categories[0].leader).toBeNull();
    expect(board.categories[0].actionPoints[0]).toMatchObject({id:"a",description:"Ação",why:"Leitura aprovada",implementation:{stage:"Sem responsável",dueOn:null,progress:null,suggestedDeadline:"30 dias"},health:"parado",checkIns:[]});
    expect(board.categories[0].actionPoints[0].cycleTotal).toBeUndefined();
    expect(countActionPoints(board.categories[0].actionPoints)).toMatchObject({risco:0,parado:1});
  });
});
