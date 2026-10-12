import {
  CalendarClock,
  FileText,
  MessageCircle,
  Repeat,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import type {
  ActionPointEvent,
  ActionPointEventKind,
} from "@/lib/contracts";
import { cn } from "@/lib/utils";

const kindMeta: Record<
  ActionPointEventKind,
  { label: string; icon: LucideIcon; chip: string }
> = {
  atribuicao: {
    label: "Responsável",
    icon: UserRound,
    chip: "bg-action-primary-highlight/10 text-action-primary-highlight",
  },
  etapa: { label: "Etapa", icon: Repeat, chip: "bg-muted text-muted-foreground" },
  prazo: {
    label: "Prazo",
    icon: CalendarClock,
    chip: "bg-muted text-muted-foreground",
  },
  andamento: {
    label: "Andamento",
    icon: TrendingUp,
    chip: "bg-chart-positive/10 text-chart-positive",
  },
  nota: { label: "Nota", icon: FileText, chip: "bg-muted text-muted-foreground" },
  resposta: {
    label: "Resposta ao agente",
    icon: MessageCircle,
    chip: "bg-action-primary-highlight/10 text-action-primary-highlight",
  },
};

// Do mais recente ao mais antigo, como chega do servidor.
export function ActionPointTimeline({ events }: { events: ActionPointEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        As atribuições, os avanços, as mudanças de etapa e prazo e as respostas
        do responsável aparecem aqui.
      </p>
    );
  }

  return (
    <ol aria-label="Histórico da ação">
      {events.map((event, index) => {
        const { label, icon: Icon, chip } = kindMeta[event.kind];

        return (
          <li key={event.id} className="relative flex gap-3 pb-6 last:pb-0">
            {index < events.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute top-9 bottom-1 left-4 w-px bg-border"
              />
            )}
            <span
              aria-hidden="true"
              className="relative flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground"
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-1.5 pt-1">
              <p className="text-sm leading-snug text-foreground">
                <span className="font-semibold">{event.authorName}</span>{" "}
                {event.body}
              </p>
              {event.detail && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-muted-foreground">
                  {event.detail}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className={cn("rounded-full px-2 py-0.5 font-medium", chip)}>
                  {label}
                </span>
                <time dateTime={event.createdAt} className="tabular-nums">
                  {new Date(event.createdAt).toLocaleString("pt-BR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
