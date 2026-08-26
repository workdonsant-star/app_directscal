"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  GanttActionPointDetails,
  GanttTask,
  GanttTaskStatus,
} from "@/lib/contracts";
import { cn } from "@/lib/utils";

const WEEKDAYS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];
const MONTHS_SHORT_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

const HOUR_START = 8;
const HOUR_END = 18;
const HOUR_HEIGHT = 72;
const DAY_MIN_WIDTH = 148;

type StatusFilter = GanttTaskStatus | "todos";

type CalendarEvent = {
  id: string;
  title: string;
  owner: string;
  blocker: string;
  status: GanttTaskStatus;
  date: Date;
  startMinutes: number;
  durationMinutes: number;
  actionPoint?: GanttActionPointDetails;
};

type StatusStyle = {
  label: string;
  event: string;
  marker: string;
};

const statusMeta: Record<GanttTaskStatus, StatusStyle> = {
  semStatus: {
    label: "Sem status",
    event: "border-border bg-background hover:bg-muted",
    marker: "border border-dashed border-muted-foreground/60 bg-background",
  },
  concluido: {
    label: "Concluído",
    event:
      "border-chart-positive/35 bg-[color-mix(in_oklab,var(--chart-positive)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--chart-positive)_15%,var(--background))]",
    marker: "bg-chart-positive",
  },
  andamento: {
    label: "Em andamento",
    event:
      "border-primary/35 bg-[color-mix(in_oklab,var(--primary)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--primary)_15%,var(--background))]",
    marker: "bg-primary",
  },
  atencao: {
    label: "Atenção",
    event:
      "border-chart-negative/35 bg-[color-mix(in_oklab,var(--chart-negative)_9%,var(--background))] hover:bg-[color-mix(in_oklab,var(--chart-negative)_14%,var(--background))]",
    marker: "bg-chart-negative",
  },
  planejado: {
    label: "Planejado",
    event:
      "border-border bg-[color-mix(in_oklab,var(--muted-foreground)_8%,var(--background))] hover:bg-[color-mix(in_oklab,var(--muted-foreground)_12%,var(--background))]",
    marker: "bg-muted-foreground/70",
  },
  proximo: {
    label: "Próximo",
    event: "border-border bg-muted/80 hover:bg-muted",
    marker: "bg-muted-foreground/45",
  },
};

const statusOptions: GanttTaskStatus[] = [
  "semStatus",
  "andamento",
  "atencao",
  "planejado",
  "proximo",
  "concluido",
];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const current = startOfDay(date);
  const weekday = current.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;

  current.setDate(current.getDate() + mondayOffset);
  return current;
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function parseDateOnly(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isSameDay(first: Date, second: Date) {
  return toDateKey(first) === toDateKey(second);
}

function flattenTasks(tasks: GanttTask[]): GanttTask[] {
  return tasks.flatMap((task) =>
    task.subitems?.length ? flattenTasks(task.subitems) : [task],
  );
}

function buildFallbackTasks(anchor: Date): GanttTask[] {
  const monday = startOfWeek(anchor);
  const task = (
    id: string,
    title: string,
    dayOffset: number,
    status: GanttTaskStatus,
    owner: string,
  ): GanttTask => ({
    id,
    title,
    owner,
    blocker: "Sem dependências registradas",
    status,
    progress: status === "concluido" ? 100 : 0,
    start: toDateKey(addDays(monday, dayOffset)),
    end: toDateKey(addDays(monday, dayOffset)),
  });

  return [
    task("fallback-governanca", "Definir cadência de acompanhamento", 0, "andamento", "Liderança"),
    task("fallback-responsaveis", "Validar responsáveis das frentes críticas", 1, "atencao", "Fundador"),
    task("fallback-rituais", "Estruturar rituais de comunicação", 2, "planejado", "Operação"),
    task("fallback-indicadores", "Consolidar indicadores da operação", 3, "proximo", "Performance"),
    task("fallback-sops", "Revisar SOPs prioritários", 4, "concluido", "Processos"),
  ];
}

function buildCalendarEvents(tasks: GanttTask[]): CalendarEvent[] {
  const slotOffsets = [0, 60, 150, 240, 330, 420];
  const dayCounts = new Map<string, number>();

  return flattenTasks(tasks).map((task, index) => {
    const priority = task.actionPoint?.priority;
    const durationMinutes = priority === "Alta" ? 90 : priority === "Média" ? 75 : 60;
    const dayCount = dayCounts.get(task.start) ?? 0;
    const slotIndex = (index + dayCount) % slotOffsets.length;
    dayCounts.set(task.start, dayCount + 1);

    return {
      id: task.id,
      title: task.title,
      owner: task.owner,
      blocker: task.blocker,
      status: task.status,
      date: parseDateOnly(task.start),
      startMinutes: HOUR_START * 60 + slotOffsets[slotIndex],
      durationMinutes,
      actionPoint: task.actionPoint,
    };
  });
}

function formatTime(minutes: number) {
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minute = String(minutes % 60).padStart(2, "0");

  return `${hour}:${minute}`;
}

function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${weekStart.getDate()}–${weekEnd.getDate()} de ${MONTHS_PT[weekEnd.getMonth()]} de ${weekEnd.getFullYear()}`;
  }

  if (weekStart.getFullYear() === weekEnd.getFullYear()) {
    return `${weekStart.getDate()} de ${MONTHS_SHORT_PT[weekStart.getMonth()]} – ${weekEnd.getDate()} de ${MONTHS_SHORT_PT[weekEnd.getMonth()]} de ${weekEnd.getFullYear()}`;
  }

  return `${weekStart.getDate()} de ${MONTHS_SHORT_PT[weekStart.getMonth()]} de ${weekStart.getFullYear()} – ${weekEnd.getDate()} de ${MONTHS_SHORT_PT[weekEnd.getMonth()]} de ${weekEnd.getFullYear()}`;
}

function getInitialWeek(tasks: GanttTask[], today: Date) {
  const firstTask = flattenTasks(tasks)
    .map((task) => parseDateOnly(task.start))
    .sort((first, second) => first.getTime() - second.getTime())[0];

  return startOfWeek(firstTask ?? today);
}

function EventDetails({ event }: { event: CalendarEvent }) {
  const details = event.actionPoint;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-medium text-foreground">
          <span className={cn("size-2 rounded-full", statusMeta[event.status].marker)} />
          {statusMeta[event.status].label}
        </span>
        <span>{event.owner}</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">
          {formatTime(event.startMinutes)}–{formatTime(event.startMinutes + event.durationMinutes)}
        </span>
      </div>

      <dl className="grid gap-4 text-sm">
        <div>
          <dt className="font-medium text-foreground">Contexto</dt>
          <dd className="mt-1 leading-relaxed text-muted-foreground">
            {details?.problem ?? event.blocker}
          </dd>
        </div>
        {details ? (
          <>
            <div>
              <dt className="font-medium text-foreground">Impacto esperado</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">{details.expectedImpact}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Indicador de sucesso</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">{details.successIndicator}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="font-medium text-foreground">Prioridade</dt>
                <dd className="mt-1 text-muted-foreground">{details.priority}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Prazo sugerido</dt>
                <dd className="mt-1 text-muted-foreground">{details.suggestedDeadline}</dd>
              </div>
            </div>
          </>
        ) : null}
      </dl>
    </div>
  );
}

export function CalendarWorkspace({
  initialTasks,
  sourceLabel,
}: {
  initialTasks?: GanttTask[];
  sourceLabel?: string;
}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const tasks = useMemo(() => initialTasks ?? buildFallbackTasks(today), [initialTasks, today]);
  const events = useMemo(() => buildCalendarEvents(tasks), [tasks]);
  const [weekStart, setWeekStart] = useState(() => getInitialWeek(tasks, today));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const visibleEvents = events.filter((event) => {
    const inWeek = event.date >= weekStart && event.date < addDays(weekStart, 7);
    const matchesStatus = statusFilter === "todos" || event.status === statusFilter;

    return inWeek && matchesStatus;
  });
  const calendarHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const showCurrentTime =
    weekDays.some((day) => isSameDay(day, today)) &&
    currentMinutes >= HOUR_START * 60 &&
    currentMinutes <= HOUR_END * 60;

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4 lg:px-10">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <h1 className="text-base font-semibold">Agenda de action points</h1>
          </div>
          <p className="mt-1 max-w-[70ch] truncate text-sm text-muted-foreground">
            {sourceLabel ?? "Plano semanal de estruturação da operação"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setWeekStart(startOfWeek(today))}>
            Hoje
          </Button>
          <div className="flex items-center rounded-lg border bg-background p-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Semana anterior"
              onClick={() => setWeekStart((current) => addDays(current, -7))}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Próxima semana"
              onClick={() => setWeekStart((current) => addDays(current, 7))}
            >
              <ChevronRight />
            </Button>
          </div>
          <p className="min-w-56 px-2 text-sm font-medium tabular-nums">
            {formatWeekRange(weekStart)}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline">
                  <Filter />
                  {statusFilter === "todos" ? "Filtrar" : statusMeta[statusFilter].label}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("todos")}>
                <span className="flex-1">Todos</span>
                {statusFilter === "todos" ? <Check /> : null}
              </DropdownMenuItem>
              {statusOptions.map((status) => (
                <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)}>
                  <span className={cn("size-2 rounded-full", statusMeta[status].marker)} />
                  <span className="flex-1">{statusMeta[status].label}</span>
                  {statusFilter === status ? <Check /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto overscroll-none">
        <div className="relative min-h-full" style={{ minWidth: 72 + DAY_MIN_WIDTH * 7 }}>
          <div
            className="sticky top-0 z-30 grid border-b bg-background/95 supports-backdrop-filter:backdrop-blur-md"
            style={{ gridTemplateColumns: `72px repeat(7, minmax(${DAY_MIN_WIDTH}px, 1fr))` }}
          >
            <div className="sticky left-0 z-40 border-r bg-background" />
            {weekDays.map((day, index) => {
              const isToday = isSameDay(day, today);

              return (
                <div
                  key={toDateKey(day)}
                  className={cn(
                    "flex h-16 items-center justify-center gap-2 border-r text-sm last:border-r-0",
                    index >= 5 && "bg-muted/35",
                    isToday && "bg-primary/5",
                  )}
                >
                  <span className="text-xs font-medium text-muted-foreground">{WEEKDAYS_PT[index]}</span>
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full font-semibold tabular-nums",
                      isToday && "bg-primary text-primary-foreground",
                    )}
                  >
                    {day.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: `72px repeat(7, minmax(${DAY_MIN_WIDTH}px, 1fr))`,
              height: calendarHeight,
            }}
          >
            <div className="sticky left-0 z-20 border-r bg-background">
              {Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, index) => HOUR_START + index).map(
                (hour, index) => (
                  <span
                    key={hour}
                    className={cn(
                      "absolute right-3 text-xs text-muted-foreground tabular-nums",
                      index === 0 ? "translate-y-2" : "-translate-y-1/2",
                    )}
                    style={{ top: index * HOUR_HEIGHT }}
                  >
                    {String(hour).padStart(2, "0")}:00
                  </span>
                ),
              )}
            </div>

            {weekDays.map((day, dayIndex) => {
              const dayEvents = visibleEvents.filter((event) => isSameDay(event.date, day));

              return (
                <div
                  key={toDateKey(day)}
                  className={cn("relative border-r last:border-r-0", dayIndex >= 5 && "bg-muted/25")}
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom, transparent calc(100% - 1px), var(--border) calc(100% - 1px))",
                    backgroundSize: `100% ${HOUR_HEIGHT}px`,
                  }}
                >
                  {dayEvents.map((event) => {
                    const top = ((event.startMinutes - HOUR_START * 60) / 60) * HOUR_HEIGHT;
                    const height = Math.max(48, (event.durationMinutes / 60) * HOUR_HEIGHT);

                    return (
                      <button
                        key={event.id}
                        type="button"
                        className={cn(
                          "absolute inset-x-1.5 overflow-hidden rounded-md border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                          statusMeta[event.status].event,
                        )}
                        style={{ top: top + 5, height: height - 10 }}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <span className="block text-[11px] font-medium text-muted-foreground tabular-nums">
                          {formatTime(event.startMinutes)}–{formatTime(event.startMinutes + event.durationMinutes)}
                        </span>
                        <span className="mt-1 line-clamp-2 block text-xs font-semibold leading-snug text-foreground">
                          {event.title}
                        </span>
                        {height >= 72 ? (
                          <span className="mt-1 block truncate text-[11px] text-muted-foreground">{event.owner}</span>
                        ) : null}
                      </button>
                    );
                  })}

                  {showCurrentTime && isSameDay(day, today) ? (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                      style={{ top: ((currentMinutes - HOUR_START * 60) / 60) * HOUR_HEIGHT }}
                      aria-hidden="true"
                    >
                      <span className="-ml-1 size-2 rounded-full bg-primary" />
                      <span className="h-px flex-1 bg-primary" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {visibleEvents.length === 0 ? (
            <div className="pointer-events-none absolute inset-x-20 top-32 z-10 flex justify-center">
              <div className="rounded-lg border bg-background px-4 py-3 text-center">
                <p className="text-sm font-medium">Nenhum action point nesta semana</p>
                <p className="mt-1 text-xs text-muted-foreground">Navegue para outro período ou ajuste o filtro.</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <Dialog
        open={selectedEvent !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      >
        <DialogContent>
          <DialogHeader className="pr-8">
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>Detalhes do action point e critérios de acompanhamento.</DialogDescription>
          </DialogHeader>
          {selectedEvent ? <EventDetails event={selectedEvent} /> : null}
          <DialogClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-3 top-3"
                aria-label="Fechar detalhes"
              >
                <X />
              </Button>
            }
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
