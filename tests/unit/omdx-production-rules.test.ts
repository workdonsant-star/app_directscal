import { describe, expect, it } from "vitest";

import {
  getResponseCookieName,
  hasMinimumResponsesByGroup,
  minimumResponsesPerGroup,
  normalizeRespondentEmail,
} from "@/lib/data/omdx-production-rules";

describe("OMDx production rules", () => {
  it("normalizes respondent email before duplicate checks", () => {
    expect(normalizeRespondentEmail("  Pessoa@Empresa.COM.BR ")).toBe(
      "pessoa@empresa.com.br",
    );
  });

  it("requires at least three responses per group before reporting", () => {
    expect(
      hasMinimumResponsesByGroup({
        fundador: minimumResponsesPerGroup,
        lideranca: minimumResponsesPerGroup,
        operacao: minimumResponsesPerGroup,
      }),
    ).toBe(true);

    expect(
      hasMinimumResponsesByGroup({
        fundador: minimumResponsesPerGroup,
        lideranca: minimumResponsesPerGroup - 1,
        operacao: minimumResponsesPerGroup,
      }),
    ).toBe(false);
  });

  it("uses stable response cookie names per public token", () => {
    expect(getResponseCookieName("diag-token")).toBe(
      "directscal_omdx_response_diag-token",
    );
  });
});
