import { describe, expect, it } from "vitest";
import { gradeAssetAnswer } from "../eval/asset-agent-grader";
import { assetAgentQuestions } from "../eval/asset-agent-questions";
import type { AssetQuestionAnswer } from "@/lib/contracts";
const citation = { chunkId: "fixture", assetId: "fixture", versionId: "fixture", assetType: "sop" as const, title: "Fechamento financeiro mensal", section: "Calendário", versionNumber: "1", publishedAt: "2026-10-20T12:00:00Z", href: "/ativos-de-gestao/sops/fixture" };
const answer: AssetQuestionAnswer = { auditId: null, status: "answered", answer: "Até o quinto dia útil do mês seguinte.", confidence: "alta", citations: [citation] };
describe("avaliação exige fato e fonte", () => {
 it("não aceita fonte correta com prazo errado ou fonte de outra política", () => {
  const question = assetAgentQuestions.find(item => item.id === "fin-01")!;
  expect(gradeAssetAnswer(question, answer)).toBe(true);
  expect(gradeAssetAnswer(question, { ...answer, answer: "Até o décimo dia útil." })).toBe(false);
  expect(gradeAssetAnswer(question, { ...answer, citations: [{ ...citation, title: "Outra política" }] })).toBe(false);
 });
 it("não conta falha técnica como recusa correta", () => {
  const question = assetAgentQuestions.find(item => item.id === "sem-01")!;
  const refused = { ...answer, status: "insufficient_evidence" as const, citations: [] };
  expect(gradeAssetAnswer(question, refused)).toBe(true);
  expect(gradeAssetAnswer(question, { ...refused, refusalReason: "Falha técnica na consulta." })).toBe(false);
 });
});


it("aceita exclusão explícita da jornada sem depender da palavra não", () => {
 const question = assetAgentQuestions.find(item => item.id === "pap-09")!;
 const sourced = {...answer, citations: [{...citation, title:"Geração de papéis e atribuições"}]};
 expect(gradeAssetAnswer(question,{...sourced,answer:"O documento exclui jornada de trabalho e controle de presença."})).toBe(true);
 expect(gradeAssetAnswer(question,{...sourced,answer:"O SOP estabelece jornada de trabalho e controle de presença."})).toBe(false);
});
