import type { DiagnosticReport } from "@/lib/contracts";

function instrumentSignature(report: DiagnosticReport) {
  return JSON.stringify({
    template: report.diagnostic.templateId,
    questions: report.dimensions.flatMap(dimension =>
      dimension.questions.map(question => `${dimension.id}:${question.text.trim()}`),
    ).sort(),
  });
}

export function haveCompatibleCollectionInstruments(left: DiagnosticReport, right: DiagnosticReport) {
  return left.diagnostic.organizationId === right.diagnostic.organizationId
    && instrumentSignature(left) === instrumentSignature(right);
}

export function selectCollectionForOverview(reports: DiagnosticReport[], requested?: string) {
  const ordered = [...reports].sort((left, right) =>
    (right.diagnostic.closedAt ?? right.diagnostic.createdAt)
      .localeCompare(left.diagnostic.closedAt ?? left.diagnostic.createdAt)
    || left.diagnostic.id.localeCompare(right.diagnostic.id),
  );
  return ordered.find(report => report.diagnostic.id === requested) ?? ordered[0];
}
