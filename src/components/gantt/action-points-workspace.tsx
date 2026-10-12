"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  ActionPointAssignment,
  ActionPointEvent,
  ActionPointSlackStatus,
  GanttTask,
} from "@/lib/contracts";
import {
  flattenActionPoints,
  formatLastInteraction,
  formatShortDate,
  groupActionPoints,
  isActiveStage,
  type ActionPointGroup,
  type ActionPointGroupBy,
  type ActionPointRow,
} from "@/lib/data/action-points-list";
import {
  ActionPointStageBadge,
  AssigneeAvatar,
  AssigneeCell,
  ProgressBar,
} from "./action-point-badges";
import { ActionPointSheet } from "./action-point-sheet";

type TabValue = "andamento" | "planejados" | "concluidos" | "todos";

const tabs: { value: TabValue; label: string }[] = [
  { value: "andamento", label: "Em andamento" },
  { value: "planejados", label: "Planejados" },
  { value: "concluidos", label: "Concluídos" },
  { value: "todos", label: "Todos" },
];

const emptyMessages: Record<TabValue, string> = {
  andamento: "Nenhum action point em andamento.",
  planejados: "Nenhum action point planejado.",
  concluidos: "Nenhum action point concluído.",
  todos: "Nenhum action point.",
};

const groupOptions: { value: ActionPointGroupBy; label: string }[] = [
  { value: "dimensao", label: "Dimensão" },
  { value: "responsavel", label: "Responsável" },
  { value: "prazo", label: "Prazo" },
];

function matchesTab(row: ActionPointRow, tab: TabValue) {
  if (tab === "andamento") return isActiveStage(row.stage);
  if (tab === "planejados") {
    return row.stage === "sem_responsavel" || row.stage === "atribuido";
  }
  if (tab === "concluidos") return row.stage === "concluido";
  return true;
}

function DueDate({ row }: { row: ActionPointRow }) {
  return (
    <span className="inline-flex flex-col">
      <time dateTime={row.end}>{formatShortDate(row.end)}</time>
      {row.overdue && (
        <span className="text-xs text-chart-negative">Atrasado</span>
      )}
    </span>
  );
}

function GroupRow({
  group,
  expanded,
  today,
  onToggle,
}: {
  group: ActionPointGroup;
  expanded: boolean;
  today: string;
  onToggle: () => void;
}) {
  const { summary } = group;
  const count = `${summary.total} ${summary.total === 1 ? "action point" : "action points"}`;

  return (
    <TableRow>
      <TableCell>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={onToggle}
          className="flex cursor-pointer items-center gap-3 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expanded ? (
            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          ) : (
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          )}
          {group.assignee && <AssigneeAvatar assignee={group.assignee} />}
          <span className="flex flex-col">
            <span className="font-semibold">{group.label}</span>
            <span className="text-xs font-normal text-muted-foreground tabular-nums">
              {group.hint ? `${group.hint} · ${count}` : count}
            </span>
          </span>
        </button>
      </TableCell>
      <TableCell />
      <TableCell className="text-muted-foreground">
        <ProgressBar value={summary.progress} />
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        <time dateTime={summary.nextEnd}>{formatShortDate(summary.nextEnd)}</time>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        {summary.active} em andamento
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatLastInteraction(summary.lastInteractionAt, today)}
      </TableCell>
    </TableRow>
  );
}

function ChildRow({
  row,
  today,
  onOpen,
}: {
  row: ActionPointRow;
  today: string;
  onOpen: (id: string) => void;
}) {
  return (
    <TableRow>
      <TableCell className="relative pl-12!">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-6 w-px bg-border"
        />
        <button
          type="button"
          onClick={() => onOpen(row.id)}
          className="flex cursor-pointer flex-col gap-0.5 rounded-sm text-left outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="line-clamp-2 font-medium">{row.title}</span>
          <span className="line-clamp-1 text-xs font-normal text-muted-foreground">
            {row.details.recommendedAction}
          </span>
        </button>
      </TableCell>
      <TableCell>
        <AssigneeCell assignee={row.assignee} />
      </TableCell>
      <TableCell>
        <ProgressBar value={row.progress} />
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        <DueDate row={row} />
      </TableCell>
      <TableCell>
        <ActionPointStageBadge stage={row.stage} />
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatLastInteraction(row.lastInteractionAt, today)}
      </TableCell>
    </TableRow>
  );
}

function ActionPointTree({
  rows,
  groupBy,
  today,
  onOpen,
  emptyMessage,
}: {
  rows: ActionPointRow[];
  groupBy: ActionPointGroupBy;
  today: string;
  onOpen: (id: string) => void;
  emptyMessage: string;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const groups = groupActionPoints(rows, groupBy);

  function toggle(key: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  return (
    <Table variant="operational" aria-label="Action points">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[34%]">Nome</TableHead>
          <TableHead>Responsável</TableHead>
          <TableHead>Progresso</TableHead>
          <TableHead>Prazo</TableHead>
          <TableHead>Etapa</TableHead>
          <TableHead>Última interação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((group) => {
          const key = `${groupBy}:${group.key}`;
          const expanded = !collapsed.has(key);

          return (
            <Fragment key={group.key}>
              <GroupRow
                group={group}
                expanded={expanded}
                today={today}
                onToggle={() => toggle(key)}
              />
              {expanded &&
                group.rows.map((row) => (
                  <ChildRow key={row.id} row={row} today={today} onOpen={onOpen} />
                ))}
            </Fragment>
          );
        })}
        {groups.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={6}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function ActionPointsWorkspace({
  tasks,
  diagnosticId,
  assignments,
  events,
  today,
  sourceLabel,
  canEdit,
  slackStatus,
}: {
  tasks: GanttTask[];
  diagnosticId: string | null;
  assignments: ActionPointAssignment[];
  events: ActionPointEvent[];
  today: string;
  sourceLabel?: string;
  canEdit: boolean;
  slackStatus: ActionPointSlackStatus;
}) {
  const [tab, setTab] = useState<TabValue>("andamento");
  const [groupBy, setGroupBy] = useState<ActionPointGroupBy>("dimensao");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rows = flattenActionPoints(tasks, assignments, events, today);
  const selected = rows.find((row) => row.id === selectedId) ?? null;

  if (rows.length === 0 || !diagnosticId) {
    return (
      <div className="flex flex-1 flex-col items-start gap-1">
        <h2 className="text-base font-semibold">
          Nenhum action point disponível
        </h2>
        <p className="max-w-[60ch] text-sm text-muted-foreground">
          Eles aparecem aqui quando a Directscal publica a entrega do
          diagnóstico com as ações selecionadas para a empresa.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-[70ch] text-sm text-muted-foreground">
        Ações selecionadas pela Directscal a partir do diagnóstico. Cada uma
        tem uma pessoa responsável, uma etapa e um prazo.
        {sourceLabel ? ` ${sourceLabel}.` : ""}
      </p>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as TabValue)}
        className="gap-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList variant="selector">
            {tabs.map(({ value, label }) => (
              <TabsTrigger key={value} value={value}>
                {label}
                <span className="font-normal text-muted-foreground tabular-nums">
                  {rows.filter((row) => matchesTab(row, value)).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-center gap-2">
            <span
              id="action-points-group-label"
              className="text-sm text-muted-foreground"
            >
              Agrupar por
            </span>
            <Select
              value={groupBy}
              items={groupOptions}
              onValueChange={(value) => {
                if (value) setGroupBy(value as ActionPointGroupBy);
              }}
            >
              <SelectTrigger
                aria-labelledby="action-points-group-label"
                className="w-40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groupOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {tabs.map(({ value }) => (
          <TabsContent key={value} value={value}>
            <ActionPointTree
              rows={rows.filter((row) => matchesTab(row, value))}
              groupBy={groupBy}
              today={today}
              onOpen={setSelectedId}
              emptyMessage={emptyMessages[value]}
            />
          </TabsContent>
        ))}
      </Tabs>

      {selected && (
        <ActionPointSheet
          row={selected}
          diagnosticId={diagnosticId}
          events={events}
          today={today}
          canEdit={canEdit}
          slackStatus={slackStatus}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
