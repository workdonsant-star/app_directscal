import { describe, expect, it } from "vitest";
import { classifyCriterion, type CriterionVerification } from "@/lib/agent/follow-up/classification";

const complete: CriterionVerification = {
  delivery: "confirmada", dueAt: "2026-11-08T23:00:00Z", checkedAt: "2026-11-09T00:00:00Z",
  requiredFields: ["data", "decisao"], requiredEvidence: "relato",
  facts: { performed: true, partial: false, relevant: true, periodMatches: true, contradictory: false, fields: { data: "02/11", decisao: "Priorizar a entrega" }, evidenceLevel: "relato" },
};

describe("classificação dos critérios de Action Point", () => {
  it("separa silêncio, prazo aberto e falha de transporte", () => {
    expect(classifyCriterion({ ...complete, facts: null, checkedAt: "2026-11-07T00:00:00Z" })).toBe("pendente");
    expect(classifyCriterion({ ...complete, facts: null })).toBe("sem_resposta");
    expect(classifyCriterion({ ...complete, facts: null, delivery: "incerta" })).toBe("nao_verificado");
    expect(classifyCriterion({ ...complete, facts: null, delivery: "falhou" })).toBe("nao_verificado");
  });

  it("não transforma uma resposta vaga ou contraditória em execução", () => {
    expect(classifyCriterion({ ...complete, facts: { ...complete.facts!, performed: null } })).toBe("inconclusivo");
    expect(classifyCriterion({ ...complete, facts: { ...complete.facts!, fields: { data: null, decisao: null } } })).toBe("inconclusivo");
    expect(classifyCriterion({ ...complete, facts: { ...complete.facts!, contradictory: true } })).toBe("inconclusivo");
    expect(classifyCriterion({ ...complete, facts: { ...complete.facts!, periodMatches: false } })).toBe("inconclusivo");
  });

  it("distingue ausência declarada, parcialidade, evidência e atendimento", () => {
    expect(classifyCriterion({ ...complete, facts: { ...complete.facts!, performed: false } })).toBe("nao_atendido");
    expect(classifyCriterion({ ...complete, facts: { ...complete.facts!, fields: { data: "02/11", decisao: null } } })).toBe("parcial");
    expect(classifyCriterion({ ...complete, requiredEvidence: "registro_apresentado" })).toBe("parcial");
    expect(classifyCriterion({ ...complete })).toBe("atendido");
  });
});
