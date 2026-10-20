import type { Diagnostic, DiagnosticStatus, ResponsesByGroup } from "@/lib/contracts";

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

export function hasDiagnosticDeadlinePassed(
  deadline: string | null | undefined,
  now = new Date(),
) {
  if (!deadline) return false;

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return today > deadline;
}

export function getEffectiveDiagnosticStatus(
  diagnostic: Pick<Diagnostic, "status" | "deadline" | "closedAt">,
  now = new Date(),
): DiagnosticStatus {
  if (diagnostic.status === "encerrado" || diagnostic.closedAt) return "encerrado";
  if (diagnostic.status === "ativo" && hasDiagnosticDeadlinePassed(diagnostic.deadline, now)) return "encerrado";
  return diagnostic.status;
}
