import type { GeneratorAnalysis } from "@/lib/data/diagnostic-generator-csv";

export type DiagnosticDraftSection = { title: string; body: string };

const score = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const groupLabels = { fundador: "Fundador", lideranca: "Liderança", operacao: "Operação" } as const;

function supplied(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

export function buildDiagnosticDraft(analysis: GeneratorAnalysis, briefing: Record<string, string>): DiagnosticDraftSection[] {
  const ordered = [...analysis.dimensions].sort((first, second) => first.score - second.score);
  const gaps = [...analysis.dimensions].filter((dimension) => dimension.gap !== null).sort((first, second) => (second.gap ?? 0) - (first.gap ?? 0));
  const lowest = ordered[0];
  const largestGap = gaps[0];
  const period = `${new Date(analysis.period.first).toLocaleDateString("pt-BR")} a ${new Date(analysis.period.last).toLocaleDateString("pt-BR")}`;

  return [
    {
      title: "Identificação e objetivo",
      body: `Empresa ou área: ${supplied(briefing.empresa, "A informar")}\nTítulo: ${supplied(briefing.titulo, "Diagnóstico de maturidade")}\nPeríodo das respostas: ${period}\nObjetivo informado: ${supplied(briefing.objetivo, "A definir na revisão do briefing.")}`,
    },
    {
      title: "Base e método",
      body: `Foram analisadas ${analysis.totalResponses} respostas completas a ${analysis.dimensions.reduce((total, dimension) => total + dimension.questions.length, 0)} perguntas de percepção, em escala de 1 a 5. Base por grupo: Fundador ${analysis.layers.fundador.responses}; Liderança ${analysis.layers.lideranca.responses}; Operação ${analysis.layers.operacao.responses}. A nota geral é a média das notas individuais; cada pessoa tem o mesmo peso. As notas por dimensão seguem o mesmo critério. A comparação entre grupos descreve percepções e não demonstra causa.\n\nFontes complementares informadas: ${supplied(briefing.fontes, "Nenhuma fonte complementar informada.")}\nMétodo adicional informado: ${supplied(briefing.metodo, "Nenhum método adicional informado.")}`,
    },
    {
      title: "Leitura executiva",
      body: `A média geral da pesquisa foi ${score(analysis.score)} de 5. A menor média entre as dimensões foi ${lowest.name}, com ${score(lowest.score)}. ${largestGap ? `A maior diferença entre médias de grupos ocorreu em ${largestGap.name}, com ${score(largestGap.gap ?? 0)} ponto(s).` : "Não há grupos suficientes para calcular diferenças entre camadas."} Esses resultados orientam investigação; não confirmam, por si, o mecanismo que produziu as respostas.`,
    },
    {
      title: "Resultados por dimensão",
      body: ordered.map((dimension) => {
        const groups = (Object.keys(groupLabels) as Array<keyof typeof groupLabels>).map((group) => {
          const value = dimension.layers[group].score;
          return `${groupLabels[group]} ${value === null ? "sem base" : score(value)}`;
        }).join("; ");
        return `${dimension.name}: média ${score(dimension.score)}; ${groups}; diferença entre grupos ${dimension.gap === null ? "indisponível" : score(dimension.gap)}.`;
      }).join("\n"),
    },
    {
      title: "Perguntas prioritárias para investigação",
      body: analysis.dimensions.flatMap((dimension) => dimension.questions.map((question) => ({ dimension: dimension.name, ...question })))
        .sort((first, second) => first.score - second.score)
        .slice(0, 5)
        .map((question) => `- ${question.dimension}: “${question.text}” — média ${score(question.score)}; diferença entre grupos ${question.gap === null ? "indisponível" : score(question.gap)}.`)
        .join("\n"),
    },
    {
      title: "Achados e limites para revisão",
      body: `Achados informados pelo especialista: ${supplied(briefing.achados, "Ainda não informados.")}\n\nRiscos informados: ${supplied(briefing.riscos, "Ainda não informados.")}\n\nLimitações informadas: ${supplied(briefing.limitacoes, "Nenhuma limitação adicional informada.")}\n${analysis.warnings.length ? `\nAlertas da base: ${analysis.warnings.join(" ")}` : ""}`,
    },
    {
      title: "Encaminhamentos propostos",
      body: `${supplied(briefing.recomendacoes, "Definir recomendações após confrontar os dados da pesquisa com entrevistas, documentos e observação da operação.")}\n\nResponsável pela revisão: ${supplied(briefing.responsavel, "A definir.")}`,
    },
  ];
}

export function serializeDiagnosticDraft(sections: DiagnosticDraftSection[]) {
  return sections.map((section) => `## ${section.title}\n\n${section.body.trim()}`).join("\n\n") + "\n";
}
