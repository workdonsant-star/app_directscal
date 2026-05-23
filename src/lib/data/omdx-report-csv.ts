import { classifyScore } from "@/lib/data/omdx-domain";
import type {
  DiagnosticReport,
  DiagnosticReportDimension,
  DiagnosticReportMisalignment,
  DiagnosticReportQuestion,
  RespondentGroup,
} from "@/lib/types";

export const reportCsvHeaders = [
  "secao",
  "campo",
  "diagnostico_id",
  "diagnostico",
  "empresa",
  "gerado_em",
  "dimensao_numero",
  "dimensao_id",
  "dimensao",
  "pergunta_id",
  "pergunta",
  "score",
  "classificacao",
  "respostas_total",
  "respostas_fundador",
  "respostas_lideranca",
  "respostas_operacao",
  "score_fundador",
  "score_lideranca",
  "score_operacao",
  "variancia",
  "gap",
  "grupo_maior_score",
  "grupo_menor_score",
  "descricao",
] as const;

type ReportCsvHeader = (typeof reportCsvHeaders)[number];
type CsvCell = number | string | null | undefined;
type ReportCsvRow = Record<ReportCsvHeader, CsvCell>;

const groupLabels: Record<RespondentGroup, string> = {
  fundador: "Fundador",
  lideranca: "Liderança",
  operacao: "Operação",
};

function formatScore(value: number | null | undefined) {
  if (value === null || value === undefined) return null;

  return value.toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  });
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return null;

  return value.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function escapeCsvCell(value: CsvCell) {
  if (value === null || value === undefined) return "";

  return `"${String(value).replace(/"/g, '""')}"`;
}

function toCsvLine(row: ReportCsvRow) {
  return reportCsvHeaders.map((header) => escapeCsvCell(row[header])).join(";");
}

function getBaseRow(
  report: DiagnosticReport,
  section: ReportCsvRow["secao"],
  field: ReportCsvRow["campo"],
): ReportCsvRow {
  return {
    campo: field,
    classificacao: null,
    descricao: null,
    diagnostico: report.diagnostic.name,
    diagnostico_id: report.diagnostic.id,
    dimensao: null,
    dimensao_id: null,
    dimensao_numero: null,
    empresa: report.diagnostic.company,
    gap: null,
    gerado_em: report.generatedAt,
    grupo_maior_score: null,
    grupo_menor_score: null,
    pergunta: null,
    pergunta_id: null,
    respostas_fundador: null,
    respostas_lideranca: null,
    respostas_operacao: null,
    respostas_total: null,
    score: null,
    score_fundador: null,
    score_lideranca: null,
    score_operacao: null,
    secao: section,
    variancia: null,
  };
}

function getMisalignmentFromScores(
  scores: Record<RespondentGroup, number | null>,
): DiagnosticReportMisalignment | null {
  const availableScores = (Object.keys(scores) as RespondentGroup[])
    .map((group) => ({
      group,
      score: scores[group],
    }))
    .filter(
      (item): item is { group: RespondentGroup; score: number } =>
        item.score !== null,
    );

  if (availableScores.length < 2) return null;

  const highest = [...availableScores].sort((a, b) => b.score - a.score)[0];
  const lowest = [...availableScores].sort((a, b) => a.score - b.score)[0];

  if (highest.score === lowest.score) return null;

  return {
    highestGroup: highest.group,
    lowestGroup: lowest.group,
    value: highest.score - lowest.score,
  };
}

function getResponsesForScores(
  report: DiagnosticReport,
  scores: Record<RespondentGroup, number | null>,
) {
  return {
    fundador: scores.fundador === null ? 0 : report.responses.fundador,
    lideranca: scores.lideranca === null ? 0 : report.responses.lideranca,
    operacao: scores.operacao === null ? 0 : report.responses.operacao,
  };
}

function buildSummaryRows(report: DiagnosticReport): ReportCsvRow[] {
  const weakestDimension = report.dimensions.find(
    (dimension) => dimension.id === report.weakestDimension.id,
  );
  const highestMisalignmentDimension = report.highestMisalignment
    ? report.dimensions.find(
        (dimension) =>
          dimension.id === report.highestMisalignment?.dimensionId,
      )
    : undefined;

  return [
    {
      ...getBaseRow(report, "resumo", "score_geral"),
      classificacao: report.classification,
      descricao: "Score geral consolidado do diagnóstico.",
      respostas_fundador: report.responses.fundador,
      respostas_lideranca: report.responses.lideranca,
      respostas_operacao: report.responses.operacao,
      respostas_total: report.responses.total,
      score: formatScore(report.generalScore),
    },
    {
      ...getBaseRow(report, "resumo", "maior_gargalo"),
      classificacao: report.weakestDimension.classification,
      descricao: "Dimensão com menor score consolidado.",
      dimensao: report.weakestDimension.name,
      dimensao_id: report.weakestDimension.id,
      dimensao_numero: weakestDimension?.number,
      gap: formatScore(weakestDimension?.misalignment?.value),
      respostas_fundador: report.responses.fundador,
      respostas_lideranca: report.responses.lideranca,
      respostas_operacao: report.responses.operacao,
      respostas_total: weakestDimension?.responses ?? report.responses.total,
      score: formatScore(report.weakestDimension.score),
      score_fundador: formatScore(weakestDimension?.layerScores.fundador),
      score_lideranca: formatScore(weakestDimension?.layerScores.lideranca),
      score_operacao: formatScore(weakestDimension?.layerScores.operacao),
    },
    {
      ...getBaseRow(report, "resumo", "maior_desalinhamento"),
      classificacao: highestMisalignmentDimension?.classification,
      descricao: report.highestMisalignment
        ? "Dimensão com maior diferença de percepção entre camadas."
        : "Sem base suficiente para comparar camadas.",
      dimensao: report.highestMisalignment?.dimensionName,
      dimensao_id: report.highestMisalignment?.dimensionId,
      dimensao_numero: highestMisalignmentDimension?.number,
      gap: formatScore(report.highestMisalignment?.value),
      grupo_maior_score: report.highestMisalignment
        ? groupLabels[report.highestMisalignment.highestGroup]
        : null,
      grupo_menor_score: report.highestMisalignment
        ? groupLabels[report.highestMisalignment.lowestGroup]
        : null,
      respostas_fundador: report.responses.fundador,
      respostas_lideranca: report.responses.lideranca,
      respostas_operacao: report.responses.operacao,
      respostas_total:
        highestMisalignmentDimension?.responses ?? report.responses.total,
      score: formatScore(highestMisalignmentDimension?.score),
      score_fundador: formatScore(
        highestMisalignmentDimension?.layerScores.fundador,
      ),
      score_lideranca: formatScore(
        highestMisalignmentDimension?.layerScores.lideranca,
      ),
      score_operacao: formatScore(
        highestMisalignmentDimension?.layerScores.operacao,
      ),
    },
    {
      ...getBaseRow(report, "resumo", "media_por_camada"),
      descricao: "Média consolidada por camada respondente.",
      respostas_fundador: report.responses.fundador,
      respostas_lideranca: report.responses.lideranca,
      respostas_operacao: report.responses.operacao,
      respostas_total: report.responses.total,
      score_fundador: formatScore(report.layerAverages.fundador),
      score_lideranca: formatScore(report.layerAverages.lideranca),
      score_operacao: formatScore(report.layerAverages.operacao),
    },
  ];
}

function buildDimensionRow(
  report: DiagnosticReport,
  dimension: DiagnosticReportDimension,
): ReportCsvRow {
  const responses = getResponsesForScores(report, dimension.layerScores);

  return {
    ...getBaseRow(report, "dimensao", dimension.id),
    classificacao: dimension.classification,
    descricao: dimension.description,
    dimensao: dimension.name,
    dimensao_id: dimension.id,
    dimensao_numero: dimension.number,
    gap: formatScore(dimension.misalignment?.value),
    grupo_maior_score: dimension.misalignment
      ? groupLabels[dimension.misalignment.highestGroup]
      : null,
    grupo_menor_score: dimension.misalignment
      ? groupLabels[dimension.misalignment.lowestGroup]
      : null,
    respostas_fundador: responses.fundador,
    respostas_lideranca: responses.lideranca,
    respostas_operacao: responses.operacao,
    respostas_total: dimension.responses,
    score: formatScore(dimension.score),
    score_fundador: formatScore(dimension.layerScores.fundador),
    score_lideranca: formatScore(dimension.layerScores.lideranca),
    score_operacao: formatScore(dimension.layerScores.operacao),
    variancia: formatNumber(dimension.variance),
  };
}

function buildQuestionRow({
  dimension,
  question,
  report,
}: {
  dimension: DiagnosticReportDimension;
  question: DiagnosticReportQuestion;
  report: DiagnosticReport;
}): ReportCsvRow {
  const misalignment = getMisalignmentFromScores(question.layerScores);
  const responses = getResponsesForScores(report, question.layerScores);

  return {
    ...getBaseRow(report, "pergunta", question.id),
    classificacao: classifyScore(question.score),
    dimensao: dimension.name,
    dimensao_id: dimension.id,
    dimensao_numero: dimension.number,
    gap: formatScore(misalignment?.value),
    grupo_maior_score: misalignment
      ? groupLabels[misalignment.highestGroup]
      : null,
    grupo_menor_score: misalignment
      ? groupLabels[misalignment.lowestGroup]
      : null,
    pergunta: question.text,
    pergunta_id: question.id,
    respostas_fundador: responses.fundador,
    respostas_lideranca: responses.lideranca,
    respostas_operacao: responses.operacao,
    respostas_total: question.responses,
    score: formatScore(question.score),
    score_fundador: formatScore(question.layerScores.fundador),
    score_lideranca: formatScore(question.layerScores.lideranca),
    score_operacao: formatScore(question.layerScores.operacao),
    variancia: formatNumber(question.variance),
  };
}

export function buildDiagnosticReportCsv(report: DiagnosticReport) {
  const rows = [
    ...buildSummaryRows(report),
    ...report.dimensions.map((dimension) => buildDimensionRow(report, dimension)),
    ...report.dimensions.flatMap((dimension) =>
      dimension.questions.map((question) =>
        buildQuestionRow({
          dimension,
          question,
          report,
        }),
      ),
    ),
  ];
  const lines = [reportCsvHeaders.join(";"), ...rows.map(toCsvLine)];

  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
