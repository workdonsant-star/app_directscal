import { describe, expect, it } from "vitest";

import { analyzeMaturityResponsesCsv } from "@/lib/data/diagnostic-generator-csv";
import { buildDiagnosticDraft } from "@/lib/data/diagnostic-generator-report";

const header = "resposta;grupo;enviado_em;dimensao;pergunta;nota";
const date = "2026-11-02T12:00:00Z";

describe("CSV do gerador de diagnósticos", () => {
  it("calcula médias por pessoa e grupo sem tratar linhas de pergunta como pessoas", () => {
    const csv = [header,
      `1;fundador;${date};Cultura;"A equipe registra; decisões?";5`,
      `1;fundador;${date};Cultura;Outra pergunta;3`,
      `2;operacao;${date};Cultura;"A equipe registra; decisões?";1`,
      `2;operacao;${date};Cultura;Outra pergunta;1`,
      `3;operacao;${date};Cultura;"A equipe registra; decisões?";3`,
      `3;operacao;${date};Cultura;Outra pergunta;3`,
    ].join("\n");
    const result = analyzeMaturityResponsesCsv(csv);

    expect(result.totalResponses).toBe(3);
    expect(result.score).toBeCloseTo(8 / 3);
    expect(result.layers.fundador).toEqual({ score: 4, responses: 1 });
    expect(result.layers.operacao).toEqual({ score: 2, responses: 2 });
    expect(result.dimensions[0].questions[0].text).toBe("A equipe registra; decisões?");
    expect(result.warnings).toContainEqual(expect.stringContaining("Fundador: 1"));
    const draft = buildDiagnosticDraft(result, { empresa: "Empresa fictícia", achados: "A confirmar em entrevista." });
    expect(draft.find((section) => section.title === "Base e método")?.body).toContain("cada pessoa tem o mesmo peso");
    expect(draft.find((section) => section.title === "Achados e limites para revisão")?.body).toContain("Fundador: 1 resposta(s)");
    expect(draft.find((section) => section.title === "Achados e limites para revisão")?.body).toContain("Achados informados pelo especialista: A confirmar em entrevista.");
  });

  it("recusa resposta incompleta e nota fora da escala", () => {
    const incomplete = [header,
      `1;fundador;${date};Visão;Pergunta A;4`,
      `1;fundador;${date};Visão;Pergunta B;3`,
      `2;operacao;${date};Visão;Pergunta A;2`,
    ].join("\n");
    expect(() => analyzeMaturityResponsesCsv(incomplete)).toThrow("incompleta");
    expect(() => analyzeMaturityResponsesCsv(incomplete.replace("Pergunta A;2", "Pergunta A;6"))).toThrow("escala de 1 a 5");
  });
});
