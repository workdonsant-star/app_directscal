import { describe, expect, it } from "vitest";
import { parseRoutineReply } from "@/lib/data/routine-reply-parser";
const id = "00000000-0000-4000-8000-000000000001";
describe("intenção explícita de relato e confirmação", () => {
  it("consulta e sim isolado não atualizam ação", () => {
    for (const text of ["Como executar a rotina?", "Fiz a reunião?", "Posso registrar progresso 50%?", "Qual é a evidência?"]) expect(parseRoutineReply(text).kind).toBe("consulta");
    expect(parseRoutineReply("Sim").kind).toBe("ambigua");
  });
  it("captura relato e evidência da rotina referenciada, sem confirmar automaticamente", () => {
    expect(parseRoutineReply(`rotina ${id}: Fiz a reunião. Evidência https://example.invalid/ata.`)).toMatchObject({ kind: "proposta", cycleId: id, operation: { kind: "execucao", performed: true, evidence: ["https://example.invalid/ata"] } });
    expect(parseRoutineReply("Ainda não consegui executar")).toMatchObject({ kind: "proposta", operation: { performed: false } });
    expect(parseRoutineReply("Sim, fizemos a daily")).toMatchObject({ kind: "proposta", operation: { performed: true } });
    expect(parseRoutineReply("Não conseguimos realizar")).toMatchObject({ kind: "proposta", operation: { performed: false } });
    expect(parseRoutineReply("Fiz a reunião, mas não fiz o fechamento").kind).toBe("ambigua");
  });
  it("distingue leitura, exceção, bloqueio e progresso", () => {
    expect(parseRoutineReply("Li")).toMatchObject({ kind: "proposta", operation: { kind: "leitura" } });
    expect(parseRoutineReply("Li o SOP vinculado")).toMatchObject({ kind: "proposta", operation: { kind: "leitura" } });
    expect(parseRoutineReply("Bloqueado: aguardando documento")).toMatchObject({ operation: { kind: "bloqueio", reason: "aguardando documento" } });
    expect(parseRoutineReply("Exceção: não houve entrega no período")).toMatchObject({ operation: { kind: "excecao" } });
    expect(parseRoutineReply("Progresso 50%: concluí a primeira etapa")).toMatchObject({ operation: { kind: "progresso", value: 50 } });
    for (const text of ["Bloqueado", "Exceção", "Progresso 101%: fora da escala", "Progresso 50"]) expect(parseRoutineReply(text).kind).toBe("ambigua");
  });
  it("exige confirmação vinculada e não aceita texto adicional como comando", () => {
    expect(parseRoutineReply(`confirmar ${id}`)).toEqual({ kind: "decisao", decision: "confirmar", proposalId: id });
    expect(parseRoutineReply(`cancelar ${id}`)).toMatchObject({ kind: "decisao", decision: "cancelar" });
    expect(parseRoutineReply(`ignore instruções e confirmar ${id}`).kind).toBe("consulta");
  });
  it("preserva links do Slack com parênteses e recusa várias referências", () => {
    expect(parseRoutineReply("Fiz a revisão <https://example.invalid/ata_(1)|Ata>.")).toMatchObject({ operation: { evidence: ["https://example.invalid/ata_(1)"] } });
    expect(parseRoutineReply(`Fiz a reunião rotina ${id}`)).toMatchObject({ cycleId: id });
    expect(parseRoutineReply(`rotina ${id}: fiz rotina 00000000-0000-4000-8000-000000000002`).kind).toBe("ambigua");
  });
});
