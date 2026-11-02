import { describe, expect, it } from "vitest";
import { answerDemoQuestion, demoAssets, demoBoard, demoReport } from "@/lib/data/demo/demo-data";
import { createDemoState, restoreDemoState, reviewDemoRecord, submitDemoResponse } from "@/lib/data/demo/demo-state";
import { proposeDemoFollowUpPlan, simulateDemoFollowUpCycle, summarizeDemoFollowUp } from "@/lib/data/demo/demo-action-point-follow-up";
import { assignDemoAiEngine, removeDemoAiEngine, saveDemoAiEngine } from "@/lib/data/demo/demo-ai-engines";

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

  it("restaura action points antigos e recorrentes sem perder as outras alterações locais", () => {
    const initial = createDemoState();
    const legacy = { id: "salvo", title: "Aplicar padrão", assetId: "ativo", leaderUserId: "lider", deadline: "2026-11-30", reason: "Motivo", action: "Executar", continuity: "Referência" };
    const points = [
      legacy,
      { ...legacy, id: "pontual-sem-prazo", deadline: null },
      { ...legacy, id: "recorrente-sem-fim", frequency: "semanal", deadline: null },
      { ...legacy, id: "recorrente-com-fim", frequency: "mensal" },
    ];
    const restored = restoreDemoState(JSON.stringify({ ...initial, slackConnected: false, adminActionPoints: points }));
    expect(restored.slackConnected).toBe(false);
    expect(restored.adminActionPoints).toEqual(points.map(point => ({ frequency: null, ...point })));
    expect(restored.surveys).toEqual(initial.surveys);
  });

  it("mantém plano aprovado no navegador e simula ciclos sem aprovação posterior", () => {
    const state = createDemoState();
    const asset = getDemoAdminAssets(state)[0];
    const point = { id: "teste-ap", title: "Registrar prioridades", assetId: asset.id, leaderUserId: "UDEMO0", deadline: null, frequency: "semanal" as const, reason: "Comunicação sem registro de prioridades", action: "Realizar o ritual", continuity: "Usar o ativo" };
    const proposal = proposeDemoFollowUpPlan(point, asset);
    expect(proposal.diagnosticId).toBe(demoReport.diagnostic.id);
    expect(proposal.assetVersionId).toBe(asset.published?.id);
    expect(proposal.criteria.every(criterion => criterion.source.includes("Registrar a data"))).toBe(true);
    expect(simulateDemoFollowUpCycle(proposal)).toBeNull();

    let active = { ...proposal, status: "ativo" as const };
    for (let index = 0; index < 3; index++) {
      const cycle = simulateDemoFollowUpCycle(active);
      expect(cycle?.number).toBe(index + 1);
      active = { ...active, cycles: [...active.cycles, cycle!] };
    }
    expect(simulateDemoFollowUpCycle(active)).toBeNull();
    expect(summarizeDemoFollowUp(active)).toMatchObject({ attended: 2, expected: 6, partial: 1, inconclusive: 1, unanswered: 2, answeredPeriods: 2 });
    expect(restoreDemoState(JSON.stringify({ ...state, adminFollowUpPlans: [active] })).adminFollowUpPlans?.[0]).toEqual(active);
  });

  it("cadastra vários motores fictícios e limpa roteamento ao pausar ou remover", () => {
    const anthropic = { id: "a1", provider: "anthropic" as const, name: "Planejador", model: "modelo-exemplo-a", enabled: true };
    const openai = { id: "o1", provider: "openai" as const, name: "Conversa", model: "modelo-exemplo-o", enabled: true };
    const google = { id: "g1", provider: "google" as const, name: "Classificação", model: "modelo-exemplo-g", enabled: true };
    let state = [anthropic, openai, google].reduce(saveDemoAiEngine, createDemoState());
    state = assignDemoAiEngine(assignDemoAiEngine(assignDemoAiEngine(state, "planner", "a1"), "conductor", "o1"), "classifier", "g1");
    expect(state.adminAiAssignments).toEqual({ planner: "a1", conductor: "o1", classifier: "g1" });
    state = saveDemoAiEngine(state, { ...openai, enabled: false });
    expect(state.adminAiAssignments?.conductor).toBeNull();
    expect(assignDemoAiEngine(state, "conductor", "o1")).toBe(state);
    state = removeDemoAiEngine(state, "g1");
    expect(state.adminAiAssignments).toEqual({ planner: "a1", conductor: null, classifier: null });
    expect(restoreDemoState(JSON.stringify(state)).adminAiEngines).toHaveLength(2);
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
 it("cria pesquisa sem selecionar lideranças e mantém link geral de Time quando não há setores", () => {
  const state = { ...createDemoState(), sectors: [] };
  const created = applyDemoRequest(state, "/api/omdx/diagnostics", { method: "POST", body: JSON.stringify({ name: "Pesquisa sem setores", description: null, deadline: "2026-12-10" }) });
  expect(created.status).toBeUndefined();
  const id = (created.body as { diagnosticId: string }).diagnosticId;
  expect(created.state.surveys.find(survey => survey.id === id)?.leaderIds).toEqual([]);
  expect(demoShareLinks(created.state)[id].map(link => [link.group, link.sectorId])).toEqual([
   ["fundador", null], ["lideranca", null], ["operacao", null],
  ]);
 });
 it("mantém alterações administrativas na fonte fictícia e reinicia o cenário", () => {
  const initial = createDemoState();
  const directory = applyDemoRequest(initial, "/api/admin/specialists");
  expect((directory.body as { specialists: unknown[] }).specialists).toHaveLength(1);
  const added = applyDemoRequest(initial, "/api/admin/specialists", { method: "POST", body: JSON.stringify({ name: "Joana Silva", email: "joana@directscal.example", title: "Consultora", location: "São Paulo, SP" }) });
  expect(added.status).toBeUndefined();
  expect((applyDemoRequest(added.state, "/api/admin/specialists").body as { specialists: unknown[] }).specialists).toHaveLength(2);
  const deleted = applyDemoRequest(added.state, "/api/admin/companies", { method: "DELETE", body: JSON.stringify({ companyIds: ["demo-vertex"], confirmation: "EXCLUIR" }) });
  expect((applyDemoRequest(deleted.state, "/api/admin/acquisition").body as { companies: unknown[] }).companies).toHaveLength(0);
  expect((applyDemoRequest(createDemoState(), "/api/admin/acquisition").body as { companies: unknown[] }).companies).toHaveLength(1);
  expect(applyDemoRequest(initial, "/api/admin/companies", { method: "DELETE", body: JSON.stringify({ companyIds: ["empresa-real"], confirmation: "EXCLUIR" }) }).status).toBe(404);
  const assigned = applyDemoRequest(initial, "/api/admin/companies/demo-vertex", { method: "PATCH", body: JSON.stringify({ specialistId: "demo-specialist-clara", expectedUpdatedAt: "2026-10-21T12:00:00.000Z" }) });
  expect(assigned.state.adminAssignedSpecialistId).toBe("demo-specialist-clara");
  expect(applyDemoRequest(initial, "/api/admin/companies/demo-vertex/slack-deliveries").body).toEqual({ items: [], nextCursor: null });
 });
 it("mantém navegação de ida e volta dentro da demo, incluindo downloads", () => {
  expect(demoHref("/admin/empresas/demo-vertex/criacao-dos-ativos")).toBe("/demo/admin/empresas/demo-vertex/criacao-dos-ativos");
  expect(demoHref("/admin/empresas/demo-vertex/rotinas")).toBe("/demo/admin/empresas/demo-vertex/rotinas");
  expect(demoHref("/admin/empresas/demo-vertex/criacao-dos-ativos/ativo-sops")).toBe("/demo/admin/empresas/demo-vertex/criacao-dos-ativos/ativo-sops");
  for (const path of ["/omdx", "/omdx/diagnosticos", "/relatorios", "/insights/cultura", "/configuracoes", "/ativos-de-gestao/gestao-de-pessoas", "/admin/demo", "/admin/empresas", "/admin/especialistas", "/admin/operacao", "/admin/empresas/demo-vertex/criacao-dos-ativos", "/admin/empresas/demo-vertex/rotinas"]) {
   expect(demoHref(path)).toMatch(/^\/demo/);
   expect(demoPathname(demoHref(path))).toBe(path);
  }
  expect(demoHref("/configuracoes?secao=empresa")).toBe("/demo/configuracoes?secao=empresa");
  expect(demoHref("/omdx/analytics-example-0/relatorio")).toBe("/demo/relatorio/download?diagnostico=analytics-example-0");
  expect(demoHref("/ativos-de-gestao/download/sop/ativo-sops")).toBe("/demo/ativos/download/ativo-sops");
  expect(demoHref("/admin/demo")).toBe("/demo/admin");
  expect(demoHref("/admin/empresas")).toBe("/demo/admin/empresas");
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

import { adminManagementAssetDetailSchema } from "@/lib/contracts/management-assets";
import { getDemoAdminAssets, DEMO_ADMIN_ORGANIZATION_ID } from "@/lib/data/demo/demo-admin-assets";
import { demoRoutineWorkspace } from "@/lib/data/demo/demo-admin-routines";
import { demoAdminPublication } from "@/lib/data/demo/demo-admin-data";

describe("superadmin da demo sem sair do contexto administrativo", () => {
 const send = (state: ReturnType<typeof createDemoState>, url: string, method: string, body: unknown = {}) => applyDemoRequest(state, url, { method, body: JSON.stringify(body) });
 it("preserva a publicação anterior ao editar, valida revisão e publica a nova versão local", () => {
  const initial = createDemoState();
  const asset = getDemoAdminAssets(initial)[0];
  const opened = send(initial, `/api/admin/management-assets/${asset.id}/transition`, "POST", { action: "abrir_rascunho" });
  const draft = adminManagementAssetDetailSchema.parse((opened.body as { asset: unknown }).asset);
  expect(draft.draft?.content).toEqual(asset.published?.content);
  expect(draft.published).toEqual(asset.published);
  const input = { expectedRevision: draft.revision, title: draft.title, summary: draft.summary, category: draft.category, ownerLabel: draft.ownerLabel, specialistId: draft.specialistId, changeNote: "Revisão da demo", content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Conteúdo revisado para a apresentação." }] }] } };
  const saved = send(opened.state, `/api/admin/management-assets/${asset.id}`, "PATCH", input);
  expect(saved.status).toBeUndefined();
  expect(saved.state.assets?.find(item => item.id === demoAssets[0].id)?.content).toEqual(asset.published?.content);
  expect(send(saved.state, `/api/admin/management-assets/${asset.id}`, "PATCH", input).status).toBe(409);
  const published = send(saved.state, `/api/admin/management-assets/${asset.id}/transition`, "POST", { action: "publicar" });
  expect(published.status).toBeUndefined();
  const updated = getDemoAdminAssets(published.state).find(item => item.id === asset.id)!;
  expect(updated.draft).toBeNull();
  expect(updated.versions.some(item => item.status === "substituido")).toBe(true);
  expect(published.state.assets?.find(item => item.id === demoAssets[0].id)?.content).toEqual(input.content);
  expect(restoreDemoState(JSON.stringify(published.state)).adminAssets).toEqual(published.state.adminAssets);
  expect(initial.adminAssets).toBeUndefined();
 });
 it("cria os quatro tipos, edita metadados em lote e recusa IDs de outra empresa", () => {
  let state = createDemoState();
  for (const type of ["sop", "playbook", "governanca", "raci"]) {
   const created = send(state, "/api/admin/management-assets", "POST", { organizationId: DEMO_ADMIN_ORGANIZATION_ID, type, category: "Governança" });
   expect(created.status).toBeUndefined();
   state = created.state;
   const assetId = (created.body as { assetId: string }).assetId;
   const bulk = send(state, "/api/admin/management-assets/bulk", "PATCH", { organizationId: DEMO_ADMIN_ORGANIZATION_ID, assetIds: [assetId], changes: { ownerLabel: "Liderança da operação" } });
   expect(bulk.status).toBeUndefined();
   expect(getDemoAdminAssets(bulk.state).find(item => item.id === assetId)?.ownerLabel).toBe("Liderança da operação");
   state = bulk.state;
  }
  expect(getDemoAdminAssets(state)).toHaveLength(demoAssets.length + 4);
  expect(send(state, "/api/admin/management-assets", "POST", { organizationId: "outra-empresa", type: "sop", category: null }).status).toBe(404);
  expect(send(state, "/api/admin/management-assets/real-id/transition", "POST", { action: "publicar" }).status).toBe(404);
 });
 it("preserva ativos vinculados e mantém pausa, retomada e linha de base após reentrada", () => {
  const initial = createDemoState();
  const workspace = demoRoutineWorkspace(initial);
  const rule = workspace.rules[0];
  expect(send(initial, "/api/admin/management-assets/bulk", "DELETE", { organizationId: DEMO_ADMIN_ORGANIZATION_ID, assetIds: [rule.assetId] }).status).toBe(400);
  const paused = send(initial, "/api/admin/companies/demo-vertex/routines", "POST", { operation: "situacao", id: crypto.randomUUID(), routineId: rule.routineId, expectedEventId: null, action: "pausar", reason: "Revisar o acordo" });
  expect(paused.status).toBeUndefined();
  const event = demoRoutineWorkspace(paused.state).events[0];
  expect(event.action).toBe("pausar");
  expect(send(paused.state, "/api/admin/companies/demo-vertex/routines", "POST", { operation: "situacao", id: crypto.randomUUID(), routineId: rule.routineId, expectedEventId: null, action: "retomar", reason: "Acordo revisado" }).status).toBe(409);
  const resumed = send(paused.state, "/api/admin/companies/demo-vertex/routines", "POST", { operation: "situacao", id: crypto.randomUUID(), routineId: rule.routineId, expectedEventId: event.id, action: "retomar", reason: "Acordo revisado" });
  const captured = send(resumed.state, "/api/admin/companies/demo-vertex/result-baselines", "POST", { ruleId: rule.id });
  expect(captured.status).toBeUndefined();
  const restored = restoreDemoState(JSON.stringify(captured.state));
  expect(demoRoutineWorkspace(restored).events.map(item => item.action)).toEqual(["pausar", "retomar"]);
  expect(restored.adminBaselines?.[0].layers).toHaveLength(3);
  expect(demoRoutineWorkspace(createDemoState()).events).toHaveLength(0);
 });
 it("salva a entrega e mantém links administrativos e downloads na demo", () => {
  const initial = createDemoState();
  const publication = demoAdminPublication(initial, demoReport.diagnostic.id);
  expect(publication.status).toBe("em_analise");
  expect(publication.publishedAt).toBeNull();
  expect(Object.values(publication.report)).toEqual(["", "", "", "", "", ""]);
  const saved = send(initial, `/api/admin/deliveries/${publication.diagnosticId}`, "PATCH", { ...publication, intent: "save" });
  expect(saved.status).toBeUndefined();
  expect(saved.state.adminPublications?.[0].status).toBe("em_analise");
  for (const path of [`/admin/entregas/${publication.diagnosticId}`, `/admin/entregas/${publication.diagnosticId}/dados`, "/admin/empresas/demo-vertex/criacao-dos-ativos", "/admin/empresas/demo-vertex/rotinas", "/admin/guia"]) {
   expect(demoPathname(demoHref(path))).toBe(path);
   expect(demoHref(path)).toMatch(/^\/demo\/admin/);
  }
  expect(demoHref(`/admin/entregas/${publication.diagnosticId}/relatorio/pdf`)).toBe(`/demo/relatorio/download?diagnostico=${publication.diagnosticId}`);
 });
});
