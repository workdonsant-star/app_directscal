import {
  CircleCheck,
  Clock3,
  FileText,
  MessageCircle,
  TriangleAlert,
} from "lucide-react";
import {
  formatTaskDeadline,
  type ProjectUpdate,
} from "@/lib/initiatives/project-preview";
import { cn } from "@/lib/utils";

const eventLabels = {
  progress: "Progresso",
  check_in: "Acompanhamento",
  blocker: "Impedimento",
  decision: "Decisão",
  card_comment: "Card da tarefa",
  notification: "Mensagem ao executor",
};

export function TaskProgressTimeline({
  updates,
}: {
  updates: ProjectUpdate[];
}) {
  if (!updates.length)
    return (
      <p className="text-sm text-muted-foreground">
        As atualizações e decisões aparecerão aqui conforme a tarefa avançar.
      </p>
    );
  return (
    <ol aria-label="Histórico de progresso" className="space-y-0">
      {updates.map((event, index) => {
        const kind =
          event.kind ?? (event.author === "Agente" ? "check_in" : "progress");
        const Icon =
          kind === "blocker" || kind === "decision"
            ? TriangleAlert
            : kind === "check_in"
              ? Clock3
              : kind === "card_comment"
                ? FileText
                : kind === "notification"
                  ? MessageCircle
                  : CircleCheck;
        return (
          <li key={event.id} className="relative flex gap-3 pb-6 last:pb-0">
            {index < updates.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute top-9 bottom-1 left-4 w-px bg-border"
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "relative flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground",
                (kind === "blocker" || kind === "decision") &&
                  "text-destructive",
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-2 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm">
                  <span className="font-semibold">{event.author}</span>{" "}
                  <span className="text-muted-foreground">
                    {event.action ?? "registrou uma atualização"}
                  </span>
                </p>
                <time
                  dateTime={event.at}
                  className="shrink-0 text-xs tabular-nums text-muted-foreground"
                >
                  {formatTaskDeadline(event.at)}
                </time>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {event.text}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={cn(
                    "rounded-full bg-muted px-2 py-0.5 font-medium",
                    (kind === "blocker" || kind === "decision") &&
                      "bg-destructive/10 text-destructive",
                  )}
                >
                  {eventLabels[kind]}
                </span>
                <span>{event.source}</span>
                {event.delivery === "simulated" && (
                  <span>Prévia · Não enviado</span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
