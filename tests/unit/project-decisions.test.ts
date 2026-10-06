import { describe, expect, it } from "vitest";
import {
  applyPreviewDecision,
  prepareDecision,
} from "@/lib/initiatives/project-decisions";
import { createProjectPreview } from "@/lib/initiatives/project-preview";

const task = () => createProjectPreview("novo-website")[1];
const leader = "Líder de exemplo";
const at = "2026-10-04T12:00";

describe("decisões de projeto na demonstração", () => {
  it("prepara uma proposta sem alterar a tarefa e identifica os envios como prévias", () => {
    const current = task();
    const before = structuredClone(current);
    const plan = prepareDecision(
      current,
      { action: "call", instruction: "Vamos alinhar o acesso com o executor." },
      leader,
    );
    expect(current).toEqual(before);
    const applied = applyPreviewDecision(
      current,
      plan,
      leader,
      at,
      "decisao-1",
    );
    expect(
      applied.updates.slice(-3).map((event) => [event.kind, event.delivery]),
    ).toEqual([
      ["decision", undefined],
      ["card_comment", "simulated"],
      ["notification", "simulated"],
    ]);
    expect(applied.updates.at(-1)?.text).toContain(current.assignee);
    expect(applied.updates.at(-1)?.text).toContain(leader);
    expect(current).toEqual(before);
  });
  it("adiar preserva o compromisso original e o bloqueio, retirando a confirmação anterior", () => {
    const current = { ...task(), followUp: "confirmed" as const };
    const plan = prepareDecision(
      current,
      {
        action: "postpone",
        dueAt: "2026-10-07T15:00",
        instruction: "Aguardar o acesso à ferramenta.",
      },
      leader,
    );
    const applied = applyPreviewDecision(
      current,
      plan,
      leader,
      at,
      "decisao-2",
    );
    expect(applied.dueAt).toBe("2026-10-07T15:00");
    expect(applied.originalDueAt).toBe(current.originalDueAt);
    expect(applied.attention).toBe("blocker");
    expect(applied.followUp).toBe("none");
    expect(applied.status).toBe("in_progress");
  });
  it("suspender conserva o impedimento e o prazo sem concluir a entrega", () => {
    const current = task();
    const plan = prepareDecision(
      current,
      { action: "suspend", instruction: "Pausar até o acesso ser liberado." },
      leader,
    );
    const applied = applyPreviewDecision(
      current,
      plan,
      leader,
      at,
      "decisao-3",
    );
    expect(applied.status).toBe("paused");
    expect(applied.attention).toBe("blocker");
    expect(applied.dueAt).toBe(current.dueAt);
    expect(applied.originalDueAt).toBe(current.originalDueAt);
  });
  it.each(["call", "guidance"] as const)(
    "%s mantém o impedimento e não altera status ou prazo",
    (action) => {
      const current = task();
      const plan = prepareDecision(
        current,
        { action, instruction: "Precisamos alinhar a liberação do acesso." },
        leader,
      );
      const applied = applyPreviewDecision(
        current,
        plan,
        leader,
        at,
        "decisao-4",
      );
      expect(applied.attention).toBe(current.attention);
      expect(applied.status).toBe(current.status);
      expect(applied.dueAt).toBe(current.dueAt);
      expect(applied.followUp).toBe(current.followUp);
    },
  );
  it("recusa orientação vazia, adiamento inválido e decisões em tarefa encerrada ou suspensa", () => {
    expect(() =>
      prepareDecision(
        task(),
        { action: "guidance", instruction: "   " },
        leader,
      ),
    ).toThrow();
    for (const dueAt of [
      undefined,
      "inválido",
      "2026-13-10T12:00",
      "2027-02-31T12:00",
      task().dueAt,
      "2026-10-05T12:00",
    ]) {
      expect(() =>
        prepareDecision(
          task(),
          { action: "postpone", instruction: "Aguardar acesso.", dueAt },
          leader,
        ),
      ).toThrow();
    }
    for (const status of ["done", "paused"] as const) {
      expect(() =>
        prepareDecision(
          { ...task(), status },
          { action: "call", instruction: "Vamos alinhar." },
          leader,
        ),
      ).toThrow();
    }
  });
  it("exige revisar a proposta se a tarefa mudou antes da confirmação", () => {
    const current = task();
    const plan = prepareDecision(
      current,
      { action: "call", instruction: "Vamos alinhar." },
      leader,
    );
    expect(() =>
      applyPreviewDecision(
        { ...current, dueAt: "2026-10-08T12:00" },
        plan,
        leader,
        at,
        "decisao-5",
      ),
    ).toThrow("A tarefa mudou");
  });
});
