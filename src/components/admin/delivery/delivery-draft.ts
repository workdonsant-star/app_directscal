import type { AdminDeliveryReportDraft } from "@/lib/contracts/admin-operations";
import type { RespondentGroup } from "@/lib/contracts/omdx";

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

export function buildInitialReport(): AdminDeliveryReportDraft {
  return {
    executiveSummary: "",
    generalReading: "",
    vulnerabilities: "",
    structuralCauses: "",
    recommendations: "",
    conclusion: "",
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
