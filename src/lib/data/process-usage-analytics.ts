import type { ManagementAssetType } from "@/lib/contracts";
import { getManagementAssetHref } from "@/lib/data/management-asset-routes";

// Indicadores de uso dos processos a partir das perguntas ao agente (app e
// Slack). Medem adoção, cobertura e utilidade dos ativos publicados; não medem
// se o processo é executado conforme o documento.

export const PROCESS_USAGE_PERIOD_DAYS = 30;
export const PROCESS_USAGE_WEEKS = 8;
export const PROCESS_USAGE_TOP_PROCESSES = 6;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ProcessUsageAuditInput = {
  id: string;
  createdAt: string;
  status: "respondida" | "insuficiente" | "erro";
  askerKey: string | null;
  citations: Array<{ assetId: string; title: string; assetType: ManagementAssetType }>;
};

export type ProcessUsageFeedbackInput = {
  auditId: string;
  value: "util" | "nao_util";
};

export type ProcessUsageMetric = {
  // Percentual inteiro de 0 a 100; null quando não há base no período.
  value: number | null;
  previous: number | null;
  deltaPoints: number | null;
  detail: string;
};

export type ProcessUsageWeek = {
  start: string;
  label: string;
  answered: number;
  gaps: number;
};

export type ProcessUsageProcess = {
  assetId: string;
  title: string;
  assetType: ManagementAssetType;
  href: string | null;
  questions: number;
  notUseful: number;
};

export type ProcessUsageAnalytics = {
  periodDays: number;
  totals: {
    questions: number;
    answered: number;
    gaps: number;
    askers: number;
    teamSize: number;
  };
  adoption: ProcessUsageMetric;
  coverage: ProcessUsageMetric;
  usefulness: ProcessUsageMetric;
  weekly: ProcessUsageWeek[];
  processes: ProcessUsageProcess[];
};

const weekLabelFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function percent(numerator: number, denominator: number) {
  if (denominator <= 0) return null;
  return Math.round(Math.min(numerator / denominator, 1) * 100);
}

function metric(value: number | null, previous: number | null, detail: string) {
  return {
    value,
    previous,
    deltaPoints: value !== null && previous !== null ? value - previous : null,
    detail,
  };
}

function inWindow(audit: ProcessUsageAuditInput, start: number, end: number) {
  const time = new Date(audit.createdAt).getTime();
  return time >= start && time < end;
}

function summarizeWindow(
  audits: ProcessUsageAuditInput[],
  feedbackByAudit: Map<string, ProcessUsageFeedbackInput["value"]>,
) {
  const answered = audits.filter((audit) => audit.status === "respondida").length;
  // Falhas técnicas não são lacuna de documentação; ficam fora da cobertura.
  const gaps = audits.filter((audit) => audit.status === "insuficiente").length;
  const askers = new Set(
    audits.map((audit) => audit.askerKey).filter((key): key is string => Boolean(key)),
  ).size;
  let useful = 0;
  let notUseful = 0;

  for (const audit of audits) {
    const value = feedbackByAudit.get(audit.id);
    if (value === "util") useful += 1;
    if (value === "nao_util") notUseful += 1;
  }

  return { answered, gaps, askers, useful, notUseful, questions: audits.length };
}

export function buildProcessUsageAnalytics(input: {
  audits: ProcessUsageAuditInput[];
  feedback: ProcessUsageFeedbackInput[];
  teamSize: number;
  now?: Date;
}): ProcessUsageAnalytics {
  const now = (input.now ?? new Date()).getTime();
  const periodMs = PROCESS_USAGE_PERIOD_DAYS * DAY_MS;
  const feedbackByAudit = new Map(
    input.feedback.map((item) => [item.auditId, item.value]),
  );
  const currentAudits = input.audits.filter((audit) =>
    inWindow(audit, now - periodMs, now),
  );
  const previousAudits = input.audits.filter((audit) =>
    inWindow(audit, now - 2 * periodMs, now - periodMs),
  );
  const current = summarizeWindow(currentAudits, feedbackByAudit);
  const previous = summarizeWindow(previousAudits, feedbackByAudit);
  const teamSize = Math.max(input.teamSize, 0);

  const weekly = Array.from({ length: PROCESS_USAGE_WEEKS }, (_, index) => {
    const start = now - (PROCESS_USAGE_WEEKS - index) * 7 * DAY_MS;
    const end = start + 7 * DAY_MS;
    const weekAudits = input.audits.filter((audit) => inWindow(audit, start, end));

    return {
      start: new Date(start).toISOString(),
      label: weekLabelFormatter.format(new Date(start)),
      answered: weekAudits.filter((audit) => audit.status === "respondida").length,
      gaps: weekAudits.filter((audit) => audit.status === "insuficiente").length,
    };
  });

  const processById = new Map<string, ProcessUsageProcess>();

  for (const audit of currentAudits) {
    if (audit.status !== "respondida") continue;

    const seen = new Set<string>();

    for (const citation of audit.citations) {
      if (seen.has(citation.assetId)) continue;
      seen.add(citation.assetId);

      const entry = processById.get(citation.assetId) ?? {
        assetId: citation.assetId,
        title: citation.title,
        assetType: citation.assetType,
        href: getManagementAssetHref(citation.assetType, citation.assetId),
        questions: 0,
        notUseful: 0,
      };

      entry.questions += 1;
      if (feedbackByAudit.get(audit.id) === "nao_util") entry.notUseful += 1;
      processById.set(citation.assetId, entry);
    }
  }

  const processes = Array.from(processById.values())
    .sort(
      (first, second) =>
        second.questions - first.questions ||
        first.title.localeCompare(second.title, "pt-BR"),
    )
    .slice(0, PROCESS_USAGE_TOP_PROCESSES);

  const coverageBase = current.answered + current.gaps;
  const ratedBase = current.useful + current.notUseful;

  return {
    periodDays: PROCESS_USAGE_PERIOD_DAYS,
    totals: {
      questions: current.questions,
      answered: current.answered,
      gaps: current.gaps,
      askers: current.askers,
      teamSize,
    },
    adoption: metric(
      percent(current.askers, teamSize),
      percent(previous.askers, teamSize),
      teamSize > 0
        ? `${current.askers} de ${teamSize} pessoas perguntaram`
        : "Cadastre lideranças e time para calcular",
    ),
    coverage: metric(
      percent(current.answered, coverageBase),
      percent(previous.answered, previous.answered + previous.gaps),
      coverageBase > 0
        ? `${current.answered} de ${coverageBase} perguntas com fonte`
        : "Sem perguntas no período",
    ),
    usefulness: metric(
      percent(current.useful, ratedBase),
      percent(previous.useful, previous.useful + previous.notUseful),
      ratedBase > 0
        ? `${current.useful} de ${ratedBase} avaliações úteis`
        : "Sem avaliações no período",
    ),
    weekly,
    processes,
  };
}
