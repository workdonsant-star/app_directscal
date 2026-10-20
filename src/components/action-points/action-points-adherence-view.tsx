"use client";

import { useState } from "react";
import { Info } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  countActionPoints,
  flattenActionPoints,
  type AdherenceActionPoint,
  type AdherenceBoard,
} from "@/lib/data/action-points-adherence-example";
import { OverviewExecutiveCards, type ExecutiveCardMetric } from "@/components/omdx/overview-executive-cards";

import { AdherenceSheet, type AdherenceSelection } from "./adherence-sheet";
import { healthMeta } from "./adherence-ui";
import { ActionPointsListGroup } from "./action-points-list-group";

type Filter = "todos" | "atencao" | "aguardando";

const filters: { value: Filter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "atencao", label: "Precisam de atenção" },
  { value: "aguardando", label: "Aguardando resposta" },
];

function isVisible(ap: AdherenceActionPoint, filter: Filter) {
  if (filter === "atencao") {
    return (
      ap.health === "atencao" ||
      ap.health === "risco" ||
      ap.health === "parado"
    );
  }
  if (filter === "aguardando") return ap.health === "aguardando";
  return true;
}

export function ActionPointsAdherenceView({ board }: { board: AdherenceBoard }) {
  const [filter, setFilter] = useState<Filter>("todos");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<AdherenceSelection | null>(null);

  const allActionPoints = flattenActionPoints(board);
  const total = countActionPoints(allActionPoints);

  function toggle(key: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  const metrics: ExecutiveCardMetric[] = [
    { title: "Em dia", titleDotClassName: healthMeta.consistente.dot, value: String(total.consistente), classification: "Consistente", description: "Action points com aderência consistente." },
    { title: "Em atenção", titleDotClassName: healthMeta.atencao.dot, value: String(total.atencao), classification: "Atenção", description: "Action points que precisam de atenção." },
    { title: "Em risco", titleDotClassName: healthMeta.risco.dot, value: String(total.risco), classification: "Crítico", description: "Action points com aderência em risco." },
    { title: "Aguardando resposta", titleDotClassName: "bg-muted-foreground", value: String(total.aguardando), classification: "Sem dados", description: "Action points aguardando relato do responsável." },
  ];

  const filterCounts: Record<Filter, number> = {
    todos: allActionPoints.length,
    atencao: total.atencao + total.risco,
    aguardando: total.aguardando,
  };

  return (
    <div className="flex flex-col gap-6">
      <OverviewExecutiveCards metrics={metrics} presentation="overview" />

      <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <TabsList variant="selector">
            {filters.map(({ value, label }) => (
              <TabsTrigger key={value} value={value}>
                {label}
                <span className="font-normal text-muted-foreground tabular-nums">
                  {filterCounts[value]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <Table
          variant="operational"
          aria-label="Aderência dos action points"
          className="[&_tbody_td]:border-b-0 [&_tbody_td]:h-[53px] [&_tbody_td]:py-0 [&_tbody_tr:has([aria-expanded])]:bg-transparent"
        >
          <TableHeader>
            <TableRow>
              <TableHead className="w-[38%]">Categoria · action point</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Aderência</TableHead>
              <TableHead>Ciclo / evidência</TableHead>
              <TableHead>Último check-in</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow aria-hidden="true">
              <TableCell colSpan={5} className="!h-4 !p-0" />
            </TableRow>
            {board.categories.map((category) => {
              const leaves = category.actionPoints.filter((ap) =>
                isVisible(ap, filter),
              );
              if (leaves.length === 0) return null;

              const expanded = !collapsed.has(category.id);
              return (
                <ActionPointsListGroup
                  key={category.id}
                  category={category}
                  items={leaves}
                  expanded={expanded}
                  onToggle={() => toggle(category.id)}
                  onSelect={(actionPoint) => setSelection({ category, actionPoint })}
                />
              );
            })}
          </TableBody>
        </Table>
      </Tabs>

      <p className="flex max-w-[80ch] items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Demonstração de interface com dados fictícios. A aderência mostrada é
        relato do líder ao agente, não verificação automática; “aguardando
        resposta” e “sem responsável” aparecem como estados próprios, nunca como
        zero.
      </p>

      <AdherenceSheet selection={selection} onClose={() => setSelection(null)} />
    </div>
  );
}
