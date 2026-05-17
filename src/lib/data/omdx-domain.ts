import {
  dimensionIdValues,
  respondentGroupMetaSchema,
  type Classification,
  type Diagnostic,
  type DimensionId,
  type RespondentGroup,
  type RespondentGroupMeta,
} from "@/lib/contracts";
import { hasFounderAnalysisBase } from "@/lib/data/omdx-production-rules";

export const omdxTemplateSlug = "omdx-v1";

const respondentGroups: RespondentGroupMeta[] = [
  {
    id: "fundador",
    label: "Fundador",
    description: "Percepção de sócios e principais decisores.",
  },
  {
    id: "lideranca",
    label: "Liderança",
    description: "Leitura de gestores e responsáveis por times.",
  },
  {
    id: "operacao",
    label: "Operação",
    description: "Visão de quem executa o trabalho no dia a dia.",
  },
];

export const suggestedMessages: Record<RespondentGroup, string> = {
  fundador:
    "Olá. Estamos rodando o OMDx para medir a maturidade operacional da empresa a partir da leitura de fundadores. Responda pelo link abaixo. A análise será consolidada de forma agregada.",
  lideranca:
    "Olá. Estamos rodando o OMDx para entender como a liderança percebe a maturidade operacional da empresa. Use o link abaixo para responder. A análise será consolidada de forma agregada.",
  operacao:
    "Olá. Estamos rodando o OMDx para entender como a operação percebe clareza, processos, liderança e foco no dia a dia. Responda pelo link abaixo. A análise será consolidada de forma agregada.",
};

export function classifyScore(score: number): Classification {
  if (score <= 2.0) return "Crítico";
  if (score <= 3.0) return "Inconsistente";
  if (score <= 4.0) return "Atenção";
  return "Consistente";
}

export function getRespondentGroups(): RespondentGroupMeta[] {
  return respondentGroups.map((group) => respondentGroupMetaSchema.parse(group));
}

export function isDimensionId(value: string): value is DimensionId {
  return dimensionIdValues.some((dimensionId) => dimensionId === value);
}

export function canGenerateDiagnosticReport(diagnostic: Diagnostic): boolean {
  return (
    diagnostic.generalScore !== null &&
    hasFounderAnalysisBase(diagnostic.responses)
  );
}

export function canGenerateDiagnosticActionPlan(diagnostic: Diagnostic): boolean {
  return canGenerateDiagnosticReport(diagnostic);
}
