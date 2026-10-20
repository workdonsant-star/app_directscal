import { describe, expect, it } from "vitest";
import { adherenceFactPayloadSchema, adherenceRuleSchema, type AdherenceCycle, type AdherenceFact, type AdherenceFactPayload } from "@/lib/contracts/asset-adherence";
import { aggregateAssetAdherence } from "@/lib/data/asset-adherence";
import { averageAdherence, buildActionPointsAdherenceExample } from "@/lib/data/action-points-adherence-example";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const rule = adherenceRuleSchema.parse({ id: id(1), routineId: id(100), revision: 1, organizationId: id(2), diagnosticId: id(3), actionPointId: "AP-001", assetId: id(4), assetVersionId: id(5), questionId: id(6), sectorId: id(7), assignee: { teamId: "workspace-A", userId: "pessoa-A" }, schedule: { kind: "periodica", cadence: "semanal", timeZone: "America/Sao_Paulo" }, expectation: "Conferir a rotina e anexar a evidência do período.", createdAt: "2026-10-01T12:00:00Z" });
const cycle = (n: number, facts: AdherenceFact[] = []): AdherenceCycle => ({ id: id(n), rule, opportunityKey: `periodo-${n}`, opensAt: "2026-10-01T12:00:00Z", dueAt: "2026-10-10T12:00:00Z", facts });
const fact = (n: number, sequence: number, payload: AdherenceFactPayload, cycleId = id(10)): AdherenceFact => ({ id: id(n), cycleId, sequence, payload, actorUserId: id(8), origin: "manual", recordedAt: "2026-10-10T10:00:00Z" });
const window = { organizationId: id(2), from: new Date("2026-10-01T00:00:00Z"), to: new Date("2026-11-01T00:00:00Z"), at: new Date("2026-10-20T00:00:00Z") };
const report = (evidence: string[] = []): AdherenceFactPayload => ({ kind: "execucao_relatada", performed: true, evidence });

describe("base de aderência por oportunidade", () => {
  it("no resumo operacional soma oportunidades, incluindo eventos explícitos, sem média de percentuais", () => {
    const point = buildActionPointsAdherenceExample().categories[0].actionPoints[0];
    expect(averageAdherence([
      { ...point, actualCounts: { eligible: 1, reported: 1, validated: 0 } },
      { ...point, mode: "evento", actualCounts: { eligible: 9, reported: 1, validated: 0 } },
      { ...point, actualCounts: { eligible: 0, reported: 0, validated: 0 } },
    ])).toBe(20);
    expect(averageAdherence([{ ...point, actualCounts: { eligible: 0, reported: 0, validated: 0 } }])).toBeNull();
  });
  it("separa leitura, relato, evidência validada e resultado", () => {
    const c = cycle(10, [fact(20, 1, { kind: "leitura_confirmada" }), fact(21, 2, report(["https://example.invalid/evidencia"])), fact(22, 3, { kind: "evidencia_revisada", executionId: id(21), accepted: true, reason: "Conferência registrada" }), fact(23, 4, { kind: "resultado_registrado", indicator: "Prazo", baseline: 10, observed: 8, unit: "dias", source: "https://example.invalid/fonte", reason: "Medição do período" })]);
    const counts = aggregateAssetAdherence([c, cycle(11)], window).total;
    expect(counts).toMatchObject({ eligible: 2, read: 1, reported: 1, validated: 1, results: 1, missingReport: 1, reportedPercent: 50, validatedPercent: 50 });
    const reading = aggregateAssetAdherence([cycle(10, [fact(20, 1, { kind: "leitura_confirmada" })])], window).total;
    expect(reading).toMatchObject({ read: 1, reported: 0, validated: 0, results: 0 });
  });
  it("mantém a oportunidade no denominador até uma exceção explicitamente aprovada", () => {
    const request = fact(20, 1, { kind: "excecao_solicitada", reason: "Evento não ocorreu" });
    expect(aggregateAssetAdherence([cycle(10, [request])], window).total).toMatchObject({ eligible: 1, excluded: 0, validatedPercent: 0 });
    const approval = fact(21, 2, { kind: "excecao_revisada", requestId: request.id, accepted: true, reason: "Ocorrência conferida" });
    expect(aggregateAssetAdherence([cycle(10, [request, approval])], window).total).toMatchObject({ expected: 1, eligible: 0, excluded: 1, reportedPercent: null, validatedPercent: null });
    const rejection = fact(22, 3, { ...approval.payload, kind: "excecao_revisada", requestId: request.id, accepted: false, reason: "Exceção revista" });
    expect(aggregateAssetAdherence([cycle(10, [request, approval, rejection])], window).total.eligible).toBe(1);
  });
  it("recusa a promoção de relato sem evidência e exige revisão da execução vigente", () => {
    const execution = fact(20, 1, report());
    const approval = fact(21, 2, { kind: "evidencia_revisada", executionId: execution.id, accepted: true, reason: "Revisão" });
    expect(aggregateAssetAdherence([cycle(10, [execution, approval])], window).total).toMatchObject({ reported: 1, validated: 0, awaitingValidation: 1 });
    const withEvidence = { ...execution, payload: report(["https://example.invalid/prova"]) };
    const newReport = fact(22, 3, report(["https://example.invalid/nova-prova"]));
    expect(aggregateAssetAdherence([cycle(10, [withEvidence, approval, newReport])], window).total.validated).toBe(0);
    const rejection = fact(23, 4, { kind: "evidencia_revisada", executionId: newReport.id, accepted: false, reason: "Amostra insuficiente" });
    expect(aggregateAssetAdherence([cycle(10, [withEvidence, approval, newReport, rejection])], window).total.validated).toBe(0);
  });
  it("conta a oportunidade uma vez e agrega somas por pessoa, ativo e setor", () => {
    const a = cycle(10, [fact(20, 1, report())]);
    const b = { ...cycle(11), rule: { ...rule, id: id(40), assignee: { teamId: "workspace-A", userId: "pessoa-B" }, assetId: id(41) } };
    const result = aggregateAssetAdherence([a, a, b], window);
    expect(result.total.eligible).toBe(2);
    expect(Object.values(result.people).map(counts => counts.eligible)).toEqual([1, 1]);
    expect(Object.values(result.assets).map(counts => counts.reported)).toEqual([1, 0]);
    expect(result.sectors[id(7)].reportedPercent).toBe(50);
    expect(() => aggregateAssetAdherence([a, { ...a, dueAt: "2026-10-12T12:00:00Z" }], window)).toThrow("divergentes");
  });
  it("não usa ciclos futuros, fatos futuros ou dados de outra empresa", () => {
    const future = { ...cycle(12), dueAt: "2026-10-30T12:00:00Z" };
    const other = { ...cycle(13), rule: { ...rule, organizationId: id(99) } };
    const futureFact = { ...fact(20, 1, report()), recordedAt: "2026-10-31T12:00:00Z" };
    const result = aggregateAssetAdherence([future, other, cycle(10, [futureFact])], window);
    expect(result.total).toMatchObject({ expected: 1, eligible: 1, upcoming: 1, reported: 0 });
    expect(aggregateAssetAdherence([future], window).total.validatedPercent).toBeNull();
    expect(aggregateAssetAdherence([], window).total.reportedPercent).toBeNull();
  });
  it("respeita limites de prazo e período e não cria ciclos por calendário ou evento ausente", () => {
    const c = cycle(10);
    expect(aggregateAssetAdherence([c], { ...window, at: new Date(c.dueAt) }).total.eligible).toBe(1);
    expect(aggregateAssetAdherence([c], { ...window, to: new Date(c.dueAt) }).total.expected).toBe(0);
    expect(aggregateAssetAdherence([c], { ...window, from: new Date(c.dueAt) }).total.expected).toBe(1);
    expect(() => aggregateAssetAdherence([], { ...window, from: window.to })).toThrow("Período");
    expect(adherenceRuleSchema.safeParse({ ...rule, schedule: { kind: "por_evento", eventKey: "fechamento", timeZone: "America/Sao_Paulo" } }).success).toBe(true);
  });
  it("recusa contratos incompletos e referências inseguras", () => {
    expect(adherenceFactPayloadSchema.safeParse(report(["javascript:alert(1)"])).success).toBe(false);
    expect(adherenceFactPayloadSchema.safeParse({ kind: "evidencia_revisada", accepted: true }).success).toBe(false);
    expect(adherenceRuleSchema.safeParse({ ...rule, questionId: null }).success).toBe(false);
    expect(() => aggregateAssetAdherence([cycle(10, [fact(20, 1, report(), id(99))])], window)).toThrow();
  });
});
