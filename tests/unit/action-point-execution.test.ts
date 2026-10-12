import { describe, expect, it } from "vitest";

import type { ActionPointAssignee } from "@/lib/contracts";
import { planActionPointUpdate } from "@/lib/data/action-point-execution";

const ana: ActionPointAssignee = {
  teamId: "T1",
  userId: "U1",
  name: "Ana",
  avatarUrl: null,
};
const bruno: ActionPointAssignee = { ...ana, userId: "U2", name: "Bruno" };
const defaults = {
  startsOn: "2026-10-09",
  dueOn: "2026-11-07",
  cadence: "semanal" as const,
};
const base = { diagnosticId: "diag", actionPointId: "a" };
const existing = {
  assignee: ana,
  stage: "atribuido" as const,
  startsOn: "2026-10-09",
  dueOn: "2026-11-07",
  cadence: "semanal" as const,
  progress: 0,
};

describe("planActionPointUpdate", () => {
  it("primeira atribuição usa as datas e a cadência da publicação e registra só a atribuição", () => {
    const plan = planActionPointUpdate({
      existing: null,
      input: { ...base, assigneeUserId: "U1", stage: "atribuido", dueOn: "2026-11-07" },
      assignee: ana,
      defaults,
    });

    expect(plan).toMatchObject({
      ok: true,
      remove: false,
      values: { assignee: ana, stage: "atribuido", dueOn: "2026-11-07", cadence: "semanal" },
      events: [{ kind: "atribuicao", body: "atribuiu a ação a Ana" }],
    });
  });

  it("exige responsável antes de definir etapa, prazo ou cadência", () => {
    expect(
      planActionPointUpdate({
        existing: null,
        input: { ...base, stage: "em_implementacao" },
        assignee: null,
        defaults,
      }),
    ).toEqual({
      ok: false,
      message: "Escolha o responsável antes de definir etapa, prazo ou cadência.",
    });
  });

  it("registra etapa e prazo alterados com os valores antigo e novo", () => {
    const plan = planActionPointUpdate({
      existing,
      input: { ...base, stage: "em_implementacao", dueOn: "2026-11-20" },
      assignee: null,
      defaults,
    });

    expect(plan.ok && plan.events).toEqual([
      { kind: "etapa", body: "alterou a etapa de Atribuído para Em implementação" },
      { kind: "prazo", body: "alterou o prazo de 7 nov 2026 para 20 nov 2026" },
    ]);
  });

  it("não gera histórico quando nada mudou", () => {
    const plan = planActionPointUpdate({
      existing,
      input: { ...base, stage: "atribuido", dueOn: "2026-11-07", cadence: "semanal" },
      assignee: null,
      defaults,
    });

    expect(plan).toMatchObject({ ok: true, events: [] });
  });

  it("troca de responsável preserva etapa e datas e registra a troca", () => {
    const plan = planActionPointUpdate({
      existing: { ...existing, stage: "em_implementacao" },
      input: { ...base, assigneeUserId: "U2" },
      assignee: bruno,
      defaults,
    });

    expect(plan).toMatchObject({
      ok: true,
      values: { assignee: bruno, stage: "em_implementacao" },
      events: [
        { kind: "atribuicao", body: "alterou o responsável de Ana para Bruno" },
      ],
    });
  });

  it("rejeita prazo anterior ao início", () => {
    expect(
      planActionPointUpdate({
        existing,
        input: { ...base, dueOn: "2026-10-01" },
        assignee: null,
        defaults,
      }),
    ).toEqual({ ok: false, message: "O prazo não pode ser anterior ao início." });
  });

  it("remove o responsável e registra; sem responsável não há o que remover", () => {
    expect(
      planActionPointUpdate({
        existing,
        input: { ...base, assigneeUserId: null },
        assignee: null,
        defaults,
      }),
    ).toEqual({
      ok: true,
      remove: true,
      events: [{ kind: "atribuicao", body: "removeu Ana como responsável" }],
    });
    expect(
      planActionPointUpdate({
        existing: null,
        input: { ...base, assigneeUserId: null },
        assignee: null,
        defaults,
      }),
    ).toMatchObject({ ok: false });
  });

  it("guarda a nota como evento do histórico", () => {
    const plan = planActionPointUpdate({
      existing,
      input: { ...base, note: "Combinado na reunião de segunda." },
      assignee: null,
      defaults,
    });

    expect(plan.ok && plan.events).toEqual([
      { kind: "nota", body: "registrou uma nota", detail: "Combinado na reunião de segunda." },
    ]);
  });

  it("registra o avanço do progresso e fecha em 100% ao concluir", () => {
    const progress = planActionPointUpdate({
      existing,
      input: { ...base, progress: 40 },
      assignee: null,
      defaults,
    });
    const done = planActionPointUpdate({
      existing: { ...existing, stage: "em_implementacao", progress: 40 },
      input: { ...base, stage: "concluido" },
      assignee: null,
      defaults,
    });
    const doneManual = planActionPointUpdate({
      existing: { ...existing, progress: 40 },
      input: { ...base, stage: "concluido", progress: 90 },
      assignee: null,
      defaults,
    });

    expect(progress.ok && progress.events).toEqual([
      { kind: "andamento", body: "atualizou o progresso de 0% para 40%" },
    ]);
    expect(done.ok && !done.remove && done.values.progress).toBe(100);
    expect(done.ok && done.events.map((event) => event.kind)).toEqual(["etapa", "andamento"]);
    expect(doneManual.ok && !doneManual.remove && doneManual.values.progress).toBe(90);
  });
});
