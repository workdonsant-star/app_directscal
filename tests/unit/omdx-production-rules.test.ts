import { describe, expect, it } from "vitest";

import { createDiagnosticInputSchema, submitLikertResponseInputSchema } from "@/lib/contracts";
import {
  getResponseCookieName,
  getEffectiveDiagnosticStatus,
  hasDiagnosticDeadlinePassed,
  getResponseStorageKey,
  hasCompleteLikertAnswerSet,
  hasAnalysisBase,
  minimumResponsesForAnalysis,
} from "@/lib/data/omdx-production-rules";

describe("Maturidade production rules", () => {
  it("accepts a completed response from any respondent group before analysis", () => {
    expect(
      hasAnalysisBase({
        fundador: minimumResponsesForAnalysis,
        lideranca: 0,
        operacao: 0,
      }),
    ).toBe(true);

    expect(
      hasAnalysisBase({
        fundador: minimumResponsesForAnalysis - 1,
        lideranca: 3,
        operacao: 3,
      }),
    ).toBe(true);

    expect(
      hasAnalysisBase({
        fundador: 0,
        lideranca: 0,
        operacao: 0,
      }),
    ).toBe(false);
  });

  it("uses stable response cookie names per public token", () => {
    expect(getResponseCookieName("diag-token")).toBe(
      "directscal_omdx_response_diag-token",
    );
  });

  it("uses stable response storage keys per public token", () => {
    expect(getResponseStorageKey("diag-token")).toBe(
      "directscal:omdx-response:diag-token",
    );
  });

  it("requires one answer for each expected question", () => {
    const expectedQuestionIds = ["q1", "q2", "q3"];

    expect(
      hasCompleteLikertAnswerSet(
        [
          { questionId: "q1" },
          { questionId: "q2" },
          { questionId: "q3" },
        ],
        expectedQuestionIds,
      ),
    ).toBe(true);

    expect(
      hasCompleteLikertAnswerSet(
        [
          { questionId: "q1" },
          { questionId: "q2" },
        ],
        expectedQuestionIds,
      ),
    ).toBe(false);

    expect(
      hasCompleteLikertAnswerSet(
        [
          { questionId: "q1" },
          { questionId: "q1" },
          { questionId: "q2" },
        ],
        expectedQuestionIds,
      ),
    ).toBe(false);

    expect(
      hasCompleteLikertAnswerSet(
        [
          { questionId: "q1" },
          { questionId: "q2" },
          { questionId: "q4" },
        ],
        expectedQuestionIds,
      ),
    ).toBe(false);
  });

  it("accepts anonymous Likert submissions", () => {
    expect(
      submitLikertResponseInputSchema.safeParse({
        token: "diagnostic-token",
        submissionId: "00000000-0000-4000-8000-000000000001",
        answers: [{ questionId: "q1", value: 3 }],
      }).success,
    ).toBe(true);
  });

  it("rejects respondent identity in Likert submissions", () => {
    expect(
      submitLikertResponseInputSchema.safeParse({
        token: "diagnostic-token",
        submissionId: "00000000-0000-4000-8000-000000000001",
        respondent: {
          email: "pessoa@empresa.com.br",
          name: "Pessoa",
          role: "Operacao",
        },
        answers: [{ questionId: "q1", value: 3 }],
      }).success,
    ).toBe(false);
  });
});

describe("diagnostic deadline in Sao Paulo", () => {
  it("accepts responses through the end of the selected day", () => {
    expect(hasDiagnosticDeadlinePassed("2026-10-18", new Date("2026-10-19T02:59:59.999Z"))).toBe(false);
    expect(hasDiagnosticDeadlinePassed("2026-10-18", new Date("2026-10-19T03:00:00Z"))).toBe(true);
  });

  it("handles month and year boundaries", () => {
    expect(hasDiagnosticDeadlinePassed("2026-12-31", new Date("2027-01-01T03:00:00Z"))).toBe(true);
    expect(hasDiagnosticDeadlinePassed("2026-10-31", new Date("2026-11-01T02:59:59Z"))).toBe(false);
  });

  it("keeps research without a deadline available", () => {
    expect(hasDiagnosticDeadlinePassed(null)).toBe(false);
    expect(hasDiagnosticDeadlinePassed(undefined)).toBe(false);
  });
});

describe("effective diagnostic status", () => {
  const now = new Date("2026-10-19T03:00:00Z");
  it("closes active research after its deadline", () => {
    expect(getEffectiveDiagnosticStatus({ status: "ativo", deadline: "2026-10-18", closedAt: null }, now)).toBe("encerrado");
  });
  it("keeps research active through its deadline day and without deadline", () => {
    for (const deadline of ["2026-10-19", null]) {
      expect(getEffectiveDiagnosticStatus({ status: "ativo", deadline, closedAt: null }, now)).toBe("ativo");
    }
  });
  it("preserves manual closure regardless of deadline", () => {
    expect(getEffectiveDiagnosticStatus({ status: "encerrado", deadline: "2026-10-30", closedAt: null }, now)).toBe("encerrado");
    expect(getEffectiveDiagnosticStatus({ status: "ativo", deadline: null, closedAt: "2026-10-18T15:00:00Z" }, now)).toBe("encerrado");
  });
  it("keeps drafts configurable even with a past deadline", () => {
    expect(getEffectiveDiagnosticStatus({ status: "rascunho", deadline: "2026-10-18", closedAt: null }, now)).toBe("rascunho");
  });
});

describe("required research deadline", () => {
  const payload = { name: "Pesquisa", templateId: "omdx-v1", leaderIds: [] };
  it("accepts an explicit deadline", () => {
    expect(createDiagnosticInputSchema.safeParse({ ...payload, deadline: "2026-10-19" }).success).toBe(true);
  });
  it("rejects missing, null and empty deadline", () => {
    for (const deadline of [undefined, null, ""]) {
      expect(createDiagnosticInputSchema.safeParse({ ...payload, deadline }).success).toBe(false);
    }
  });
});
