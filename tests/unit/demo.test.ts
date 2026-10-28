import { describe, expect, it } from "vitest";
import { answerDemoQuestion, demoAssets, demoBoard, demoReport } from "@/lib/data/demo/demo-data";
import { createDemoState, restoreDemoState, reviewDemoRecord, submitDemoResponse } from "@/lib/data/demo/demo-state";

describe("cenário público de demonstração", () => {
  it("liga cada rotina a um ativo legível, com dono coerente e os quatro tipos", () => {
    expect(new Set(demoAssets.map(asset => asset.type)).size).toBe(4);
    for (const category of demoBoard.categories) {
      const asset = demoAssets.find(asset => asset.id === category.id)!;
      expect(asset).toBeDefined();
      if (category.leader) expect(asset.operationalOwner).toBe(category.leader.name);
      expect(JSON.stringify(asset.content)).toContain(category.actionPoints[0].name);
    }
    expect(demoReport.diagnostic.company).toBe(demoBoard.company);
  });

  it("recusa uma pergunta sem base e só cita documento do catálogo fictício", () => {
    expect(answerDemoQuestion("Qual é a senha do banco?").assetId).toBeNull();
    const response = answerDemoQuestion("Como funciona a comunicação?");
    expect(demoAssets.some(asset => asset.id === response.assetId)).toBe(true);
  });

  it("preserva revisões e respostas após reentrada sem alterar coletas encerradas", () => {
    const initial = createDemoState();
    const closed = initial.surveys.filter(survey => survey.status === "encerrado");
    const updated = reviewDemoRecord(submitDemoResponse(initial, "demo-survey-active"), "demo-record-1", "validado");
    const restored = restoreDemoState(JSON.stringify(updated));
    expect(restored.records[0].status).toBe("validado");
    expect(restored.surveys.find(survey => survey.id === "demo-survey-active")?.responses).toBe(13);
    expect(restored.surveys.filter(survey => survey.status === "encerrado")).toEqual(closed);
    expect(submitDemoResponse(initial, closed[0].id)).toBe(initial);
    expect(initial.records[0].status).toBe("aguardando");
  });

  it("reinicia estado inválido ou de outra versão e não revisa relato duas vezes", () => {
    expect(restoreDemoState('{"version":99}')).toEqual(createDemoState());
    expect(restoreDemoState("invalid")).toEqual(createDemoState());
    const state = reviewDemoRecord(createDemoState(), "demo-record-1", "validado");
    expect(reviewDemoRecord(state, "demo-record-1", "devolvido").records[0].status).toBe("validado");
  });
});

import { assistantHistoryPageSchema } from "@/lib/contracts/assistant-history";
import { applyDemoRequest } from "@/lib/data/demo/demo-request";
import { demoDiagnostics, demoDimension, demoResponseWorkspace, demoShareLinks } from "@/lib/data/demo/demo-workspaces";
import { demoHref, demoPathname } from "@/lib/data/demo/demo-routes";
import { diagnosticResponseWorkspaceSchema, assetQuestionAnswerSchema } from "@/lib/contracts";

describe("componentes operacionais sobre fonte isolada", () => {
 it("mantém navegação de ida e volta dentro da demo, incluindo downloads", () => {
  for (const path of ["/omdx", "/omdx/diagnosticos", "/relatorios", "/insights/cultura", "/configuracoes", "/ativos-de-gestao/gestao-de-pessoas"]) {
   expect(demoHref(path)).toMatch(/^\/demo/);
   expect(demoPathname(demoHref(path))).toBe(path);
  }
  expect(demoHref("/configuracoes?secao=empresa")).toBe("/demo/configuracoes?secao=empresa");
  expect(demoHref("/omdx/analytics-example-0/relatorio")).toBe("/demo/relatorio/download?diagnostico=analytics-example-0");
  expect(demoHref("/ativos-de-gestao/download/sop/ativo-sops")).toBe("/demo/ativos/download/ativo-sops");
 });
 it("recusa endereços externos, IDs desconhecidos e operações fora da lista", () => {
  const state = createDemoState();
  for (const url of ["https://app.directscal.com/api/profile", "//app.directscal.com/api/profile", "/api/admin/companies", "/api/omdx/diagnostics/real-id/activate"]) {
   const result = applyDemoRequest(state, url, { method: "POST", body: "{}" });
   expect(result.status).toBeGreaterThanOrEqual(400);
   expect(result.state).toBe(state);
  }
 });
 it("usa o formulário real, valida as 24 respostas e bloqueia envio duplicado ou coleta encerrada", () => {
  const state = createDemoState();
  const token = demoShareLinks(state)["demo-survey-active"][0].token;
  const workspace = diagnosticResponseWorkspaceSchema.parse(demoResponseWorkspace(state, token));
  const answers = workspace.dimensions.flatMap(d => d.questions.map(q => ({ questionId: q.id, value: 4 })));
  expect(answers).toHaveLength(24);
  const send = (source = state, responses = answers) => applyDemoRequest(source, "/api/omdx/responses", { method: "POST", body: JSON.stringify({ token, answers: responses }) });
  expect(send(state, answers.slice(1)).status).toBe(400);
  const submitted = send();
  expect(submitted.status).toBeUndefined();
  expect(submitted.state.surveys.find(s => s.id === workspace.diagnostic.id)?.responses).toBe(13);
  expect(send(submitted.state).status).toBe(409);
  const closed = applyDemoRequest(state, "/api/omdx/diagnostics/demo-survey-active/close", { method: "POST" });
  expect(send(closed.state).status).toBe(409);
 });
 it("move documentos atomicamente ao renomear e excluir categorias", () => {
  const initial = createDemoState();
  const renamed = applyDemoRequest(initial, "/api/settings/asset-categories", { method: "PATCH", body: JSON.stringify({ key: "comunicacao", title: "Alinhamento" }) });
  expect(renamed.state.assets?.some(a => a.category === "Comunicação")).toBe(false);
  const refused = applyDemoRequest(renamed.state, "/api/settings/asset-categories", { method: "DELETE", body: JSON.stringify({ key: "comunicacao" }) });
  expect(refused.status).toBe(400);
  const removed = applyDemoRequest(renamed.state, "/api/settings/asset-categories", { method: "DELETE", body: JSON.stringify({ key: "comunicacao", destinationKey: "governanca" }) });
  expect(removed.state.assets).toHaveLength(demoAssets.length);
  expect(removed.state.assets?.some(a => a.category === "Alinhamento")).toBe(false);
 });
 it("fornece contratos válidos para pesquisas, dimensões, agente e histórico", () => {
  const state = createDemoState();
  expect(demoDiagnostics(state)).toHaveLength(3);
  expect(demoDimension("cultura").questionResults).toHaveLength(4);
  const asked = applyDemoRequest(state, "/api/assistant/ask", { method: "POST", body: JSON.stringify({ question: "Como funciona a comunicação?" }) });
  const body = asked.body as { answer: unknown };
  expect(assetQuestionAnswerSchema.parse(body.answer).citations[0].href).toMatch(/^\/demo/);
  const history = applyDemoRequest(asked.state, "/api/assistant/history");
  expect(assistantHistoryPageSchema.parse(history.body).items).toHaveLength(1);
 });
});
