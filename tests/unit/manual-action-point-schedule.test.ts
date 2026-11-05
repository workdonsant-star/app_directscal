import { describe, expect, it } from "vitest";
import { dueManualActionPointSlot } from "@/lib/data/manual-action-point-schedule";

const base = { frequency: "semanal" as const, weekdays: [1], send_time: "09:00:00", schedule_starts_on: "2026-11-02", deadline: null };

describe("agenda dos Action Points", () => {
  it("usa o dia e horário de Brasília e aceita uma pequena tolerância do cron", () => {
    expect(dueManualActionPointSlot(base, new Date("2026-11-02T12:05:00Z"))).toBe("2026-11-02T09:00:America/Sao_Paulo");
    expect(dueManualActionPointSlot(base, new Date("2026-11-02T11:59:00Z"))).toBeNull();
    expect(dueManualActionPointSlot(base, new Date("2026-11-02T12:10:00Z"))).toBeNull();
  });
  it("não agenda após encerramento ou antes da semana quinzenal", () => {
    expect(dueManualActionPointSlot({ ...base, deadline: "2026-11-01" }, new Date("2026-11-02T12:00:00Z"))).toBeNull();
    expect(dueManualActionPointSlot({ ...base, frequency: "quinzenal" }, new Date("2026-11-09T12:00:00Z"))).toBeNull();
    expect(dueManualActionPointSlot({ ...base, frequency: "quinzenal" }, new Date("2026-11-16T12:00:00Z"))).toBe("2026-11-16T09:00:America/Sao_Paulo");
  });
  it("limita a agenda mensal à primeira semana", () => {
    expect(dueManualActionPointSlot({ ...base, frequency: "mensal", weekdays: [1] }, new Date("2026-12-07T12:00:00Z"))).toBe("2026-12-07T09:00:America/Sao_Paulo");
    expect(dueManualActionPointSlot({ ...base, frequency: "mensal", weekdays: [1] }, new Date("2026-12-14T12:00:00Z"))).toBeNull();
  });
});
