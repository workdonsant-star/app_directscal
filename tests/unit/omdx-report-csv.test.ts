import { describe, expect, it } from "vitest";

import {
  buildDiagnosticReportCsv,
  reportCsvHeaders,
} from "@/lib/data/omdx-report-csv";
import type { DiagnosticReport } from "@/lib/types";

const report: DiagnosticReport = {
  classification: "Atenção",
  diagnostic: {
    activatedAt: "2026-05-20T10:00:00.000Z",
    closedAt: null,
    company: "Atlas; Labs",
    createdAt: "2026-05-20T10:00:00.000Z",
    deadline: null,
    description: null,
    generalScore: 3.6,
    id: "diag-1",
    name: 'Diagnóstico "A"; fase 1',
    organizationId: "org-1",
    organizationName: "Atlas; Labs",
    responses: {
      fundador: 1,
      lideranca: 0,
      operacao: 2,
      total: 3,
    },
    status: "ativo",
    templateId: "omdx-v1",
    updatedAt: "2026-05-20T10:00:00.000Z",
  },
  dimensions: [
    {
      classification: "Inconsistente",
      description: 'Rituais "críticos"; sem cadência clara.',
      id: "processos",
      layerScores: {
        fundador: 4,
        lideranca: null,
        operacao: 2,
      },
      misalignment: {
        highestGroup: "fundador",
        lowestGroup: "operacao",
        value: 2,
      },
      name: "Processos",
      number: 4,
      question: "Como a operação sustenta rotina e escala?",
      questions: [
        {
          diagnosticId: "diag-1",
          dimensionId: "processos",
          id: "q-1",
          layerScores: {
            fundador: 4,
            lideranca: null,
            operacao: 2,
          },
          responses: 3,
          score: 2.5,
          text: 'A operação tem "rituais"; claros?',
          variance: 1.25,
        },
      ],
      responses: 3,
      score: 2.4,
      shortName: "Processos",
      variance: 0.67,
    },
  ],
  generalScore: 3.6,
  generatedAt: "2026-05-21T12:30:00.000Z",
  highestMisalignment: {
    dimensionId: "processos",
    dimensionName: "Processos",
    highestGroup: "fundador",
    lowestGroup: "operacao",
    value: 2,
  },
  layerAverages: {
    fundador: 4.2,
    lideranca: null,
    operacao: 2.8,
  },
  responses: {
    fundador: 1,
    lideranca: 0,
    operacao: 2,
    total: 3,
  },
  threshold: 3,
  weakestDimension: {
    classification: "Inconsistente",
    id: "processos",
    name: "Processos",
    score: 2.4,
    shortName: "Processos",
  },
};

function getCsvLines(csv: string) {
  return csv.replace(/^\uFEFF/, "").trimEnd().split("\r\n");
}

describe("Maturidade report CSV", () => {
  it("builds a stable CSV with summary, dimension and question rows", () => {
    const csv = buildDiagnosticReportCsv(report);
    const lines = getCsvLines(csv);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(lines[0]).toBe(reportCsvHeaders.join(";"));
    expect(lines.filter((line) => line.startsWith('"resumo";'))).toHaveLength(4);
    expect(lines.filter((line) => line.startsWith('"dimensao";'))).toHaveLength(1);
    expect(lines.filter((line) => line.startsWith('"pergunta";'))).toHaveLength(1);
  });

  it("escapes text cells and keeps null layer values empty", () => {
    const csv = buildDiagnosticReportCsv(report);

    expect(csv).toContain('"Diagnóstico ""A""; fase 1"');
    expect(csv).toContain('"A operação tem ""rituais""; claros?"');
    expect(csv).toContain('"Rituais ""críticos""; sem cadência clara."');
    expect(csv).toContain(';"4,2";;"2,8";');
    expect(csv).toContain(';"4,0";;"2,0";');
  });
});
