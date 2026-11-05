import { adminRoutineWriteSchema, type AdminRoutineWorkspace, type RoutineRevision } from "@/lib/contracts/admin-adherence";
import { routineContactPolicyInputSchema, type RoutineContactPolicy } from "@/lib/contracts/routine-contacts";
import { resultBaselineSchema } from "@/lib/contracts/routine-results";
import { demoAdminId, getDemoAdminAssets } from "./demo-admin-assets";
import { DEMO_COMPANY, DEMO_DATE, demoReport, demoPeople } from "./demo-data";
import type { DemoState } from "./demo-state";

export const demoRoutineUsers = demoPeople.map((person, index) => ({ userId: `UDEMO${index}`, name: person.name, position: "Líder de área", avatarUrl: person.avatarUrl ?? null }));
export function demoRoutineWorkspace(state: DemoState): AdminRoutineWorkspace {
  const diagnosticId = demoAdminId(300);
  const assets = getDemoAdminAssets(state).filter(asset => asset.status === "publicado" && asset.published).map(asset => ({ id: asset.id, versionId: asset.published!.id, title: asset.title, version: asset.published!.versionNumber }));
  const questions = demoReport.dimensions.flatMap(dimension => dimension.questions).map((question, index) => ({ id: demoAdminId(400 + index), diagnosticId, text: question.text }));
  const actions = demoPeople.map((person, index) => ({ diagnosticId, diagnosticName: demoReport.diagnostic.name, actionPointId: `ap-demo-${index}`, title: index === 0 ? "Sustentar os rituais de comunicação" : `Acompanhar a operação de ${person.sector}`, description: "Registrar prioridades, decisões e impedimentos com as lideranças.", successIndicator: "Prioridades e impedimentos registrados com responsável e prazo.", assignment: { teamId: "TDEMO", userId: `UDEMO${index}`, name: person.name, updatedAt: DEMO_DATE } }));
  const sectors = demoPeople.map((person, index) => ({ id: demoAdminId(500 + index), name: person.sector }));
  const seededAsset = { id: demoAdminId(100), versionId: demoAdminId(200) };
  const rules: RoutineRevision[] = seededAsset ? [{ id: demoAdminId(600), routineId: demoAdminId(601), revision: 1, diagnosticId, actionPointId: actions[0].actionPointId, title: "Alinhamento semanal da operação", successIndicator: actions[0].successIndicator, expectation: actions[0].description, assetId: seededAsset.id, assetVersionId: seededAsset.versionId, questionId: questions[0].id, sectorId: sectors[0].id, assigneeUserId: "UDEMO0", schedule: { kind: "periodica", cadence: "semanal", timeZone: "America/Sao_Paulo" }, createdAt: DEMO_DATE, reason: "Acordo inicial de demonstração", actorName: "Admin Directscal" }] : [];
  const workspace: AdminRoutineWorkspace = { companyId: "demo-vertex", companyName: DEMO_COMPANY, assets, questions, actions, sectors, rules, events: [] };
  for (const input of state.adminRoutineChanges ?? []) {
    if (input.operation === "salvar") workspace.rules.push({ ...input, revision: Math.max(0, ...workspace.rules.filter(rule => rule.routineId === input.routineId).map(rule => rule.revision)) + 1, createdAt: DEMO_DATE, actorName: "Admin Directscal" });
    else if (input.operation === "situacao") workspace.events.push({ ...input, recordedAt: DEMO_DATE, actorName: "Admin Directscal", sequence: workspace.events.length + 1 });
    else {
      const action = workspace.actions.find(action => action.diagnosticId === input.diagnosticId && action.actionPointId === input.actionPointId);
      const user = demoRoutineUsers.find(user => user.userId === input.assigneeUserId);
      if (!action || !user) continue;
      action.assignment = { teamId: "TDEMO", userId: user.userId, name: user.name, updatedAt: new Date(new Date(action.assignment!.updatedAt).getTime() + 1).toISOString() };
      for (const expected of input.expectedRules) {
        const rule = workspace.rules.find(rule => rule.id === expected.ruleId);
        if (rule) workspace.rules.push({ ...rule, id: `${input.id.slice(0, 24)}${expected.routineId.slice(-12)}`, revision: rule.revision + 1, assigneeUserId: user.userId, reason: input.reason, createdAt: DEMO_DATE });
      }
    }
  }
  return workspace;
}
export function demoContactPolicy(state: DemoState): RoutineContactPolicy | null {
  const inputs = state.adminContactPolicies ?? [];
  const input = inputs.at(-1);
  return input ? { ...input, revision: inputs.length, createdAt: DEMO_DATE, enabledAt: input.enabled ? DEMO_DATE : null } : null;
}
export function applyDemoRoutineRequest(state: DemoState, url: URL, method: string, body: unknown) {
  const match = url.pathname.match(/^\/api\/admin\/companies\/demo-vertex\/(routines|routine-contact-policy|routine-supervision|result-baselines|routine-events)$/);
  if (!match) return null;
  const result = (response: unknown, next = state, status?: number) => ({ body: response, state: next, status });
  const fail = (message: string, status = 400) => result({ message }, state, status);
  const workspace = demoRoutineWorkspace(state);
  if (match[1] === "routines") {
    if (method === "GET") return result(url.searchParams.has("directory") ? { users: demoRoutineUsers } : { workspace });
    if (method !== "POST") return fail("Ação indisponível.", 404);
    const input = adminRoutineWriteSchema.parse(body);
    if (state.adminRoutineChanges?.some(change => change.id === input.id)) return result({});
    const latest = workspace.rules.filter(rule => rule.routineId === (input.operation === "transferir" ? "" : input.routineId)).sort((a, b) => b.revision - a.revision)[0];
    if (input.operation === "salvar") {
      if ((latest?.id ?? null) !== input.expectedRuleId) return fail("O acordo mudou. Atualize os dados.", 409);
      const action = workspace.actions.find(action => action.diagnosticId === input.diagnosticId && action.actionPointId === input.actionPointId);
      if (!action || !workspace.assets.some(asset => asset.id === input.assetId && asset.versionId === input.assetVersionId) || !workspace.questions.some(question => question.id === input.questionId && question.diagnosticId === input.diagnosticId) || !workspace.sectors.some(sector => sector.id === input.sectorId) || !demoRoutineUsers.some(user => user.userId === input.assigneeUserId)) return fail("Revise a origem, o ativo, o setor e o responsável.");
      if (input.expectedAssignmentUpdatedAt !== action.assignment?.updatedAt || input.assigneeUserId !== action.assignment?.userId) return fail("A atribuição mudou. Atualize os dados.", 409);
    } else if (input.operation === "situacao") {
      const event = workspace.events.filter(event => event.routineId === input.routineId).at(-1);
      if (!latest || (event?.id ?? null) !== input.expectedEventId) return fail("A rotina mudou. Atualize os dados.", 409);
    } else {
      const action = workspace.actions.find(action => action.diagnosticId === input.diagnosticId && action.actionPointId === input.actionPointId);
      const current = [...new Map(workspace.rules.filter(rule => rule.diagnosticId === input.diagnosticId && rule.actionPointId === input.actionPointId).map(rule => [rule.routineId, rule])).values()];
      if (!action || !demoRoutineUsers.some(user => user.userId === input.assigneeUserId)) return fail("Responsável indisponível.");
      if (input.expectedUpdatedAt !== action.assignment?.updatedAt || current.length !== input.expectedRules.length || current.some(rule => !input.expectedRules.some(expected => expected.routineId === rule.routineId && expected.ruleId === rule.id))) return fail("Os acordos mudaram. Atualize os dados.", 409);
    }
    return result({}, { ...state, adminRoutineChanges: [...(state.adminRoutineChanges ?? []), input] });
  }
  if (match[1] === "routine-contact-policy") {
    if (method === "GET") return result({ policy: demoContactPolicy(state) });
    if (method === "POST") {
      const input = routineContactPolicyInputSchema.parse(body);
      if (input.expectedRevision !== (state.adminContactPolicies?.length ?? 0)) return fail("A configuração mudou. Atualize os dados.", 409);
      if (input.sectorIds.some(id => !workspace.sectors.some(sector => sector.id === id))) return fail("Setor indisponível.");
      return result({}, { ...state, adminContactPolicies: [...(state.adminContactPolicies ?? []), input] });
    }
  }
  if (match[1] === "routine-supervision" && method === "GET") return result({ items: [] });
  if (match[1] === "result-baselines") {
    if (method === "GET") return result({ items: state.adminBaselines ?? [] });
    if (method === "POST") {
      const rule = workspace.rules.find(rule => rule.id === (body as { ruleId?: string }).ruleId);
      if (!rule) return fail("Rotina não encontrada.", 404);
      const questionIndex = workspace.questions.findIndex(question => question.id === rule.questionId);
      const question = demoReport.dimensions.flatMap(dimension => dimension.questions)[questionIndex];
      const baseline = resultBaselineSchema.parse({ ...rule, ruleId: rule.id, capturedAt: DEMO_DATE, diagnosticClosedAt: demoReport.diagnostic.closedAt, questionText: question.text, layers: (["fundador", "lideranca", "operacao"] as const).map(group => ({ group, responses: demoReport.responses[group], score: question.layerScores[group] })) });
      return result({}, { ...state, adminBaselines: [...(state.adminBaselines ?? []).filter(item => item.ruleId !== rule.id), baseline] });
    }
  }
  return fail("Esta operação não possui simulação de envio na demo.", 404);
}
