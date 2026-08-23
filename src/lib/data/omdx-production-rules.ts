import type { ResponsesByGroup } from "@/lib/contracts";

export const minimumResponsesForAnalysis = 1;

type LikertAnswerCandidate = {
  questionId: string;
};

export function hasAnalysisBase(
  responses: Pick<ResponsesByGroup, "fundador" | "lideranca" | "operacao">,
) {
  return (
    responses.fundador + responses.lideranca + responses.operacao >=
    minimumResponsesForAnalysis
  );
}

export function getResponseCookieName(token: string) {
  return `directscal_omdx_response_${token}`;
}

export function getResponseStorageKey(token: string) {
  return `directscal:omdx-response:${token}`;
}

export function hasCompleteLikertAnswerSet(
  answers: LikertAnswerCandidate[],
  expectedQuestionIds: string[],
) {
  const expected = new Set(expectedQuestionIds);

  if (answers.length !== expected.size) return false;

  const seen = new Set<string>();

  for (const answer of answers) {
    if (!expected.has(answer.questionId) || seen.has(answer.questionId)) {
      return false;
    }

    seen.add(answer.questionId);
  }

  return seen.size === expected.size;
}
