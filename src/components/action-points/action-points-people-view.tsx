"use client";

import { Fragment, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion, type Variants } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type {
  AdherenceActionPoint,
  AdherenceBoard,
  AdherenceDistribution,
  AdherenceHealth,
} from "@/lib/data/action-points-adherence-example";
import {
  ADHERENCE_TARGET,
  adherenceHealthLabels,
  adherenceLeaderPhotos,
  averageAdherence,
  checkInAgeHours,
  countActionPoints,
  rollupHealth,
} from "@/lib/data/action-points-adherence-example";
import { cn } from "@/lib/utils";
import { AdherenceSheet, type AdherenceSelection } from "./adherence-sheet";
import { DistributionDots, healthMeta } from "./adherence-ui";

const AnimatedTableBody = motion.create(TableBody);

// Mesma faixa usada em Maturidade: meta para consistente, metade para atenção.
function healthFromAverage(average: number): AdherenceHealth {
  if (average >= ADHERENCE_TARGET) return "consistente";
  if (average >= 50) return "atencao";
  return "risco";
}

function latestCheckIn(points: AdherenceActionPoint[]) {
  const real = points.filter(point => point.lastCheckInAt).sort((a, b) => Date.parse(b.lastCheckInAt!) - Date.parse(a.lastCheckInAt!))[0];
  if (real) return real.lastCheckIn;
  let latest: { label: string; age: number } | null = null;
  for (const point of points) {
    const age = checkInAgeHours(point.lastCheckIn);
    if (age !== null && (latest === null || age < latest.age)) {
      latest = { label: point.lastCheckIn, age };
    }
  }
  return latest?.label ?? "Sem relato";
}

// Barra de aderência com a meta marcada; o número carrega o valor.
function AdherenceBar({ value, health, showTarget = true }: { value: number | null; health: AdherenceHealth; showTarget?: boolean }) {
  if (value === null) {
    return <span className="text-sm text-muted-foreground">Sem medição</span>;
  }
  return (
    <span className="flex items-center gap-3">
      <span className="relative h-1.5 flex-1 rounded-full bg-muted" aria-hidden="true">
        <span
          className={cn("absolute inset-y-0 left-0 rounded-full", healthMeta[health].bar)}
          style={{ width: `${value}%` }}
        />
        {showTarget ? <span
          className="absolute -inset-y-1 border-l border-dashed border-muted-foreground/60"
          style={{ left: `${ADHERENCE_TARGET}%` }}
        /> : null}
      </span>
      <span className="w-10 text-right text-sm font-medium tabular-nums">{value}%</span>
    </span>
  );
}

// Ciclos do período: um quadrado por ocorrência esperada, preenchido quando cumprida.
function CycleCell({ ap }: { ap: AdherenceActionPoint }) {
  if (ap.actualCounts) return <span className="text-sm text-muted-foreground tabular-nums">{ap.actualCounts.eligible ? `${ap.actualCounts.reported} de ${ap.actualCounts.eligible} relatadas · ${ap.actualCounts.validated} validadas` : "Sem oportunidades vencidas"}</span>;
  if (ap.health === "aguardando") return <span className="text-sm text-muted-foreground">Aguardando resposta</span>;
  if (ap.health === "parado") return <span className="text-sm text-muted-foreground">Sem responsável</span>;
  if (ap.mode !== "periodica" || !ap.cycleTotal) {
    return <span className="text-sm text-muted-foreground">{ap.eventLabel ?? "Por ocorrência"}</span>;
  }
  const done = Math.min(ap.cycleDone ?? 0, ap.cycleTotal);
  return (
    <span className="flex items-center gap-3">
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: ap.cycleTotal }, (_, index) => (
          <span
            key={index}
            className={cn(
              "size-2.5 rounded-[2px]",
              index < done ? healthMeta[ap.health].bar : "border border-border",
            )}
          />
        ))}
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">{done} de {ap.cycleTotal}</span>
    </span>
  );
}

function HealthLabel({ health }: { health: AdherenceHealth }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", healthMeta[health].text)}>
      <span className={cn("size-2 shrink-0 rounded-full", healthMeta[health].dot)} aria-hidden="true" />
      {adherenceHealthLabels[health]}
    </span>
  );
}

function CascadingCell({ children, first = false, last, frame, content }: {
  children: ReactNode;
  first?: boolean;
  last: boolean;
  frame: Variants;
  content: Variants;
}) {
  return (
    <TableCell className="!h-auto !border-b-0 !p-0 !whitespace-normal">
      <motion.div variants={frame} className="overflow-hidden">
        <motion.div variants={content} className={cn(
          "flex min-h-12 items-center py-2.5 pr-4",
          first ? "pl-[88px]" : "pl-4",
          !last && "border-b-[0.5px] border-border",
        )}>
          {children}
        </motion.div>
      </motion.div>
    </TableCell>
  );
}

function CascadingActionPoints({ id, items, onSelect, reducedMotion }: {
  id: string;
  items: AdherenceSelection[];
  onSelect: (selection: AdherenceSelection) => void;
  reducedMotion: boolean;
}) {
  const isPresent = useIsPresent();
  const step = reducedMotion ? 0 : 0.04;
  const duration = reducedMotion ? 0 : 0.18;
  const easing = [0.22, 1, 0.36, 1] as const;
  return (
    <AnimatedTableBody id={id} data-person-actions="" initial="closed" animate="open" exit="closed" aria-hidden={!isPresent} inert={!isPresent}>
      {items.map((selection, index) => {
        const { category, actionPoint: ap } = selection;
        const last = index === items.length - 1;
        const enter = index * step;
        const leave = (items.length - index - 1) * step;
        const frame: Variants = {
          closed: { height: 0, transition: { duration, delay: leave, ease: easing } },
          open: { height: "auto", transition: { duration, delay: enter, ease: easing } },
        };
        const content: Variants = {
          closed: { opacity: 0, y: reducedMotion ? 0 : -4, transition: { duration, delay: leave, ease: easing } },
          open: { opacity: 1, y: 0, transition: { duration, delay: enter, ease: easing } },
        };
        return (
          <TableRow key={`${category.id}-${ap.id}`}>
            <CascadingCell first last={last} frame={frame} content={content}>
              <button type="button" onClick={() => onSelect(selection)} className="w-fit rounded-sm text-left text-sm leading-5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{ap.name}</button>
            </CascadingCell>
            <CascadingCell last={last} frame={frame} content={content}><CycleCell ap={ap} /></CascadingCell>
            <CascadingCell last={last} frame={frame} content={content}><HealthLabel health={ap.health} /></CascadingCell>
            <CascadingCell last={last} frame={frame} content={content}>
              <span className="text-sm text-muted-foreground">{checkInAgeHours(ap.lastCheckIn) === null ? "—" : ap.lastCheckIn}</span>
            </CascadingCell>
          </TableRow>
        );
      })}
      <TableRow aria-hidden="true"><TableCell colSpan={4} className="!h-auto !border-b-0 !p-0">
        <motion.div variants={{ closed: { height: 0 }, open: { height: 16 } }} transition={{ duration, ease: easing }} className="overflow-hidden">
          <div className="h-4 border-b-[0.5px] border-border" />
        </motion.div>
      </TableCell></TableRow>
    </AnimatedTableBody>
  );
}

const distributionOrder: Array<{ key: keyof AdherenceDistribution; health: AdherenceHealth }> = [
  { key: "consistente", health: "consistente" },
  { key: "atencao", health: "atencao" },
  { key: "risco", health: "risco" },
  { key: "aguardando", health: "aguardando" },
  { key: "parado", health: "parado" },
];

function AdherenceSummary({ average, dist, total, measured = true, operational = false }: {
  operational?: boolean;
  measured?: boolean;
  average: number | null;
  dist: AdherenceDistribution;
  total: number;
}) {
  return (
    <section aria-label={operational ? "Execução relatada" : "Aderência geral"} className="grid gap-6 rounded-xl bg-card p-5 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)] sm:items-center">
      <div>
        <p className="font-label text-ui-label text-muted-foreground">{operational ? "Execução relatada" : "Aderência geral"}</p>
        <p className="mt-2 text-ui-kpi tabular-nums">{average === null ? "—" : `${average}%`}</p>
        <p className="mt-2 text-xs text-muted-foreground">{operational ? average === null ? "Sem oportunidades vencidas" : "Oportunidades vencidas nos últimos 30 dias" : measured ? `Meta de ${ADHERENCE_TARGET}%` : "Sem medição recorrente"}</p>
      </div>
      <div>
        <div className="flex h-2 gap-0.5" aria-hidden="true">
          {distributionOrder.map(({ key, health }) => dist[key] > 0 ? (
            <span key={key} className={cn("rounded-[2px]", healthMeta[health].bar)} style={{ width: `${(dist[key] / total) * 100}%` }} />
          ) : null)}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          {distributionOrder.map(({ key, health }) => (
            <li key={key} className="inline-flex items-center gap-2">
              <span className={cn("size-2 rounded-full", healthMeta[health].dot)} aria-hidden="true" />
              {health === "parado" ? "Sem responsável" : adherenceHealthLabels[health]}
              <span className="font-medium text-foreground tabular-nums">{dist[key]}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ActionPointsPeopleView({ board }: { board: AdherenceBoard }) {
  const reducedMotion = Boolean(useReducedMotion());
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<AdherenceSelection | null>(null);

  const allPoints = board.categories.flatMap(c => c.actionPoints);
  const totalDist = countActionPoints(allPoints);
  const groups = Array.from(new Set(board.categories.map(c => c.leader?.id ?? c.leader?.name ?? "Sem responsável")))
    .map(name => {
      const categories = board.categories.filter(c => (c.leader?.id ?? c.leader?.name ?? "Sem responsável") === name);
      const points = categories.flatMap(c => c.actionPoints);
      const average = averageAdherence(points);
      const health: AdherenceHealth = board.source ? rollupHealth(points) : average === null ? (categories[0].leader ? "aguardando" : "parado") : healthFromAverage(average);
      return { key: name, name: categories[0].leader?.name ?? "Sem responsável", categories, points, average, health, dist: countActionPoints(points), leader: categories[0].leader, lastCheckIn: latestCheckIn(points) };
    })
    // Quem precisa de conversa primeiro; sem medida e sem responsável ao fim.
    .sort((a, b) => (a.average ?? Infinity) - (b.average ?? Infinity));

  const lowest = groups.find(group => group.leader && group.dist.risco > 0);
  const headline = `${totalDist.consistente} de ${allPoints.length} action points em dia.${lowest ? ` ${lowest.name} concentra os itens em risco.` : ""}`;

  function toggle(name: string) {
    setOpened(current => { const next = new Set(current); if (!next.delete(name)) next.add(name); return next; });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-ui-page">Action points</h1>
        <p className="mt-1 text-sm text-muted-foreground">{board.source ? `${allPoints.length} ${allPoints.length === 1 ? "action point publicado" : "action points publicados"} · ${board.source.name}` : headline}</p>
      </div>

      <AdherenceSummary average={averageAdherence(allPoints)} dist={totalDist} total={allPoints.length} measured={!board.source} operational={Boolean(board.source)} />

      <Table variant="operational" aria-label="Aderência por liderança" className="table-fixed [&_tbody_tr:has([aria-expanded])]:bg-transparent">
        <colgroup><col className="w-[40%]" /><col className="w-[26%]" /><col className="w-[18%]" /><col className="w-[16%]" /></colgroup>
        <TableHeader><TableRow><TableHead>Liderança</TableHead><TableHead>{board.source ? "Execução relatada" : "Aderência"}</TableHead><TableHead>Situação</TableHead><TableHead>Último relato</TableHead></TableRow></TableHeader>
        {groups.map((group, index) => {
          const expanded = opened.has(group.key);
          return <Fragment key={group.key}>
            <TableBody className="[&:has(+tbody[data-person-actions])>tr>td]:!border-b-0">
              <TableRow className={cn(expanded ? "[&>td]:!border-b-0" : "[&>td]:!border-b-[0.5px]")}>
                <TableCell>
                  <button type="button" aria-expanded={expanded} aria-controls={`person-${index}`} onClick={() => toggle(group.key)} className="flex min-w-0 items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-[180ms]", expanded && "rotate-90")} aria-hidden="true" />
                    <Avatar className="size-8 shrink-0"><AvatarImage src={group.leader?.avatarUrl ?? (board.source ? undefined : adherenceLeaderPhotos[group.name])} alt="" /><AvatarFallback>{group.leader ? group.name.split(" ").map(n => n[0]).join("") : "?"}</AvatarFallback></Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{group.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{group.leader?.sector ?? "Atribuição pendente"} · {group.points.length} {group.points.length === 1 ? "action point" : "action points"}</span>
                    </span>
                  </button>
                </TableCell>
                <TableCell><AdherenceBar value={group.average} health={group.health} showTarget={!board.source} /></TableCell>
                <TableCell><DistributionDots dist={group.dist} /></TableCell>
                <TableCell><span className="text-sm text-muted-foreground">{group.lastCheckIn}</span></TableCell>
              </TableRow>
            </TableBody>
            <AnimatePresence initial={false}>
              {expanded && <CascadingActionPoints
                key={group.key}
                id={`person-${index}`}
                items={group.categories.flatMap(category => category.actionPoints.map(actionPoint => ({ category, actionPoint })))}
                onSelect={setSelection}
                reducedMotion={reducedMotion}
              />}
            </AnimatePresence>
          </Fragment>;
        })}
      </Table>

      <p className="max-w-[90ch] text-xs leading-5 text-muted-foreground">{board.source ? "Execução relatada soma as oportunidades registradas com prazo vencido nos últimos 30 dias. Exceções aprovadas ficam fora da base; solicitações ainda não revisadas permanecem. São considerados somente os registros disponíveis ao seu acesso. Ausência de resposta não comprova falha. Validação de evidência, leitura e progresso de implantação são acompanhamentos distintos." : <>Aderência é a média dos ciclos cumpridos no período, com o mesmo peso por action point. Consistente a partir de {ADHERENCE_TARGET}%, atenção de 50% a {ADHERENCE_TARGET - 1}%, em risco abaixo de 50%. Itens por ocorrência, sem responsável ou aguardando resposta ficam fora da média. A aderência reflete o relato do líder.</>}</p>
      <AdherenceSheet selection={selection} onClose={() => setSelection(null)} />
    </div>
  );
}
