export type VerificationStatus = "pendente" | "atendido" | "parcial" | "nao_atendido" | "inconclusivo" | "sem_resposta" | "nao_verificado";
export type EvidenceLevel = "nenhuma" | "relato" | "registro_apresentado" | "registro_conferido";

export type ExtractedCriterionFacts = {
  performed: boolean | null;
  partial: boolean;
  relevant: boolean;
  periodMatches: boolean;
  contradictory: boolean;
  fields: Record<string, string | null>;
  evidenceLevel: EvidenceLevel;
};

export type CriterionVerification = {
  delivery: "confirmada" | "incerta" | "falhou" | "nao_enviada";
  dueAt: string;
  checkedAt: string;
  requiredFields: readonly string[];
  requiredEvidence: "relato" | "registro_apresentado" | "registro_conferido";
  facts: ExtractedCriterionFacts | null;
};

const evidenceRank: Record<EvidenceLevel, number> = { nenhuma: 0, relato: 1, registro_apresentado: 2, registro_conferido: 3 };

export function classifyCriterion(input: CriterionVerification): VerificationStatus {
  const due = Date.parse(input.dueAt);
  const checked = Date.parse(input.checkedAt);
  if (!Number.isFinite(due) || !Number.isFinite(checked)) throw new Error("Período de verificação inválido.");
  if (input.delivery !== "confirmada") return "nao_verificado";
  const facts = input.facts;
  if (!facts) return checked < due ? "pendente" : "sem_resposta";
  if (!facts.relevant || !facts.periodMatches || facts.contradictory) return "inconclusivo";
  if (facts.performed === false) return "nao_atendido";
  if (facts.performed === null) return "inconclusivo";
  const filled = input.requiredFields.filter(field => Boolean(facts.fields[field]?.trim())).length;
  if (filled === 0 && input.requiredFields.length > 0) return "inconclusivo";
  if (facts.partial || filled < input.requiredFields.length || evidenceRank[facts.evidenceLevel] < evidenceRank[input.requiredEvidence]) return "parcial";
  return "atendido";
}
