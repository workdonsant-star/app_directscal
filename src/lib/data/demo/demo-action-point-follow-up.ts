import type { AdminManagementAssetDetail } from "@/lib/contracts/management-assets";
import { demoReport } from "./demo-data";
import type { DemoActionPoint, DemoFollowUpPlan, DemoFollowUpCycle } from "./demo-state";

export const demoDiagnosticQuestions = demoReport.dimensions.flatMap(dimension =>
  dimension.questions.map(question => ({ value: question.text, label: `${dimension.name} · ${question.text}` })),
);

function publishedSource(asset: AdminManagementAssetDetail) {
  const blocks = asset.published?.content.content ?? [];
  const headingIndex = blocks.findIndex(block => block.type === "heading" && block.content?.some(part => part.type === "text" && part.text === "Registro e acompanhamento"));
  const block = blocks[headingIndex + 1];
  if (block?.type !== "paragraph") return asset.summary;
  const text = block.content?.filter(part => part.type === "text").map(part => part.text).join("") || asset.summary;
  return text.split(/(?<=\.)\s/)[0];
}

export function proposeDemoFollowUpPlan(item: DemoActionPoint, asset: AdminManagementAssetDetail, version = 1): DemoFollowUpPlan {
  const dimension = demoReport.dimensions.find(dimension => item.reason.toLocaleLowerCase("pt-BR").includes(dimension.name.toLocaleLowerCase("pt-BR"))) ?? demoReport.weakestDimension;
  const question = demoReport.dimensions.find(entry => entry.id === dimension.id)?.questions[0]?.text ?? demoDiagnosticQuestions[0].value;
  const source = publishedSource(asset);
  return {
    actionPointId: item.id, version, status: "rascunho", assetId: asset.id, assetVersionId: asset.published?.id ?? "",
    diagnosticId: demoReport.diagnostic.id, diagnosticQuestion: question, actionFrequency: item.frequency,
    orientation: "Pedir fatos do período. Esclarecer somente os campos que faltam, sem presumir execução.",
    criteria: [
      { id: `${item.id}-c1`, fact: "Registrar a prática no período", source, requiredFields: "data e decisão registrada", question: "Neste período, quando a prática ocorreu e qual decisão foi registrada?", clarification: "Informe a data e a decisão que ficou registrada.", evidence: "relato" },
      { id: `${item.id}-c2`, fact: "Definir responsável e próximo passo", source, requiredFields: "responsável e próximo passo", question: "Quem ficou responsável e qual foi o próximo passo definido neste período?", clarification: "Informe o nome do responsável e o próximo passo combinado.", evidence: "relato" },
    ],
    cycles: [],
  };
}

const periods = {
  diaria: ["2 de novembro", "3 de novembro", "4 de novembro"],
  semanal: ["Semana 1 · 2 a 8 de novembro", "Semana 2 · 9 a 15 de novembro", "Semana 3 · 16 a 22 de novembro"],
  quinzenal: ["Quinzena 1 · 2 a 15 de novembro", "Quinzena 2 · 16 a 29 de novembro", "Quinzena 3 · 30 de novembro a 13 de dezembro"],
  mensal: ["Novembro de 2026", "Dezembro de 2026", "Janeiro de 2027"],
  pontual: ["Marco único · exemplo fictício"],
};

export function simulateDemoFollowUpCycle(plan: DemoFollowUpPlan): DemoFollowUpCycle | null {
  const labels = periods[plan.actionFrequency ?? "pontual"];
  if (plan.status !== "ativo" || plan.cycles.length >= labels.length) return null;
  const number = plan.cycles.length + 1;
  const results: DemoFollowUpCycle["results"] = plan.criteria.map((criterion, index) => {
    if (number === 1 && criterion.evidence === "registro") return { criterionId: criterion.id, status: "parcial", explanation: "O relato cobre os campos, mas o registro exigido não foi apresentado.", evidence: "relato" };
    if (number === 1) return { criterionId: criterion.id, status: "atendido", explanation: `O relato informou ${criterion.requiredFields}.`, evidence: "relato" };
    if (number === 2 && index === 0) return { criterionId: criterion.id, status: "parcial", explanation: "A prática foi relatada, mas o registro exigido ficou incompleto.", evidence: "relato" };
    if (number === 2) return { criterionId: criterion.id, status: "inconclusivo", explanation: "A resposta continuou vaga após o esclarecimento simulado.", evidence: "relato" };
    return { criterionId: criterion.id, status: "sem_resposta", explanation: "Contato fictício entregue; não houve resposta no período.", evidence: "nenhuma" };
  });
  return { number, period: labels[number - 1], response: number === 1 ? "A prática ocorreu no período. Registramos a decisão no canal da área, com responsável e próximo passo." : number === 2 ? "Fizemos o alinhamento, mas o registro ficou para depois. O resto está encaminhado." : null, results };
}

export function summarizeDemoFollowUp(plan: DemoFollowUpPlan) {
  const results = plan.cycles.flatMap(cycle => cycle.results);
  return { attended: results.filter(result => result.status === "atendido").length, expected: results.length, partial: results.filter(result => result.status === "parcial").length, inconclusive: results.filter(result => result.status === "inconclusivo").length, unanswered: results.filter(result => result.status === "sem_resposta").length, answeredPeriods: plan.cycles.filter(cycle => cycle.response !== null).length };
}
