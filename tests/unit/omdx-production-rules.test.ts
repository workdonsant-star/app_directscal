import { describe, expect, it } from "vitest";

import { submitLikertResponseInputSchema } from "@/lib/contracts";
import {
  getResponseCookieName,
  getResponseStorageKey,
  hasCompleteLikertAnswerSet,
  hasFounderAnalysisBase,
  minimumFounderResponsesForAnalysis,
} from "@/lib/data/omdx-production-rules";

describe("OMDx production rules", () => {
  it("requires at least one founder response before analysis", () => {
    expect(
      hasFounderAnalysisBase({
        fundador: minimumFounderResponsesForAnalysis,
        lideranca: 0,
        operacao: 0,
      }),
    ).toBe(true);

    expect(
      hasFounderAnalysisBase({
        fundador: minimumFounderResponsesForAnalysis - 1,
        lideranca: 3,
        operacao: 3,
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
        answers: [{ questionId: "q1", value: 3 }],
      }).success,
    ).toBe(true);
  });

  it("rejects respondent identity in Likert submissions", () => {
    expect(
      submitLikertResponseInputSchema.safeParse({
        token: "diagnostic-token",
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
