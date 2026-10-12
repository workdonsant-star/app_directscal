import {
  Circle,
  CircleCheck,
  CircleDashed,
  CircleDot,
  SignalHigh,
  SignalLow,
  SignalMedium,
  TriangleAlert,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  ActionPointAssignee,
  DiagnosticActionPointPriority,
} from "@/lib/contracts";
import {
  actionPointStageLabels,
  type ActionPointStage,
} from "@/lib/data/action-points-list";
import { cn } from "@/lib/utils";

const stageIcons = {
  sem_responsavel: { icon: CircleDashed, tone: "text-muted-foreground" },
  atribuido: { icon: Circle, tone: "text-muted-foreground" },
  em_implementacao: { icon: CircleDot, tone: "text-primary" },
  bloqueado: { icon: TriangleAlert, tone: "text-chart-negative" },
  concluido: { icon: CircleCheck, tone: "text-chart-positive" },
} satisfies Record<ActionPointStage, unknown>;

const priorityIcons = {
  Alta: SignalHigh,
  Média: SignalMedium,
  Baixa: SignalLow,
} satisfies Record<DiagnosticActionPointPriority, unknown>;

// O texto carrega o significado; a cor do ícone é só reforço.
export function ActionPointStageBadge({ stage }: { stage: ActionPointStage }) {
  const { icon: Icon, tone } = stageIcons[stage];

  return (
    <span className="inline-flex items-center gap-2">
      <Icon className={cn("size-4 shrink-0", tone)} aria-hidden="true" />
      {actionPointStageLabels[stage]}
    </span>
  );
}

export function ActionPointPriority({
  priority,
}: {
  priority: DiagnosticActionPointPriority;
}) {
  const Icon = priorityIcons[priority];

  return (
    <span className="inline-flex items-center gap-2">
      <Icon
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      {priority}
    </span>
  );
}

export function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part, index, parts) =>
      index === 0 || index === parts.length - 1 ? part[0] : "",
    )
    .join("")
    .toLocaleUpperCase("pt-BR");
}

export function AssigneeAvatar({
  assignee,
  size = "sm",
}: {
  assignee: Pick<ActionPointAssignee, "name" | "avatarUrl">;
  size?: "sm" | "default";
}) {
  return (
    <Avatar size={size} aria-hidden="true">
      {assignee.avatarUrl && <AvatarImage src={assignee.avatarUrl} alt="" />}
      <AvatarFallback>{initialsOf(assignee.name)}</AvatarFallback>
    </Avatar>
  );
}

export function AssigneeCell({
  assignee,
}: {
  assignee: ActionPointAssignee | null;
}) {
  if (!assignee) {
    return <span className="text-muted-foreground">Sem responsável</span>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <AssigneeAvatar assignee={assignee} />
      {assignee.name}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        role="progressbar"
        aria-label="Progresso"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted"
      >
        <span
          className={cn(
            "block h-full rounded-full",
            value >= 100 ? "bg-chart-positive" : "bg-primary",
          )}
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="tabular-nums">{value}%</span>
    </span>
  );
}
