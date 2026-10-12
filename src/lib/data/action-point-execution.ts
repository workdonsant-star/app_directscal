import type {
  ActionPointAssignee,
  ActionPointAssignment,
  ActionPointCadence,
  ActionPointEventKind,
  ActionPointStageValue,
  ActionPointUpdateInput,
} from "@/lib/contracts";
import {
  actionPointStageLabels,
  formatShortDate,
} from "@/lib/data/action-points-list";

export type PlannedEvent = {
  kind: ActionPointEventKind;
  body: string;
  detail?: string;
};

export type PlannedValues = {
  assignee: ActionPointAssignee;
  stage: ActionPointStageValue;
  startsOn: string | null;
  dueOn: string | null;
  cadence: ActionPointCadence;
  progress: number;
};

export type ActionPointUpdatePlan =
  | { ok: false; message: string }
  | { ok: true; remove: true; events: PlannedEvent[] }
  | { ok: true; remove: false; values: PlannedValues; events: PlannedEvent[] };

type Existing = Pick<
  ActionPointAssignment,
  "assignee" | "stage" | "startsOn" | "dueOn" | "cadence" | "progress"
>;

function formatDate(date: string | null) {
  return date ? formatShortDate(date) : "sem data";
}

/**
 * Decide o que gravar e o que registrar no histórico a partir do estado atual
 * e do pedido. Puro: o handler resolve a pessoa no Slack e aplica o resultado.
 * `defaults` são as datas e a cadência da publicação, usadas na primeira
 * atribuição.
 */
export function planActionPointUpdate({
  existing,
  input,
  assignee,
  defaults,
}: {
  existing: Existing | null;
  input: ActionPointUpdateInput;
  assignee: ActionPointAssignee | null;
  defaults: Pick<PlannedValues, "startsOn" | "dueOn" | "cadence">;
}): ActionPointUpdatePlan {
  const events: PlannedEvent[] = [];

  if (input.assigneeUserId === null) {
    if (!existing) {
      return { ok: false, message: "Esta ação não tem responsável para remover." };
    }

    return {
      ok: true,
      remove: true,
      events: [
        {
          kind: "atribuicao",
          body: `removeu ${existing.assignee.name} como responsável`,
        },
      ],
    };
  }

  const nextAssignee =
    typeof input.assigneeUserId === "string" ? assignee : existing?.assignee;

  if (!nextAssignee) {
    return {
      ok: false,
      message: "Escolha o responsável antes de definir etapa, prazo ou cadência.",
    };
  }

  const base: PlannedValues = existing
    ? { ...existing, assignee: existing.assignee }
    : { ...defaults, assignee: nextAssignee, stage: "atribuido", progress: 0 };
  const values: PlannedValues = {
    assignee: nextAssignee,
    stage: input.stage ?? base.stage,
    startsOn: input.startsOn !== undefined ? input.startsOn : base.startsOn,
    dueOn: input.dueOn !== undefined ? input.dueOn : base.dueOn,
    cadence: input.cadence ?? base.cadence,
    progress: input.progress ?? base.progress,
  };

  // Concluir fecha o progresso, salvo se a pessoa informou outro valor.
  if (values.stage === "concluido" && input.progress === undefined) {
    values.progress = 100;
  }

  if (values.startsOn && values.dueOn && values.dueOn < values.startsOn) {
    return { ok: false, message: "O prazo não pode ser anterior ao início." };
  }

  if (!existing) {
    events.push({
      kind: "atribuicao",
      body: `atribuiu a ação a ${nextAssignee.name}`,
    });
  } else if (existing.assignee.userId !== nextAssignee.userId) {
    events.push({
      kind: "atribuicao",
      body: `alterou o responsável de ${existing.assignee.name} para ${nextAssignee.name}`,
    });
  }

  const previousStage = existing?.stage ?? "atribuido";
  if (values.stage !== previousStage) {
    events.push({
      kind: "etapa",
      body: `alterou a etapa de ${actionPointStageLabels[previousStage]} para ${actionPointStageLabels[values.stage]}`,
    });
  }

  const previousDue = existing ? existing.dueOn : defaults.dueOn;
  if (values.dueOn !== previousDue) {
    events.push({
      kind: "prazo",
      body: `alterou o prazo de ${formatDate(previousDue)} para ${formatDate(values.dueOn)}`,
    });
  }

  const previousStart = existing ? existing.startsOn : defaults.startsOn;
  if (values.startsOn !== previousStart) {
    events.push({
      kind: "prazo",
      body: `alterou o início de ${formatDate(previousStart)} para ${formatDate(values.startsOn)}`,
    });
  }

  const previousProgress = existing?.progress ?? 0;
  if (values.progress !== previousProgress) {
    events.push({
      kind: "andamento",
      body: `atualizou o progresso de ${previousProgress}% para ${values.progress}%`,
    });
  }

  if (input.note) {
    events.push({
      kind: "nota",
      body: "registrou uma nota",
      detail: input.note,
    });
  }

  return { ok: true, remove: false, values, events };
}
