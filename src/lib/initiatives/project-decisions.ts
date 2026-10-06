import { formatTaskDeadline, type ProjectTask } from "./project-preview";

export const decisionActions = {
  postpone: "Adiar prazo",
  suspend: "Suspender tarefa",
  call: "Solicitar uma call",
  guidance: "Orientar executor",
} as const;

export type DecisionInput = {
  action: keyof typeof decisionActions;
  instruction: string;
  dueAt?: string;
};

export type DecisionPlan = {
  input: DecisionInput;
  effect: string;
  cardComment: string;
  executorMessage: string;
  base: Pick<ProjectTask, "id" | "status" | "dueAt" | "attention">;
};

export function prepareDecision(
  task: ProjectTask,
  input: DecisionInput,
  leader: string,
): DecisionPlan {
  if (task.status === "done" || task.status === "paused")
    throw new Error("Retome a tarefa antes de registrar uma nova orientação.");
  const instruction = input.instruction.trim();
  if (instruction.length < 3)
    throw new Error("Explique a decisão com pelo menos 3 caracteres.");
  let effect: string;
  switch (input.action) {
    case "postpone":
      if (
        !input.dueAt ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input.dueAt) ||
        Number.isNaN(new Date(`${input.dueAt}Z`).getTime()) ||
        new Date(`${input.dueAt}Z`).toISOString().slice(0, 16) !==
          input.dueAt ||
        input.dueAt <= task.dueAt
      )
        throw new Error("Informe um novo prazo posterior ao prazo atual.");
      effect = `Adiar o prazo de ${formatTaskDeadline(task.dueAt)} para ${formatTaskDeadline(input.dueAt)}. A confirmação anterior será retirada.`;
      break;
    case "suspend":
      effect =
        "Suspender a execução, mantendo o prazo e o impedimento no histórico. A tarefa poderá ser retomada em Detalhes.";
      break;
    case "call":
      effect =
        "Solicitar ao executor uma call para alinhamento. O prazo e o impedimento continuam em acompanhamento; a reunião ainda precisa ser combinada.";
      break;
    case "guidance":
      effect =
        "Registrar a orientação para o executor, mantendo o status, o prazo e a pendência até haver uma resolução.";
      break;
  }
  const cardComment = `${leader} decidiu: ${decisionActions[input.action]}. ${effect} Orientação: ${instruction}`;
  return {
    input: { ...input, instruction },
    effect,
    cardComment,
    executorMessage: `${task.assignee}, há uma decisão de ${leader} sobre “${task.title}”. ${effect} Orientação: ${instruction}`,
    base: {
      id: task.id,
      status: task.status,
      dueAt: task.dueAt,
      attention: task.attention,
    },
  };
}

export function applyPreviewDecision(
  task: ProjectTask,
  plan: DecisionPlan,
  leader: string,
  at: string,
  id: string,
): ProjectTask {
  if (
    Object.entries(plan.base).some(
      ([key, value]) => task[key as keyof typeof plan.base] !== value,
    )
  )
    throw new Error("A tarefa mudou. Revise a decisão antes de confirmar.");
  const checked = prepareDecision(task, plan.input, leader);
  return {
    ...task,
    ...(checked.input.action === "postpone"
      ? { dueAt: checked.input.dueAt!, followUp: "none" as const }
      : {}),
    ...(checked.input.action === "suspend"
      ? { status: "paused" as const, followUp: "none" as const }
      : {}),
    updates: [
      ...task.updates,
      {
        id: `${id}:decision`,
        author: leader,
        action: "registrou uma decisão",
        text: `${decisionActions[checked.input.action]}: ${checked.input.instruction} ${checked.effect}`,
        source: "Projeto",
        at,
        kind: "decision",
      },
      {
        id: `${id}:card`,
        author: "Agente",
        action: "preparou o comentário para o card",
        text: checked.cardComment,
        source: "Projeto",
        at,
        kind: "card_comment",
        delivery: "simulated",
      },
      {
        id: `${id}:slack`,
        author: "Agente",
        action: "preparou a mensagem para o executor",
        text: checked.executorMessage,
        source: "Slack",
        at,
        kind: "notification",
        delivery: "simulated",
      },
    ],
  };
}
