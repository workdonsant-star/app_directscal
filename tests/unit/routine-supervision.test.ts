import { describe, expect, it } from "vitest";
import { adherenceCycleSchema } from "@/lib/contracts/asset-adherence";
import { getRoutineReviewState, type RoutineReviewCycle } from "@/lib/data/routine-supervision";
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const base: RoutineReviewCycle = { title: "Rotina fixture", reviews: [], proposals: [], deliveredAt: "2026-10-18T10:00:00Z", cycle: adherenceCycleSchema.parse({ id: id(10), opportunityKey: "fixture", opensAt: "2026-10-18T09:00:00Z", dueAt: "2026-10-19T17:00:00Z", facts: [],
  rule: { id: id(1), routineId: id(2), revision: 1, organizationId: id(3), diagnosticId: id(4), actionPointId: "action_processos_ritual", assetId: id(5), assetVersionId: id(6), questionId: id(7), sectorId: id(8), assignee: { teamId: "T1", userId: "U1" }, schedule: { kind: "periodica", cadence: "semanal", timeZone: "America/Sao_Paulo" }, expectation: "Conferir", createdAt: "2026-10-18T09:00:00Z" } }) };
const at = new Date("2026-10-20T12:00:00Z");
const execution = { id: id(20), cycleId: id(10), sequence: 1, actorUserId: id(9), origin: "manual" as const, recordedAt: "2026-10-19T12:00:00Z", payload: { kind: "execucao_relatada" as const, performed: true, evidence: ["https://example.invalid/ata"] } };
describe("fila de intervenção por oportunidade", () => {
  it("separa silêncio de execução e escala após 48h sem gerar mensagens", () => {
    expect(getRoutineReviewState(base, new Date("2026-10-18T20:00:00Z")).alerts).toEqual([]);
    expect(getRoutineReviewState(base, new Date("2026-10-19T12:00:00Z")).alerts).toContain("silencio");
    expect(getRoutineReviewState(base, at).alerts).toEqual(["escalado", "atraso"]);
    expect(base.cycle.facts).toEqual([]);
  });
  it("só considera revista a evidência do relato vigente", () => {
    const item = { ...base, cycle: { ...base.cycle, facts: [execution] } };
    expect(getRoutineReviewState(item, at).alerts).toEqual(["evidencia"]);
    const review = { ...execution, id: id(21), sequence: 2, payload: { kind: "evidencia_revisada" as const, executionId: execution.id, accepted: true, reason: "Conferido" } };
    expect(getRoutineReviewState({ ...item, cycle: { ...item.cycle, facts: [execution, review] } }, at).alerts).toEqual([]);
    expect(getRoutineReviewState({ ...item, cycle: { ...item.cycle, facts: [execution, review, { ...execution, id: id(22), sequence: 3 }] } }, at).alerts).toEqual(["evidencia"]);
  });
  it("orientação resolve somente o bloqueio referenciado e não inventa execução", () => {
    const blocked = { ...execution, payload: { ...execution.payload, performed: false, evidence: [] } };
    const proposal = { id: id(30), cycleId: id(10), status: "confirmada" as const, operation: { kind: "bloqueio" as const, reason: "Dependência" }, expiresAt: "2026-10-19T13:00:00Z", createdAt: "2026-10-19T12:00:00Z", factId: blocked.id, actorName: "Pessoa fixture" };
    const item = { ...base, cycle: { ...base.cycle, facts: [blocked] }, proposals: [proposal] };
    expect(getRoutineReviewState(item, at).alerts).toContain("bloqueio");
    const oriented = { ...item, reviews: [{ id: id(40), sequence: 1, operation: "orientar" as const, reason: "Orientação", sourceProposalId: proposal.id, responseDueAt: null, accepted: null, recordedAt: "2026-10-20T10:00:00Z", actorName: "Operação" }] };
    expect(getRoutineReviewState(oriented, at).alerts).toEqual(["atraso"]);
    expect(oriented.cycle.facts[0].payload.performed).toBe(false);
  });
  it("prazo de retorno não altera o prazo original nem o denominador", () => {
    const item = { ...base, reviews: [{ id: id(40), sequence: 1, operation: "prazo" as const, reason: "Novo retorno", sourceProposalId: null, responseDueAt: "2026-10-21T15:00:00Z", accepted: null, recordedAt: "2026-10-20T10:00:00Z", actorName: "Operação" }] };
    expect(getRoutineReviewState(item, at).alerts).not.toContain("atraso");
    expect(item.cycle.dueAt).toBe("2026-10-19T17:00:00Z");
  });
  it("relato pendente de confirmação não é silêncio nem execução", () => {
    const item = { ...base, proposals: [{ id: id(30), cycleId: id(10), status: "pendente" as const, operation: { kind: "leitura" as const }, expiresAt: "2026-10-19T13:00:00Z", createdAt: "2026-10-19T12:00:00Z", factId: null, actorName: "Pessoa fixture" }] };
    expect(getRoutineReviewState(item, at).alerts).toEqual(["atraso", "confirmacao"]);
  });
});
