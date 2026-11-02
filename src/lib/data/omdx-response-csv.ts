type ResponseCsvRow = {
  responseNumber: number;
  group: string;
  submittedAt: string;
  dimension: string;
  question: string;
  value: number;
};

const headers = ["resposta", "grupo", "enviado_em", "dimensao", "pergunta", "nota"];

function cell(value: string | number) {
  const text = String(value);
  // Spreadsheet programs can execute formulas from imported CSV cells.
  const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildDiagnosticResponseCsv(rows: ResponseCsvRow[]) {
  return `\uFEFF${[
    headers.join(";"),
    ...rows.map((row) => [
      row.responseNumber,
      row.group,
      row.submittedAt,
      row.dimension,
      row.question,
      row.value,
    ].map(cell).join(";")),
  ].join("\r\n")}\r\n`;
}
