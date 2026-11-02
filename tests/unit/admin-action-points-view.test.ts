import { describe, expect, it } from "vitest";
import type { AdminRoutineWorkspace } from "@/lib/contracts/admin-adherence";
import { groupAdminActionPoints } from "@/lib/data/admin-action-points-view";

const workspace: AdminRoutineWorkspace = {
  companyId: "company_example", companyName: "Empresa Exemplo", questions: [], sectors: [], events: [],
  assets: [{ id: "asset-1", versionId: "v2", title: "Ritual de prioridades", version: "2" }],
  actions: [
    { diagnosticId: "d1", diagnosticName: "Diagnóstico A", actionPointId: "ap1", title: "Revisar prioridades", description: "", successIndicator: "", assignment: { teamId: "t1", userId: "u1", name: "Ana Lima", updatedAt: "2026-11-01T10:00:00Z" } },
    { diagnosticId: "d1", diagnosticName: "Diagnóstico A", actionPointId: "ap2", title: "Registrar desvios", description: "", successIndicator: "", assignment: { teamId: "t1", userId: "u1", name: "Ana Lima", updatedAt: "2026-11-01T10:00:00Z" } },
    { diagnosticId: "d2", diagnosticName: "Diagnóstico B", actionPointId: "ap1", title: "Definir responsáveis", description: "", successIndicator: "", assignment: null },
  ],
  rules: [
    { id: "r1", routineId: "routine-1", revision: 1, diagnosticId: "d1", actionPointId: "ap1", title: "Antiga", successIndicator: "", expectation: "", assetId: "asset-0", assetVersionId: "v1", questionId: "q1", sectorId: "s1", assigneeUserId: "u1", schedule: { kind: "periodica", cadence: "mensal", timeZone: "America/Sao_Paulo" }, createdAt: "2026-10-01T10:00:00Z", reason: null, actorName: "Consultor" },
    { id: "r2", routineId: "routine-1", revision: 2, diagnosticId: "d1", actionPointId: "ap1", title: "Atual", successIndicator: "", expectation: "", assetId: "asset-1", assetVersionId: "v2", questionId: "q1", sectorId: "s1", assigneeUserId: "u1", schedule: { kind: "periodica", cadence: "semanal", timeZone: "America/Sao_Paulo" }, createdAt: "2026-11-01T10:00:00Z", reason: null, actorName: "Consultor" },
    { id: "r3", routineId: "routine-2", revision: 1, diagnosticId: "d1", actionPointId: "ap1", title: "Outra rotina", successIndicator: "", expectation: "", assetId: "asset-1", assetVersionId: "v2", questionId: "q1", sectorId: "s1", assigneeUserId: "u1", schedule: { kind: "periodica", cadence: "mensal", timeZone: "America/Sao_Paulo" }, createdAt: "2026-11-01T10:00:00Z", reason: null, actorName: "Consultor" },
  ],
};

describe("visão administrativa de Action Points", () => {
  it("agrupa por responsável e usa a revisão vigente sem confundir diagnósticos", () => {
    const groups = groupAdminActionPoints(workspace);
    expect(groups.map(group => [group.name, group.actions.length])).toEqual([["Ana Lima", 2], ["Sem responsável", 1]]);
    expect(groups[0].actions[0].routines).toMatchObject([{ assetTitle: "Ritual de prioridades", rule: { id: "r2", revision: 2 } }, { rule: { id: "r3" } }]);
    expect(groups[1].actions[0].routines).toEqual([]);
  });
});
