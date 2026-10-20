import { describe, expect, it } from "vitest";
import type { AdherenceRule } from "@/lib/contracts/asset-adherence";
import { currentRoutineOpportunity, localRoutineInstant } from "@/lib/data/routine-calendar";
const rule = (cadence: "diaria" | "semanal" | "quinzenal" | "mensal" | "trimestral" | "semestral" | "anual", createdAt = "2026-01-01T12:00:00Z"): Pick<AdherenceRule, "schedule" | "createdAt"> => ({ createdAt, schedule: { kind: "periodica", cadence, timeZone: "America/Sao_Paulo" } });
describe("calendário de oportunidades explícitas", () => {
  it("considera o dia local, o horário de abertura e o fim de semana", () => {
    expect(currentRoutineOpportunity(rule("diaria"), new Date("2026-10-20T11:59:59Z"))).toBeNull();
    expect(currentRoutineOpportunity(rule("diaria"), new Date("2026-10-20T12:00:00Z"))).toMatchObject({ opportunityKey: "calendario:diaria:2026-10-20", opensAt: "2026-10-20T12:00:00.000Z", dueAt: "2026-10-20T20:00:00.000Z" });
    expect(currentRoutineOpportunity(rule("diaria"), new Date("2026-10-24T14:00:00Z"))).toBeNull();
    expect(currentRoutineOpportunity(rule("diaria"), new Date("2026-10-20T01:00:00Z"))?.opportunityKey).toBe("calendario:diaria:2026-10-19");
  });
  it("não cria denominador anterior ao acordo e não presume evento", () => {
    const now = new Date("2026-10-20T16:00:00Z");
    expect(currentRoutineOpportunity(rule("semanal", "2026-10-20T15:00:00Z"), now)?.opensAt).toBe("2026-10-20T15:00:00.000Z");
    expect(currentRoutineOpportunity(rule("diaria", "2026-10-20T21:00:00Z"), now)).toBeNull();
    expect(currentRoutineOpportunity({ createdAt: rule("diaria").createdAt, schedule: { kind: "por_evento", eventKey: "entrega", timeZone: "America/Sao_Paulo" } }, now)).toBeNull();
  });
  it("fixa semana/quinzena por calendário e preserva a mesma oportunidade na revisão", () => {
    const first = currentRoutineOpportunity(rule("quinzenal"), new Date("2026-10-20T16:00:00Z"));
    const later = currentRoutineOpportunity(rule("quinzenal", "2026-10-21T13:00:00Z"), new Date("2026-10-22T16:00:00Z"));
    expect(first?.opportunityKey).toBe(later?.opportunityKey);
    expect(currentRoutineOpportunity(rule("semanal"), new Date("2026-10-20T16:00:00Z"))).toMatchObject({ opportunityKey: "calendario:semanal:2026-10-19", dueAt: "2026-10-25T20:00:00.000Z" });
  });
  it("usa fim real do mês, trimestre e ano, incluindo bissexto", () => {
    expect(currentRoutineOpportunity(rule("mensal", "2024-01-01T12:00:00Z"), new Date("2024-02-15T16:00:00Z"))?.dueAt).toBe("2024-02-29T20:00:00.000Z");
    expect(currentRoutineOpportunity(rule("trimestral"), new Date("2026-11-15T16:00:00Z"))?.dueAt).toBe("2026-12-31T20:00:00.000Z");
    expect(currentRoutineOpportunity(rule("semestral"), new Date("2026-05-15T16:00:00Z"))?.dueAt).toBe("2026-06-30T20:00:00.000Z");
    expect(currentRoutineOpportunity(rule("anual"), new Date("2026-05-15T16:00:00Z"))?.dueAt).toBe("2026-12-31T20:00:00.000Z");
  });
  it("resolve fuso por IANA sem fixar o deslocamento UTC", () => {
    expect(localRoutineInstant({ year: 2026, month: 10, day: 20 }, 9, "America/Manaus").toISOString()).toBe("2026-10-20T13:00:00.000Z");
    expect(() => currentRoutineOpportunity(rule("diaria"), new Date("invalid"))).toThrow("Instante inválido");
  });
});
