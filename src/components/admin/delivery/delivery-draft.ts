import type { AdminDeliveryReportDraft } from "@/lib/contracts/admin-operations";
import type { RespondentGroup } from "@/lib/contracts/omdx";
import type { AdminDeliveryDimensionAnalysis } from "@/lib/data/admin-operations-data-source";

export const layerLabels: Record<RespondentGroup, string> = {
  fundador: "Fundador",
  lideranca: "Liderança",
  operacao: "Operação",
};

export function formatScore(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function buildInitialDimensionReading(
  dimension: AdminDeliveryDimensionAnalysis,
) {
  const orderedLayers = Object.entries(dimension.layerScores)
    .filter((entry): entry is [RespondentGroup, number] => entry[1] !== null)
    .sort((first, second) => second[1] - first[1]);
  const strongestLayer = orderedLayers[0];
  const weakestLayer = orderedLayers.at(-1);
  const gapReading =
    dimension.gap <= 0.5
      ? "As camadas apresentam uma leitura próxima entre si."
      : dimension.gap <= 1.2
        ? "Existe diferença de percepção que merece validação com as lideranças."
        : "A diferença entre as camadas indica desalinhamento relevante sobre a rotina observada.";

  return `${dimension.shortName} registra ${formatScore(dimension.score)}/5. ${gapReading} ${
    strongestLayer && weakestLayer
      ? `${layerLabels[strongestLayer[0]]} apresenta a maior percepção (${formatScore(strongestLayer[1])}/5), enquanto ${layerLabels[weakestLayer[0]]} registra ${formatScore(weakestLayer[1])}/5.`
      : ""
  }`;
}

export function buildInitialReport(companyName: string): AdminDeliveryReportDraft {
  return {
    executiveSummary: `${companyName} apresenta uma operação funcional, mas ainda depende de mecanismos informais para coordenar prioridades, decisões e responsabilidades.`,
    generalReading:
      "Os resultados indicam que a estrutura de gestão evoluiu em ritmos diferentes entre as dimensões. As maiores fragilidades estão associadas à previsibilidade da execução e à distribuição das decisões.",
    vulnerabilities:
      "Processos críticos ainda variam entre áreas, informações importantes circulam sem um padrão único de registro e parte das decisões operacionais continua escalando para poucas pessoas.",
    structuralCauses:
      "Os sintomas compartilham três causas principais: limites de autonomia pouco explícitos, cadências de acompanhamento inconsistentes e critérios de performance ainda fragmentados.",
    recommendations:
      "Priorizar a definição de papéis e decisões, estabelecer uma cadência executiva e consolidar indicadores antes de ampliar a documentação dos processos.",
    conclusion:
      "O próximo estágio exige transformar práticas isoladas em um sistema comum de gestão, capaz de aumentar previsibilidade sem elevar a dependência da liderança.",
  };
}

export const reportFields: Array<{
  key: keyof AdminDeliveryReportDraft;
  label: string;
  description: string;
}> = [
  {
    key: "executiveSummary",
    label: "Resumo executivo",
    description: "Síntese da situação atual e da principal implicação para a empresa.",
  },
  {
    key: "generalReading",
    label: "Leitura geral",
    description: "Interpretação conjunta dos dados e das diferenças entre camadas.",
  },
  {
    key: "vulnerabilities",
    label: "Vulnerabilidades prioritárias",
    description: "Problemas que limitam previsibilidade, escala ou qualidade da operação.",
  },
  {
    key: "structuralCauses",
    label: "Causas estruturais",
    description: "Mecanismos que explicam os sintomas observados nos resultados.",
  },
  {
    key: "recommendations",
    label: "Recomendações",
    description: "Direção de intervenção antes da seleção detalhada dos action points.",
  },
  {
    key: "conclusion",
    label: "Conclusão",
    description: "Fechamento consultivo e orientação para o próximo estágio.",
  },
];
