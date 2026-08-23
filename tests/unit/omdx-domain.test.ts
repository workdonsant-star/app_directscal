import { describe, expect, it } from "vitest";

import {
  canGenerateDiagnosticReport,
  classifyScore,
  getRespondentGroups,
  isDimensionId,
} from "@/lib/data/omdx-domain";
import type { Diagnostic } from "@/lib/types";

function buildDiagnostic(overrides: Partial<Diagnostic> = {}): Diagnostic {
  return {
    id: "00000000-0000-4000-8000-000000000201",
    organizationId: "00000000-0000-4000-8000-000000000301",
    organizationName: "Directscal",
    company: "Directscal",
    name: "Maturidade",
    description: null,
    templateId: "omdx-v1",
    status: "ativo",
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
    activatedAt: "2026-05-17T00:00:00.000Z",
    closedAt: null,
    deadline: null,
    responses: {
      total: 1,
      fundador: 1,
      lideranca: 0,
      operacao: 0,
    },
    generalScore: 3.4,
    ...overrides,
  };
}

describe("Maturidade domain helpers", () => {
  it("classifies scores using the Maturidade scale", () => {
    expect(classifyScore(2)).toBe("Crítico");
    expect(classifyScore(3)).toBe("Inconsistente");
    expect(classifyScore(4)).toBe("Atenção");
    expect(classifyScore(4.1)).toBe("Consistente");
  });

  it("keeps respondent groups in the expected order", () => {
    expect(getRespondentGroups().map((group) => group.id)).toEqual([
      "fundador",
      "lideranca",
      "operacao",
    ]);
  });

  it("validates known dimension ids", () => {
    expect(isDimensionId("processos")).toBe(true);
    expect(isDimensionId("financeiro")).toBe(false);
  });

  it("requires score and at least one completed response before reports", () => {
    expect(canGenerateDiagnosticReport(buildDiagnostic())).toBe(true);
    expect(
      canGenerateDiagnosticReport(
        buildDiagnostic({
          generalScore: null,
        }),
      ),
    ).toBe(false);
    expect(
      canGenerateDiagnosticReport(
        buildDiagnostic({
          responses: {
            total: 3,
            fundador: 0,
            lideranca: 3,
            operacao: 0,
          },
        }),
      ),
    ).toBe(true);
  });
});
