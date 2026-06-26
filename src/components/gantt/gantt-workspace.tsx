"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  GanttActionPointDetails,
  GanttTask as GanttTaskData,
  GanttTaskStatus,
} from "@/lib/contracts";
import { cn } from "@/lib/utils";

const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
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
const MONTHS_LONG_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Data de demonstração fixa para manter o mock coerente.
// Substituir por data real ao conectar o motor de cronograma.
const TODAY = new Date(2026, 5, 21); // 21 jun 2026

const MS_PER_DAY = 86_400_000;
const PANEL_WIDTH = "520px";

type TaskStatus = GanttTaskStatus;

type TimelineScale = "mes" | "semana" | "dia";
type StatusFilter = TaskStatus | "todos";
type ResizeSide = "start" | "end";

const scaleOptions: Array<{ label: string; value: TimelineScale }> = [
  { label: "Mês", value: "mes" },
  { label: "Semana", value: "semana" },
  { label: "Dia", value: "dia" },
];

const scaleDayColumns: Record<TimelineScale, string> = {
  mes: "minmax(44px, 1fr)",
  semana: "minmax(96px, 1fr)",
  dia: "minmax(240px, 1fr)",
};

const scaleDayMinWidth: Record<TimelineScale, number> = {
  mes: 44,
  semana: 96,
  dia: 240,
};

const smoothRevealEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, date.getDate());
}

function startOfWeek(date: Date) {
  const current = startOfDay(date);
  const weekday = current.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;

  return addDays(current, mondayOffset);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysBetween(start: Date, end: Date) {
  return Math.round(
    (startOfDay(end).getTime() - startOfDay(start).getTime()) / MS_PER_DAY,
  );
}

function formatDayMonth(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS_SHORT_PT[date.getMonth()]}`;
}

function buildTimelineRange(anchor: Date, scale: TimelineScale) {
  if (scale === "dia") {
    const start = startOfDay(anchor);

    return { start, end: start };
  }

  if (scale === "semana") {
    const start = startOfWeek(anchor);

    return { start, end: addDays(start, 6) };
  }

  const start = startOfMonth(anchor);

  return { start, end: addDays(addMonths(start, 12), -1) };
}

function shiftTimelineAnchor(
  anchor: Date,
  scale: TimelineScale,
  direction: -1 | 1,
) {
  if (scale === "dia") {
    return addDays(anchor, direction);
  }

  if (scale === "semana") {
    return addDays(anchor, direction * 7);
  }

  return addMonths(anchor, direction * 12);
}

type GanttDay = {
  key: string;
  dayLabel: string;
  weekday: string;
  isWeekend: boolean;
  isToday: boolean;
};

function buildDays(start: Date, end: Date, today: Date): GanttDay[] {
  const total = daysBetween(start, end);
  const days: GanttDay[] = [];

  for (let offset = 0; offset <= total; offset += 1) {
    const date = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + offset,
    );
    const weekday = date.getDay();

    days.push({
      key: date.toISOString(),
      dayLabel: String(date.getDate()).padStart(2, "0"),
      weekday: WEEKDAYS_PT[weekday],
      isWeekend: weekday === 0 || weekday === 6,
      isToday: daysBetween(today, date) === 0,
    });
  }

  return days;
}

type MonthSpan = { label: string; start: number; span: number };

function buildMonthSpans(start: Date, count: number): MonthSpan[] {
  const spans: MonthSpan[] = [];

  for (let offset = 0; offset < count; offset += 1) {
    const date = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + offset,
    );
    const label = `${MONTHS_LONG_PT[date.getMonth()]} ${date.getFullYear()}`;
    const last = spans.at(-1);

    if (last && last.label === label) {
      last.span += 1;
    } else {
      spans.push({ label, start: offset + 1, span: 1 });
    }
  }

  return spans;
}

type GanttTask = {
  id: string;
  title: string;
  owner: string;
  blocker: string;
  status: TaskStatus;
  progress: number;
  start: Date;
  end: Date;
  actionPoint?: GanttActionPointDetails;
  subitems?: GanttTask[];
};

const defaultTimelineTasks: GanttTask[] = [
  {
    id: "diagnostico-inicial",
    title: "Estruturar diagnóstico inicial",
    owner: "Estruturação",
    blocker: "Sem dependências",
    status: "concluido",
    progress: 100,
    start: new Date(2026, 5, 15),
    end: new Date(2026, 5, 19),
    subitems: [
      {
        id: "diagnostico-inicial-kickoff",
        title: "Kickoff do projeto",
        owner: "Estruturação",
        blocker: "Sem dependências",
        status: "concluido",
        progress: 100,
        start: new Date(2026, 5, 15),
        end: new Date(2026, 5, 15),
      },
      {
        id: "diagnostico-inicial-desenho",
        title: "Desenho macro do sistema operacional",
        owner: "Estruturação",
        blocker: "Sem dependências",
        status: "concluido",
        progress: 100,
        start: new Date(2026, 5, 16),
        end: new Date(2026, 5, 17),
      },
      {
        id: "diagnostico-inicial-entrevistas",
        title: "Entrevistas e levantamento do fluxo de trabalho",
        owner: "Operação",
        blocker: "Agenda da operação",
        status: "concluido",
        progress: 100,
        start: new Date(2026, 5, 17),
        end: new Date(2026, 5, 19),
      },
    ],
  },
  {
    id: "frentes-criticas",
    title: "Mapear frentes críticas",
    owner: "Estruturação",
    blocker: "Definição de escopo",
    status: "andamento",
    progress: 72,
    start: new Date(2026, 5, 17),
    end: new Date(2026, 5, 24),
  },
  {
    id: "validar-responsaveis",
    title: "Validar responsáveis",
    owner: "Liderança",
    blocker: "Agenda da liderança",
    status: "atencao",
    progress: 46,
    start: new Date(2026, 5, 23),
    end: new Date(2026, 6, 1),
  },
  {
    id: "rotina-semanal",
    title: "Desenhar rotina semanal",
    owner: "Operação",
    blocker: "Responsáveis finais",
    status: "planejado",
    progress: 28,
    start: new Date(2026, 5, 29),
    end: new Date(2026, 6, 6),
  },
  {
    id: "sops-prioritarios",
    title: "Publicar SOPs prioritários",
    owner: "Processos",
    blocker: "Revisão de conteúdo",
    status: "andamento",
    progress: 58,
    start: new Date(2026, 6, 1),
    end: new Date(2026, 6, 9),
  },
  {
    id: "indicadores-cadencia",
    title: "Fechar indicadores da cadência",
    owner: "Performance",
    blocker: "Base de indicadores",
    status: "semStatus",
    progress: 12,
    start: new Date(2026, 6, 6),
    end: new Date(2026, 6, 12),
  },
];

function parseDateOnly(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function hydrateGanttTask(task: GanttTaskData): GanttTask {
  return {
    ...task,
    start: parseDateOnly(task.start),
    end: parseDateOnly(task.end),
    subitems: task.subitems?.map(hydrateGanttTask),
  };
}

type StatusStyle = {
  label: string;
  marker: string;
  bar: string;
  fill: string;
};

const statusMeta: Record<TaskStatus, StatusStyle> = {
  semStatus: {
    label: "Sem status",
    marker: "border-dashed border-muted-foreground/55 bg-transparent",
    bar: "border-border bg-background",
    fill:
      "bg-[color-mix(in_oklab,var(--muted-foreground)_18%,var(--background))]",
  },
  concluido: {
    label: "Concluído",
    marker: "border-chart-positive bg-chart-positive",
    bar:
      "border-chart-positive bg-[color-mix(in_oklab,var(--chart-positive)_12%,var(--background))]",
    fill:
      "bg-[color-mix(in_oklab,var(--chart-positive)_34%,var(--background))]",
  },
  andamento: {
    label: "Em andamento",
    marker: "border-primary bg-primary",
    bar:
      "border-primary bg-[color-mix(in_oklab,var(--primary)_12%,var(--background))]",
    fill:
      "bg-[color-mix(in_oklab,var(--primary)_34%,var(--background))]",
  },
  atencao: {
    label: "Atenção",
    marker: "border-chart-negative bg-chart-negative",
    bar:
      "border-chart-negative bg-[color-mix(in_oklab,var(--chart-negative)_12%,var(--background))]",
    fill:
      "bg-[color-mix(in_oklab,var(--chart-negative)_34%,var(--background))]",
  },
  planejado: {
    label: "Planejado",
    marker: "border-muted-foreground/60 bg-muted-foreground/60",
    bar:
      "border-border bg-[color-mix(in_oklab,var(--muted-foreground)_10%,var(--background))]",
    fill:
      "bg-[color-mix(in_oklab,var(--muted-foreground)_30%,var(--background))]",
  },
  proximo: {
    label: "Próximo",
    marker: "border-muted-foreground/40 bg-muted-foreground/40",
    bar:
      "border-border bg-[color-mix(in_oklab,var(--muted-foreground)_8%,var(--background))]",
    fill:
      "bg-[color-mix(in_oklab,var(--muted-foreground)_24%,var(--background))]",
  },
};

const statusOptions: TaskStatus[] = [
  "semStatus",
  "andamento",
  "atencao",
  "planejado",
  "proximo",
  "concluido",
];

const panelColumns = "minmax(280px, 1fr) 76px";
const stickyPanelClass =
  "sticky left-0 z-50 border-r border-border/80 bg-background/58 [backdrop-filter:blur(160px)_saturate(150%)] [-webkit-backdrop-filter:blur(160px)_saturate(150%)] dark:bg-background/62";
const footerPanelClass =
  "sticky left-0 z-50 border-r border-border/80 bg-background/58 [backdrop-filter:blur(160px)_saturate(150%)] [-webkit-backdrop-filter:blur(160px)_saturate(150%)] dark:bg-background/62";

function calculateAverageProgress(tasks: GanttTask[]) {
  if (tasks.length === 0) {
    return 0;
  }

  return Math.round(
    tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length,
  );
}

function completionProgress(
  task: GanttTask,
  status: TaskStatus,
  depth: number,
) {
  if (depth === 0) {
    return task.progress;
  }

  return status === "concluido" ? 100 : 0;
}

function deriveTimelineTasks(
  tasks: GanttTask[],
  taskStatuses: Record<string, TaskStatus>,
  depth = 0,
): GanttTask[] {
  return tasks.map((task) => {
    const subitems = task.subitems
      ? deriveTimelineTasks(task.subitems, taskStatuses, depth + 1)
      : undefined;

    if (!subitems?.length) {
      return {
        ...task,
        progress: completionProgress(
          task,
          getTaskStatus(task, taskStatuses),
          depth,
        ),
      };
    }

    const progress = Math.round(
      subitems.reduce((sum, subitem) => sum + subitem.progress, 0) /
        subitems.length,
    );
    const start = subitems.reduce(
      (earliest, subitem) =>
        startOfDay(subitem.start) < startOfDay(earliest)
          ? subitem.start
          : earliest,
      task.start,
    );
    const end = subitems.reduce(
      (latest, subitem) =>
        startOfDay(subitem.end) > startOfDay(latest) ? subitem.end : latest,
      task.end,
    );

    return {
      ...task,
      end,
      progress,
      start,
      subitems,
    };
  });
}

function taskPlacement(task: GanttTask, rangeStart: Date, rangeEnd: Date) {
  if (startOfDay(task.end) < startOfDay(rangeStart)) {
    return null;
  }

  if (startOfDay(task.start) > startOfDay(rangeEnd)) {
    return null;
  }

  const totalDays = daysBetween(rangeStart, rangeEnd) + 1;
  const startCol = Math.max(1, daysBetween(rangeStart, task.start) + 1);
  const endCol = Math.min(totalDays, daysBetween(rangeStart, task.end) + 1);

  return { start: startCol, span: Math.max(1, endCol - startCol + 1) };
}

type TimelineRow = {
  task: GanttTask;
  depth: number;
  status: TaskStatus;
  isParent: boolean;
  isExpanded: boolean;
  isCollapsing: boolean;
};

type ResizeSession = {
  taskId: string;
  side: ResizeSide;
  pointerStartX: number;
  dayWidth: number;
  originalStart: Date;
  originalEnd: Date;
};

type GanttContextMenu = {
  task: GanttTask;
  x: number;
  y: number;
};

function getTaskStatus(
  task: GanttTask,
  taskStatuses: Record<string, TaskStatus>,
) {
  return taskStatuses[task.id] ?? task.status;
}

function taskMatchesFilter(
  task: GanttTask,
  taskStatuses: Record<string, TaskStatus>,
  statusFilter: StatusFilter,
): boolean {
  if (statusFilter === "todos") {
    return true;
  }

  if (getTaskStatus(task, taskStatuses) === statusFilter) {
    return true;
  }

  return (
    task.subitems?.some((subitem) =>
      taskMatchesFilter(subitem, taskStatuses, statusFilter),
    ) ?? false
  );
}

function buildTimelineRows(
  tasks: GanttTask[],
  taskStatuses: Record<string, TaskStatus>,
  expandedTasks: Record<string, boolean>,
  collapsingTasks: Record<string, boolean>,
  statusFilter: StatusFilter,
  depth = 0,
  ancestorIsCollapsing = false,
): TimelineRow[] {
  return tasks.flatMap((task) => {
    if (!taskMatchesFilter(task, taskStatuses, statusFilter)) {
      return [];
    }

    const subitems = task.subitems ?? [];
    const isCollapsing = collapsingTasks[task.id] ?? false;
    const isExpanded = (expandedTasks[task.id] ?? false) && !isCollapsing;
    const shouldRenderSubitems = isExpanded || isCollapsing;
    const row: TimelineRow = {
      task,
      depth,
      status: getTaskStatus(task, taskStatuses),
      isParent: subitems.length > 0,
      isExpanded,
      isCollapsing: ancestorIsCollapsing,
    };

    if (!shouldRenderSubitems) {
      return [row];
    }

    return [
      row,
      ...buildTimelineRows(
        subitems,
        taskStatuses,
        expandedTasks,
        collapsingTasks,
        statusFilter,
        depth + 1,
        ancestorIsCollapsing || isCollapsing,
      ),
    ];
  });
}

function collectDefaultStatuses(tasks: GanttTask[]) {
  return tasks.reduce<Record<string, TaskStatus>>((statuses, task) => {
    statuses[task.id] = task.status;

    if (task.subitems) {
      Object.assign(statuses, collectDefaultStatuses(task.subitems));
    }

    return statuses;
  }, {});
}

function collectExpandedTasks(tasks: GanttTask[]) {
  return tasks.reduce<Record<string, boolean>>((expanded, task) => {
    if (task.subitems?.length) {
      expanded[task.id] = true;
      Object.assign(expanded, collectExpandedTasks(task.subitems));
    }

    return expanded;
  }, {});
}

function omitRecordKey<T>(record: Record<string, T>, key: string) {
  const next = { ...record };

  delete next[key];

  return next;
}

function appendSubitem(
  tasks: GanttTask[],
  parentId: string,
  subitem: GanttTask,
): GanttTask[] {
  return tasks.map((task) => {
    if (task.id === parentId) {
      return {
        ...task,
        subitems: [...(task.subitems ?? []), subitem],
      };
    }

    if (task.subitems) {
      return {
        ...task,
        subitems: appendSubitem(task.subitems, parentId, subitem),
      };
    }

    return task;
  });
}

function updateTaskSchedule(
  tasks: GanttTask[],
  taskId: string,
  dates: { start: Date; end: Date },
): GanttTask[] {
  return tasks.map((task) => {
    if (task.id === taskId) {
      return {
        ...task,
        start: dates.start,
        end: dates.end,
      };
    }

    if (task.subitems) {
      return {
        ...task,
        subitems: updateTaskSchedule(task.subitems, taskId, dates),
      };
    }

    return task;
  });
}

function deleteTaskById(tasks: GanttTask[], taskId: string): GanttTask[] {
  return tasks
    .filter((task) => task.id !== taskId)
    .map((task) => {
      if (!task.subitems) {
        return task;
      }

      return {
        ...task,
        subitems: deleteTaskById(task.subitems, taskId),
      };
    });
}

function collectTaskIds(task: GanttTask): string[] {
  return [
    task.id,
    ...(task.subitems?.flatMap((subitem) => collectTaskIds(subitem)) ?? []),
  ];
}

function findTaskById(tasks: GanttTask[], taskId: string): GanttTask | null {
  for (const task of tasks) {
    if (task.id === taskId) {
      return task;
    }

    const match = task.subitems ? findTaskById(task.subitems, taskId) : null;

    if (match) {
      return match;
    }
  }

  return null;
}

function formatScore(score: number) {
  return score.toFixed(1).replace(".", ",");
}

function formatScoreOrNoBase(score: number | null) {
  return score === null ? "Sem base" : formatScore(score);
}

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[0.68rem] font-medium text-muted-foreground">
        {label}
      </p>
      <div className="text-sm leading-relaxed text-foreground">{value}</div>
    </div>
  );
}

function StatusMarker({
  className,
  status,
}: {
  className?: string;
  status: TaskStatus;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-[7.7px] rounded-full border-[1.5px]",
        statusMeta[status].marker,
        className,
      )}
    />
  );
}

type GanttWorkspaceProps = {
  initialTasks?: GanttTaskData[];
  sourceLabel?: string;
};

export function GanttWorkspace({
  initialTasks,
  sourceLabel,
}: GanttWorkspaceProps) {
  const shouldReduceMotion = useReducedMotion();
  const initialTimelineItems = initialTasks
    ? initialTasks.map(hydrateGanttTask)
    : defaultTimelineTasks;

  const [timelineItems, setTimelineItems] = useState<GanttTask[]>(
    () => initialTimelineItems,
  );
  const [timelineScale, setTimelineScale] = useState<TimelineScale>("mes");
  const [timelineAnchor, setTimelineAnchor] = useState(TODAY);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [resizeSession, setResizeSession] = useState<ResizeSession | null>(
    null,
  );
  const [contextMenu, setContextMenu] = useState<GanttContextMenu | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const resizeSessionRef = useRef<ResizeSession | null>(null);
  const collapseTimersRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const nextSubitemIdRef = useRef(0);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>(
    () => collectExpandedTasks(initialTimelineItems),
  );
  const [collapsingTasks, setCollapsingTasks] = useState<
    Record<string, boolean>
  >({});
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>(
    () => collectDefaultStatuses(initialTimelineItems),
  );
  const derivedTimelineItems = deriveTimelineTasks(timelineItems, taskStatuses);
  const visibleRows = buildTimelineRows(
    derivedTimelineItems,
    taskStatuses,
    expandedTasks,
    collapsingTasks,
    statusFilter,
  );
  const visibleTopLevelItems = derivedTimelineItems.filter((task) =>
    taskMatchesFilter(task, taskStatuses, statusFilter),
  );
  const averageProgress = calculateAverageProgress(visibleTopLevelItems);
  const timelineRange = buildTimelineRange(timelineAnchor, timelineScale);
  const timelineDays = buildDays(timelineRange.start, timelineRange.end, TODAY);
  const totalDays = timelineDays.length;
  const monthSpans = buildMonthSpans(timelineRange.start, totalDays);
  const dayColumns = `repeat(${totalDays}, ${scaleDayColumns[timelineScale]})`;
  const todayIndex = timelineDays.findIndex((day) => day.isToday);
  const todayFraction =
    todayIndex >= 0 ? (todayIndex + 0.5) / totalDays : null;
  const minTimelineWidth = `calc(${PANEL_WIDTH} + ${
    totalDays * scaleDayMinWidth[timelineScale]
  }px)`;
  const hasActiveFilter = statusFilter !== "todos";
  const rowTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: smoothRevealEase };
  const collapseDurationMs = shouldReduceMotion ? 0 : 280;
  const chevronTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: smoothRevealEase };
  const selectedTask = selectedTaskId
    ? findTaskById(derivedTimelineItems, selectedTaskId)
    : null;

  function clearCollapseTimer(taskId: string) {
    const timer = collapseTimersRef.current[taskId];

    if (!timer) {
      return;
    }

    clearTimeout(timer);
    delete collapseTimersRef.current[taskId];
  }

  function updateTaskStatus(task: GanttTask, status: TaskStatus) {
    setTaskStatuses((current) => {
      return {
        ...current,
        [task.id]: status,
      };
    });
  }

  function toggleTask(task: GanttTask) {
    const isOpen =
      (expandedTasks[task.id] ?? false) && !collapsingTasks[task.id];

    clearCollapseTimer(task.id);

    if (!isOpen) {
      setCollapsingTasks((current) => omitRecordKey(current, task.id));
      setExpandedTasks((current) => ({ ...current, [task.id]: true }));

      return;
    }

    setCollapsingTasks((current) => ({ ...current, [task.id]: true }));
    collapseTimersRef.current[task.id] = setTimeout(() => {
      setExpandedTasks((current) => ({ ...current, [task.id]: false }));
      setCollapsingTasks((current) => omitRecordKey(current, task.id));
      delete collapseTimersRef.current[task.id];
    }, collapseDurationMs);
  }

  function addSubitem(parent: GanttTask) {
    const index = (parent.subitems?.length ?? 0) + 1;
    nextSubitemIdRef.current += 1;
    const id = `${parent.id}-subitem-${nextSubitemIdRef.current}`;
    const subitem: GanttTask = {
      id,
      title: `Novo subitem ${index}`,
      owner: parent.owner,
      blocker: "Sem bloqueio",
      status: "semStatus",
      progress: 0,
      start: parent.start,
      end: parent.end,
    };

    setTimelineItems((current) => appendSubitem(current, parent.id, subitem));
    setTaskStatuses((current) => ({ ...current, [id]: subitem.status }));
    clearCollapseTimer(parent.id);
    setCollapsingTasks((current) => omitRecordKey(current, parent.id));
    setExpandedTasks((current) => ({ ...current, [parent.id]: true }));
  }

  function openTaskContextMenu(
    event: MouseEvent<HTMLDivElement>,
    task: GanttTask,
  ) {
    event.preventDefault();
    setContextMenu({
      task,
      x: event.clientX,
      y: event.clientY,
    });
  }

  function openTaskDetails(event: MouseEvent<HTMLElement>, task: GanttTask) {
    const target = event.target;

    if (
      event.defaultPrevented ||
      (target instanceof HTMLElement &&
        target.closest(
          "button,a,[role='menuitem'],[data-gantt-ignore-task-click]",
        ))
    ) {
      return;
    }

    setSelectedTaskId(task.id);
  }

  function deleteTask(task: GanttTask) {
    const removedIds = new Set(collectTaskIds(task));

    removedIds.forEach((taskId) => clearCollapseTimer(taskId));
    setTimelineItems((current) => deleteTaskById(current, task.id));
    setTaskStatuses((current) => {
      return Object.fromEntries(
        Object.entries(current).filter(([taskId]) => !removedIds.has(taskId)),
      );
    });
    setExpandedTasks((current) => {
      return Object.fromEntries(
        Object.entries(current).filter(([taskId]) => !removedIds.has(taskId)),
      );
    });
    setCollapsingTasks((current) => {
      return Object.fromEntries(
        Object.entries(current).filter(([taskId]) => !removedIds.has(taskId)),
      );
    });
    setContextMenu(null);
    setSelectedTaskId((current) => (removedIds.has(current ?? "") ? null : current));
  }

  function startTaskResize(
    event: PointerEvent<HTMLButtonElement>,
    task: GanttTask,
    placement: NonNullable<ReturnType<typeof taskPlacement>>,
    side: ResizeSide,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const barWrapper = event.currentTarget.closest("[data-gantt-bar-wrapper]");

    if (!(barWrapper instanceof HTMLElement)) {
      return;
    }

    const dayWidth = barWrapper.getBoundingClientRect().width / placement.span;

    if (!Number.isFinite(dayWidth) || dayWidth <= 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);

    const nextSession = {
      taskId: task.id,
      side,
      pointerStartX: event.clientX,
      dayWidth,
      originalStart: task.start,
      originalEnd: task.end,
    };

    resizeSessionRef.current = nextSession;
    setResizeSession(nextSession);
  }

  function startTaskResizeWithMouse(
    event: MouseEvent<HTMLButtonElement>,
    task: GanttTask,
    placement: NonNullable<ReturnType<typeof taskPlacement>>,
    side: ResizeSide,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const barWrapper = event.currentTarget.closest("[data-gantt-bar-wrapper]");

    if (!(barWrapper instanceof HTMLElement)) {
      return;
    }

    const dayWidth = barWrapper.getBoundingClientRect().width / placement.span;

    if (!Number.isFinite(dayWidth) || dayWidth <= 0) {
      return;
    }

    const nextSession = {
      taskId: task.id,
      side,
      pointerStartX: event.clientX,
      dayWidth,
      originalStart: task.start,
      originalEnd: task.end,
    };

    resizeSessionRef.current = nextSession;
    setResizeSession(nextSession);
  }

  function resizeTaskByClientX(clientX: number) {
    const currentSession = resizeSessionRef.current;

    if (!currentSession) {
      return;
    }

    const dayDelta = Math.round(
      (clientX - currentSession.pointerStartX) / currentSession.dayWidth,
    );
    const nextStart =
      currentSession.side === "start"
        ? addDays(
            currentSession.originalStart,
            Math.min(
              dayDelta,
              daysBetween(currentSession.originalStart, currentSession.originalEnd),
            ),
          )
        : currentSession.originalStart;
    const nextEnd =
      currentSession.side === "end"
        ? addDays(
            currentSession.originalEnd,
            Math.max(
              dayDelta,
              -daysBetween(currentSession.originalStart, currentSession.originalEnd),
            ),
          )
        : currentSession.originalEnd;

    setTimelineItems((current) =>
      updateTaskSchedule(current, currentSession.taskId, {
        start: nextStart,
        end: nextEnd,
      }),
    );
  }

  function resizeTask(event: PointerEvent<HTMLButtonElement>) {
    resizeTaskByClientX(event.clientX);
  }

  useEffect(() => {
    const timers = collapseTimersRef.current;

    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (!resizeSession) {
      return;
    }

    function handleMouseMove(event: globalThis.MouseEvent) {
      resizeTaskByClientX(event.clientX);
    }

    function handleMouseUp() {
      resizeSessionRef.current = null;
      setResizeSession(null);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizeSession]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    function closeContextMenu() {
      setContextMenu(null);
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        closeContextMenu();
      }
    }

    window.addEventListener("click", closeContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("click", closeContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  function finishTaskResize(event: PointerEvent<HTMLButtonElement>) {
    if (!resizeSessionRef.current) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    resizeSessionRef.current = null;
    setResizeSession(null);
  }

  function shiftPeriod(direction: -1 | 1) {
    setTimelineAnchor((current) =>
      shiftTimelineAnchor(current, timelineScale, direction),
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col bg-background",
        resizeSession && "select-none",
      )}
    >
      <header className="shrink-0 border-b px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="mr-auto flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h1 className="truncate text-base font-semibold text-foreground">
              Cronograma operacional
            </h1>
            {sourceLabel && (
              <p className="truncate text-xs text-muted-foreground">
                {sourceLabel}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTimelineAnchor(TODAY)}
            >
              Hoje
            </Button>
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-r-none"
                aria-label="Período anterior"
                onClick={() => shiftPeriod(-1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                className="-ml-px rounded-l-none"
                aria-label="Próximo período"
                onClick={() => shiftPeriod(1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <div className="mx-0.5 h-5 w-px bg-border" />
            <div className="inline-flex rounded-lg border bg-background p-0.5">
              {scaleOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  size="xs"
                  aria-pressed={timelineScale === option.value}
                  className={cn(
                    timelineScale === option.value &&
                      "bg-muted text-foreground",
                  )}
                  onClick={() => setTimelineScale(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant={hasActiveFilter ? "outline" : "ghost"}
                    size="sm"
                  />
                }
              >
                <Filter className="size-3.5" />
                Filtrar
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={6}
                className="w-48 min-w-48 rounded-md border bg-popover p-1 shadow-none"
              >
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuItem
                  className="h-7 gap-2 px-2 text-xs"
                  onClick={() => setStatusFilter("todos")}
                >
                  <span className="size-[7.7px] rounded-full border border-muted-foreground/35 bg-muted" />
                  <span className="flex-1 truncate">Todos os status</span>
                  {statusFilter === "todos" && (
                    <Check className="size-3.5 text-muted-foreground" />
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {statusOptions.map((status) => {
                  const option = statusMeta[status];
                  const isSelected = statusFilter === status;

                  return (
                    <DropdownMenuItem
                      key={status}
                      className="h-7 gap-2 px-2 text-xs"
                      onClick={() => setStatusFilter(status)}
                    >
                      <StatusMarker status={status} />
                      <span className="flex-1 truncate">{option.label}</span>
                      {isSelected && (
                        <Check className="size-3.5 text-muted-foreground" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon-sm" aria-label="Buscar">
              <Search className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" aria-label="Mais opções">
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="min-h-0 flex-1 bg-background">
        <div className="h-full overflow-auto">
          <div
            className="flex min-h-full flex-col"
            style={{ minWidth: minTimelineWidth }}
          >
            <div
              className="grid shrink-0 border-b bg-muted/30"
              style={{ gridTemplateColumns: `${PANEL_WIDTH} minmax(0, 1fr)` }}
            >
              <div
                className={cn(
                  stickyPanelClass,
                  "flex min-w-0 items-center gap-2 px-4 text-xs font-medium text-muted-foreground",
                )}
              >
                <span className="truncate tabular-nums">
                  {visibleRows.length} itens · progresso médio{" "}
                  {averageProgress}%
                </span>
              </div>
              <div className="grid" style={{ gridTemplateColumns: dayColumns }}>
                {monthSpans.map((month) => (
                  <div
                    key={month.label}
                    className="border-r px-3 py-2 text-center text-xs font-medium text-muted-foreground last:border-r-0"
                    style={{
                      gridColumn: `${month.start} / span ${month.span}`,
                    }}
                  >
                    {month.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative isolate flex min-h-0 flex-1 flex-col">
              <div
                aria-hidden
                className="absolute inset-0 -z-10 grid"
                style={{
                  gridTemplateColumns: `${PANEL_WIDTH} minmax(0, 1fr)`,
                }}
              >
                <div />
                <div
                  className="grid"
                  style={{ gridTemplateColumns: dayColumns }}
                >
                  {timelineDays.map((day) => (
                    <div
                      key={day.key}
                      className={cn(
                        "border-r border-border/50 last:border-r-0",
                        day.isWeekend && "bg-muted/50",
                        day.isToday && "bg-primary/[0.05]",
                      )}
                    />
                  ))}
                </div>
              </div>

              <div
                className="grid shrink-0 border-b"
                style={{
                  gridTemplateColumns: `${PANEL_WIDTH} minmax(0, 1fr)`,
                }}
              >
                <div
                  className={cn(
                    stickyPanelClass,
                    "grid text-xs font-medium text-muted-foreground",
                  )}
                  style={{ gridTemplateColumns: panelColumns }}
                >
                  <div className="flex items-center px-4 py-2">Frente</div>
                  <div className="flex items-center px-3 py-2">
                    Prazo
                  </div>
                </div>
                <div
                  className="grid"
                  style={{ gridTemplateColumns: dayColumns }}
                >
                  {timelineDays.map((day) => (
                    <div key={day.key} className="px-1 py-2 text-center">
                      <p
                        className={cn(
                          "text-[0.65rem] font-medium",
                          day.isToday
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        {day.weekday}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-xs font-medium tabular-nums",
                          day.isToday
                            ? "text-primary"
                            : day.isWeekend
                              ? "text-muted-foreground"
                              : "text-foreground",
                        )}
                      >
                        {day.dayLabel}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {visibleRows.length === 0 && (
                  <div
                    className="grid min-h-24 border-b"
                    style={{
                      gridTemplateColumns: `${PANEL_WIDTH} minmax(0, 1fr)`,
                    }}
                  >
                    <div
                      className={cn(
                        stickyPanelClass,
                        "flex min-w-0 items-center px-4 py-4",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          Nenhum action point disponível
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          O cronograma será preenchido quando houver um diagnóstico
                          consolidado para gerar action points quantitativos.
                        </p>
                      </div>
                    </div>
                    <div
                      className="grid"
                      style={{ gridTemplateColumns: dayColumns }}
                    />
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {visibleRows.map((row, rowIndex) => {
                    const { task, depth, isExpanded, isParent, status } = row;
                    const placement = taskPlacement(
                      task,
                      timelineRange.start,
                      timelineRange.end,
                    );
                    const meta = statusMeta[status];

                    return (
                      <motion.div
                        key={task.id}
                        animate={
                          depth === 0
                            ? { opacity: 1, y: 0 }
                            : row.isCollapsing
                              ? {
                                  clipPath: "inset(0 0 100% 0)",
                                  height: 0,
                                  opacity: 0,
                                  y: shouldReduceMotion ? 0 : -5,
                                }
                              : {
                                  clipPath: "inset(0 0 0% 0)",
                                  height: "auto",
                                  opacity: 1,
                                  y: 0,
                                }
                        }
                        exit={
                          depth === 0
                            ? {
                                opacity: 0,
                                y: shouldReduceMotion ? 0 : -5,
                              }
                            : {
                                clipPath: "inset(0 0 100% 0)",
                                height: 0,
                                opacity: 0,
                                y: shouldReduceMotion ? 0 : -5,
                              }
                        }
                        initial={
                          depth === 0
                            ? {
                                opacity: 0,
                                y: shouldReduceMotion ? 0 : -5,
                              }
                            : {
                                clipPath: "inset(0 0 100% 0)",
                                height: 0,
                                opacity: 0,
                                y: shouldReduceMotion ? 0 : -5,
                              }
                        }
                        transition={rowTransition}
                        onContextMenu={(event) =>
                          openTaskContextMenu(event, task)
                        }
                        onClick={(event) => openTaskDetails(event, task)}
                      >
                        <div
                          className={cn(
                            "group/row grid cursor-pointer",
                            rowIndex > 0 && depth === 0 && "border-t",
                            depth === 0 ? "min-h-13" : "min-h-10",
                          )}
                          style={{
                            gridTemplateColumns: `${PANEL_WIDTH} minmax(0, 1fr)`,
                          }}
                        >
                        <div
                          className={cn(
                            stickyPanelClass,
                            "grid",
                          )}
                          style={{ gridTemplateColumns: panelColumns }}
                        >
                          <div
                            className="flex min-w-0 items-center py-2 pr-4"
                            style={{ paddingLeft: `${16 + depth * 24}px` }}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex min-w-0 items-center gap-2">
                                {isParent ? (
                                  <button
                                    aria-label={
                                      isExpanded
                                        ? `Recolher subitens de ${task.title}`
                                        : `Expandir subitens de ${task.title}`
                                    }
                                    className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                                    type="button"
                                    onClick={() => toggleTask(task)}
                                  >
                                    <motion.span
                                      animate={{ rotate: isExpanded ? 90 : 0 }}
                                      className="flex size-3.5 items-center justify-center"
                                      transition={chevronTransition}
                                    >
                                      <ChevronRight className="size-3.5" />
                                    </motion.span>
                                  </button>
                                ) : (
                                  <span
                                    aria-hidden
                                    className="size-4 shrink-0"
                                  />
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <button
                                        aria-label={`Alterar status de ${task.title}. Status atual: ${meta.label}`}
                                        className="flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-full outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 data-popup-open:bg-muted"
                                        title="Alterar status"
                                        type="button"
                                      />
                                    }
                                  >
                                    <StatusMarker status={status} />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="start"
                                    sideOffset={6}
                                    className="w-40 min-w-40 rounded-md border border-border/70 bg-popover p-1 shadow-[0_18px_48px_-24px_rgb(15_23_42/0.35)] ring-0 dark:shadow-[0_18px_52px_-24px_rgb(0_0_0/0.55)]"
                                  >
                                    {statusOptions.map((status) => {
                                      const option = statusMeta[status];
                                      const isSelected = status === row.status;

                                      return (
                                        <DropdownMenuItem
                                          key={status}
                                          className="h-7 gap-2 px-2 text-xs"
                                          onClick={() =>
                                            updateTaskStatus(task, status)
                                          }
                                        >
                                          <StatusMarker status={status} />
                                          <span className="flex-1 truncate">
                                            {option.label}
                                          </span>
                                          {isSelected && (
                                            <Check className="size-3.5 text-muted-foreground" />
                                          )}
                                        </DropdownMenuItem>
                                      );
                                    })}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <p
                                  className={cn(
                                    "truncate text-sm text-foreground",
                                    depth === 0
                                      ? "font-medium"
                                      : "font-normal text-muted-foreground",
                                  )}
                                  title={task.title}
                                >
                                  {task.title}
                                </p>
                                {depth === 0 && (
                                  <button
                                    aria-label={`Adicionar subitem em ${task.title}`}
                                    className="ml-auto flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground/70 transition hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                                    title="Adicionar subitem"
                                    type="button"
                                    onClick={() => addSubitem(task)}
                                  >
                                    <Plus className="size-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center px-3 py-2 text-xs tabular-nums text-muted-foreground">
                            {formatDayMonth(task.end)}
                          </div>
                        </div>

                        <div
                          className="relative z-0 grid items-center transition-colors group-hover/row:bg-foreground/[0.015]"
                          style={{ gridTemplateColumns: dayColumns }}
                        >
                          {placement && (
                            <div
                              data-gantt-bar-wrapper
                              className={cn("px-1", depth > 0 && "pl-3")}
                              style={{
                                gridColumn: `${placement.start} / span ${placement.span}`,
                              }}
                            >
                                <div
                                  className={cn(
                                    "relative w-full overflow-hidden rounded-md border shadow-none transition-colors group-hover/row:ring-1 group-hover/row:ring-ring/25",
                                    depth === 0 ? "h-7" : "h-6",
                                    meta.bar,
                                  )}
                              >
                                <div
                                  className={cn(
                                    "absolute inset-y-0 left-0",
                                    meta.fill,
                                  )}
                                  style={{ width: `${task.progress}%` }}
                                />
                                <button
                                  aria-label={`Ajustar início de ${task.title}`}
                                  className="absolute inset-y-0 left-0 z-10 flex w-2 cursor-ew-resize items-center justify-start rounded-l-md outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
                                  title="Ajustar início"
                                  type="button"
                                  onPointerDown={(event) =>
                                    startTaskResize(
                                      event,
                                      task,
                                      placement,
                                      "start",
                                    )
                                  }
                                  onMouseDown={(event) =>
                                    startTaskResizeWithMouse(
                                      event,
                                      task,
                                      placement,
                                      "start",
                                    )
                                  }
                                  onPointerMove={resizeTask}
                                  onPointerUp={finishTaskResize}
                                  onPointerCancel={finishTaskResize}
                                >
                                  <span className="ml-px h-3 w-px rounded-full bg-foreground/30 opacity-0 transition group-hover/row:opacity-100" />
                                </button>
                                <button
                                  aria-label={`Ajustar prazo de ${task.title}`}
                                  className="absolute inset-y-0 right-0 z-10 flex w-2 cursor-ew-resize items-center justify-end rounded-r-md outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50"
                                  title="Ajustar prazo"
                                  type="button"
                                  onPointerDown={(event) =>
                                    startTaskResize(
                                      event,
                                      task,
                                      placement,
                                      "end",
                                    )
                                  }
                                  onMouseDown={(event) =>
                                    startTaskResizeWithMouse(
                                      event,
                                      task,
                                      placement,
                                      "end",
                                    )
                                  }
                                  onPointerMove={resizeTask}
                                  onPointerUp={finishTaskResize}
                                  onPointerCancel={finishTaskResize}
                                >
                                  <span className="mr-px h-3 w-px rounded-full bg-foreground/30 opacity-0 transition group-hover/row:opacity-100" />
                                </button>
                                <div className="relative flex h-full items-center justify-between gap-2 px-2">
                                  <span
                                    className={cn(
                                      "truncate text-xs text-foreground",
                                      depth === 0
                                        ? "font-medium"
                                        : "font-normal",
                                    )}
                                    title={task.title}
                                  >
                                    {task.title}
                                  </span>
                                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                    {task.progress}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </div>
              <div
                aria-hidden
                className="grid min-h-0 flex-1"
                style={{
                  gridTemplateColumns: `${PANEL_WIDTH} minmax(0, 1fr)`,
                }}
              >
                <div
                  className={cn(stickyPanelClass, "grid")}
                  style={{ gridTemplateColumns: panelColumns }}
                >
                  <div />
                  <div />
                </div>
                <div />
              </div>

              <div
                className="sticky bottom-0 z-30 grid min-h-11 shrink-0 border-t bg-background"
                style={{
                  gridTemplateColumns: `${PANEL_WIDTH} minmax(0, 1fr)`,
                }}
              >
                <button
                  className={cn(
                    footerPanelClass,
                    "flex cursor-pointer items-center gap-1.5 px-4 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  )}
                  type="button"
                >
                  <Plus className="size-3.5" />
                  Adicionar frente
                </button>
                <div aria-hidden className="bg-background" />
              </div>

              {todayFraction !== null && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-[-5] grid"
                  style={{
                    gridTemplateColumns: `${PANEL_WIDTH} minmax(0, 1fr)`,
                  }}
                >
                  <div />
                  <div className="relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 w-px bg-primary/70"
                      style={{ left: `${todayFraction * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {contextMenu && (
                <div
                  className="fixed z-50 min-w-36 rounded-md border border-border/70 bg-popover p-1 text-popover-foreground shadow-[0_18px_48px_-24px_rgb(15_23_42/0.35)] ring-0 dark:shadow-[0_18px_52px_-24px_rgb(0_0_0/0.55)]"
                  role="menu"
                  style={{
                    left: contextMenu.x,
                    top: contextMenu.y,
                  }}
                  onClick={(event) => event.stopPropagation()}
                  onContextMenu={(event) => event.preventDefault()}
                >
                  <button
                    className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-xs text-destructive outline-none transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring/50"
                    role="menuitem"
                    type="button"
                    onClick={() => deleteTask(contextMenu.task)}
                  >
                    <Trash2 className="size-3.5" />
                    Excluir
                  </button>
                </div>
              )}
              <Dialog
                open={Boolean(selectedTask)}
                onOpenChange={(open) => {
                  if (!open) {
                    setSelectedTaskId(null);
                  }
                }}
              >
                <DialogContent className="gantt-detail-dialog max-h-[min(760px,calc(100svh-2rem))] max-w-2xl overflow-hidden p-0">
                  {selectedTask && (
                    <>
                      <DialogClose
                        render={
                          <Button
                            aria-label="Fechar detalhes"
                            className="absolute right-3 top-3 z-10"
                            size="icon-sm"
                            variant="ghost"
                          />
                        }
                      >
                        <X className="size-4" />
                      </DialogClose>
                      <DialogHeader className="border-b p-4">
                        <div className="flex items-start gap-3 pr-8">
                          <StatusMarker
                            className="mt-1.5 size-2.5"
                            status={getTaskStatus(selectedTask, taskStatuses)}
                          />
                          <div className="min-w-0">
                            <DialogTitle>{selectedTask.title}</DialogTitle>
                            <DialogDescription>
                              {selectedTask.actionPoint
                                ? `${selectedTask.actionPoint.dimensionName} · Prioridade ${selectedTask.actionPoint.priority}`
                                : "Detalhe local do cronograma"}
                            </DialogDescription>
                          </div>
                        </div>
                      </DialogHeader>

                      <div className="max-h-[calc(min(760px,100svh-2rem)-5.5rem)] space-y-6 overflow-y-auto px-4 pb-6">
                        <div className="grid grid-cols-2 gap-3 border-b py-4 text-sm">
                          <div>
                            <p className="text-[0.68rem] font-medium text-muted-foreground">
                              Responsável
                            </p>
                            <p className="mt-1 text-foreground">
                              {selectedTask.owner}
                            </p>
                          </div>
                          <div>
                            <p className="text-[0.68rem] font-medium text-muted-foreground">
                              Prazo
                            </p>
                            <p className="mt-1 tabular-nums text-foreground">
                              {formatDayMonth(selectedTask.end)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[0.68rem] font-medium text-muted-foreground">
                              Status
                            </p>
                            <p className="mt-1 text-foreground">
                              {
                                statusMeta[
                                  getTaskStatus(selectedTask, taskStatuses)
                                ].label
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-[0.68rem] font-medium text-muted-foreground">
                              Progresso
                            </p>
                            <p className="mt-1 tabular-nums text-foreground">
                              {selectedTask.progress}%
                            </p>
                          </div>
                        </div>

                        {selectedTask.actionPoint ? (
                          <>
                            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/25 p-3 text-sm">
                              <div>
                                <p className="text-[0.68rem] font-medium text-muted-foreground">
                                  Score
                                </p>
                                <p className="mt-1 tabular-nums text-foreground">
                                  {formatScore(selectedTask.actionPoint.score)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[0.68rem] font-medium text-muted-foreground">
                                  Gap
                                </p>
                                <p className="mt-1 tabular-nums text-foreground">
                                  {formatScoreOrNoBase(
                                    selectedTask.actionPoint.gap,
                                  )}
                                </p>
                              </div>
                            </div>

                            <DetailBlock
                              label="Problema"
                              value={selectedTask.actionPoint.problem}
                            />
                            <DetailBlock
                              label="O que fazer"
                              value={selectedTask.actionPoint.recommendedAction}
                            />
                            <DetailBlock
                              label="Envolvidos"
                              value={selectedTask.actionPoint.involved.join(
                                ", ",
                              )}
                            />
                            <DetailBlock
                              label="Impacto esperado"
                              value={selectedTask.actionPoint.expectedImpact}
                            />
                            <DetailBlock
                              label="Indicador de sucesso"
                              value={selectedTask.actionPoint.successIndicator}
                            />
                          </>
                        ) : (
                          <>
                            <DetailBlock
                              label="Bloqueio ou contexto"
                              value={selectedTask.blocker}
                            />
                            <DetailBlock
                              label="Período"
                              value={`${formatDayMonth(selectedTask.start)} até ${formatDayMonth(selectedTask.end)}`}
                            />
                          </>
                        )}
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
