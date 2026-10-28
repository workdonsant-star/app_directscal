import type { AdminDeliveryReportDraft } from "@/lib/contracts/admin-operations";
import { managementAssetDocumentSchema, diagnosticActionPlanSchema, type DiagnosticReport, type RichTextBlock } from "@/lib/contracts";
import { buildAnalyticsExampleReports } from "@/lib/data/analytics-example";
import { buildActionPointsAdherenceExample } from "@/lib/data/action-points-adherence-example";
import { buildProcessUsageExample } from "@/lib/data/process-usage-example";

export const DEMO_COMPANY = "Vertex Logistics";
export const DEMO_DATE = "2026-10-21T12:00:00.000Z";
const sourceBoard = buildActionPointsAdherenceExample();
export const demoBoard = { ...sourceBoard, source: { diagnosticId: "analytics-example-1", name: "Diagnóstico de outubro" } };
export const demoReports = buildAnalyticsExampleReports();
export const demoReport = demoReports[1];
const score = demoReport.generalScore.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export const demoEditorial: AdminDeliveryReportDraft = {
  executiveSummary: `A ${DEMO_COMPANY} reúne 27 respostas na coleta de outubro: um fundador, cinco lideranças e 21 pessoas do time. Esta leitura compara seis dimensões da estrutura de gestão, na escala de 1 a 5.`,
  generalReading: `A maturidade geral é ${score} em 5. Comunicação e Processos concentram as menores notas. A diferença entre a percepção do fundador e do time recomenda aprofundar como as prioridades chegam à operação.`,
  vulnerabilities: "A coleta indica menor consistência na comunicação entre áreas e na repetibilidade dos processos. As perguntas de menor nota orientam a investigação de decisões sem registro, passagens de responsabilidade e critérios de qualidade.",
  structuralCauses: "A dependência de alinhamentos individuais é uma hipótese a investigar com as lideranças. As respostas mostram diferenças de percepção, sem comprovar causas. Entrevistas, registros de reuniões e observação das entregas devem orientar a revisão dessa hipótese.",
  recommendations: "Priorizar rituais de comunicação, critérios de passagem entre áreas e acompanhamento dos processos críticos. Cada prática precisa de responsável, frequência e evidência esperada. Revisar os relatos com as lideranças e comparar a evolução em uma nova coleta.",
  conclusion: "O próximo passo é dar previsibilidade à execução: tornar prioridades e responsabilidades explícitas, sustentar os rituais e acompanhar os desvios. Consulta a documentos, execução relatada e resultado são sinais distintos e devem permanecer separados.",
};

function paragraph(text: string): RichTextBlock {
  return { type: "paragraph", content: [{ type: "text", text }] };
}
function heading(text: string): RichTextBlock {
  return { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text }] };
}

const types = ["governanca", "governanca", "playbook", "playbook", "governanca", "sop", "sop", "playbook", "raci", "governanca"] as const;
const categoryNames = { comunicacao: "Comunicação", pessoas: "Gestão de pessoas", processos: "Processos", governanca: "Governança" };

export const demoAssets = demoBoard.categories.map((category, index) => {
  const owner = category.leader?.name ?? "Marina Alves";
  const steps = category.actionPoints.map(point => `${point.name}. Frequência: ${point.frequency}. ${point.why ?? "Registrar o resultado e os impedimentos para revisão da liderança."}`);
  const content: RichTextBlock[] = [
    heading("Objetivo"),
    paragraph(`Manter ${category.name.toLowerCase()} como uma prática útil e recorrente da ${DEMO_COMPANY}, com decisões registradas e responsáveis claros.`),
    heading("Responsabilidades"),
    paragraph(`${owner} coordena a rotina e registra os encaminhamentos. Cada participante informa suas prioridades e impedimentos. A liderança revisa pendências e confirma o próximo passo.`),
    heading("Como executar"),
    { type: "orderedList", content: steps.map(step => ({ type: "listItem", content: [paragraph(step) as { type: "paragraph"; content: { type: "text"; text: string }[] }] })) },
    heading("Registro e acompanhamento"),
    paragraph("Registrar a data, os participantes, a decisão, o responsável e o próximo passo. Ao identificar um bloqueio, explicar a dificuldade e propor uma data de retorno. O relato de execução aguarda revisão da evidência quando aplicável."),
    heading("Exceções"),
    paragraph("Se a rotina não puder ocorrer, informar o motivo e solicitar uma exceção. O consultor responsável revisa a solicitação; o prazo e o histórico originais são preservados."),
  ];
  if (types[index % types.length] === "raci") {
    content.splice(4, 0, {
      type: "table", content: [
        ["Atividade", "Responsável", "Aprovador", "Consultado", "Informado"],
        ["Preparar a rotina", owner, "Liderança da área", "Participantes", "Consultor DSC"],
        ["Registrar encaminhamentos", owner, "Liderança da área", "Participantes", "Time"],
        ["Revisar exceção", "Consultor DSC", "Liderança da área", owner, "Time"],
      ].map((row, rowIndex) => ({ type: "tableRow", content: row.map(text => ({ type: rowIndex === 0 ? "tableHeader" : "tableCell", content: [paragraph(text)] })) })),
    } as RichTextBlock);
  }
  return managementAssetDocumentSchema.parse({
    id: category.id, organizationId: "demo-vertex", type: types[index % types.length], title: category.name,
    summary: `Práticas de ${categoryNames[category.colorKey].toLowerCase()} com responsáveis, cadência e registro dos encaminhamentos.`,
    category: categoryNames[category.colorKey], author: { name: "Clara Mendes", role: "Consultora de estruturação" },
    versionNumber: category.version.replace(/^v/i, ""), versionId: `${category.id}-v1`,
    publishedAt: "2026-10-01T12:00:00.000Z", updatedAt: "2026-10-15T12:00:00.000Z",
    operationalOwner: owner, lastEditedBy: "Clara Mendes", reviewCycle: "Trimestral", content: { type: "doc", content },
  });
});

export const demoPeople = Array.from(new Map(demoBoard.categories.filter(c => c.leader).map(c => [c.leader!.name, c.leader!])).values());

export function buildDemoUsage() {
  const usage = buildProcessUsageExample(new Date(DEMO_DATE));
  return { ...usage, processes: usage.processes.map((process, index) => {
    const asset = demoAssets[index];
    return { ...process, assetId: asset.id, title: asset.title, assetType: asset.type, href: `/demo/ativos/${asset.id}` };
  }) };
}

export function normalizeDemoText(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function answerDemoQuestion(question: string) {
  const query = normalizeDemoText(question);
  const tokens = query.split(/\W+/).filter(token => token.length > 3 && !["como", "para", "qual", "quem", "devo", "sobre", "fazer", "funciona", "quais", "preciso"].includes(token));
  const matches = demoAssets.map(asset => {
    const text = normalizeDemoText(`${asset.title} ${asset.summary}`);
    return { asset, score: tokens.filter(token => text.includes(token)).length };
  }).sort((a, b) => b.score - a.score);
  const match = matches[0];
  if (!match?.score) return { text: "Não encontrei uma orientação publicada para essa pergunta no acervo da Vertex. Você pode perguntar sobre uma das rotinas da biblioteca ou encaminhar a dúvida ao consultor responsável.", assetId: null };
  const category = demoBoard.categories.find(c => c.id === match.asset.id)!;
  return {
    text: `${match.asset.title}: ${match.asset.operationalOwner} coordena esta rotina. ${category.actionPoints.map(point => `${point.name} (${point.frequency.toLowerCase()}).`).join(" ")} Registre decisões, responsáveis e impedimentos. Se não conseguir executar, informe o motivo para revisão do consultor.`,
    assetId: match.asset.id,
  };
}

export function demoReportEditorial(report: DiagnosticReport) {
  return { ...demoEditorial,
    executiveSummary: `A ${DEMO_COMPANY} reúne ${report.responses.total} respostas nesta coleta: ${report.responses.fundador} fundador, ${report.responses.lideranca} lideranças e ${report.responses.operacao} pessoas do time. Esta leitura compara seis dimensões da estrutura de gestão, na escala de 1 a 5.`,
    generalReading: `A maturidade geral é ${report.generalScore.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} em 5. Comunicação e Processos concentram as menores notas. A diferença entre a percepção do fundador e do time recomenda aprofundar como as prioridades chegam à operação.`,
  };
}
export function demoActionPlan(report: DiagnosticReport) {
 return diagnosticActionPlanSchema.parse({ ...report, dimensions: report.dimensions.map(d => ({ ...d, gap: d.misalignment?.value ?? null, criticalQuestions: d.questions })), actionPoints: demoBoard.categories.flatMap(category => category.actionPoints.map(ap => {
  const dimension = report.dimensions.find(d => d.id === (category.colorKey === "pessoas" ? "lideranca" : category.colorKey === "governanca" ? "visao" : category.colorKey))!;
  return { id: ap.id, title: ap.name, dimensionId: dimension.id, dimensionName: dimension.name, problem: ap.why ?? category.name, recommendedAction: ap.name, owner: "Liderança", involved: [category.leader?.name ?? "A definir"], suggestedDeadline: ap.frequency, expectedImpact: "Dar previsibilidade à operação.", successIndicator: "Registrar execução, decisão e próximo passo.", priority: "Alta", score: dimension.score, gap: dimension.misalignment?.value ?? null };
 })) });
}
