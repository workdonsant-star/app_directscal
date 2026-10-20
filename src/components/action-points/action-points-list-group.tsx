"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";

import { TableCell, TableRow } from "@/components/ui/table";
import type { AdherenceActionPoint, AdherenceCategory } from "@/lib/data/action-points-adherence-example";
import { countActionPoints, rollupHealth } from "@/lib/data/action-points-adherence-example";
import { cn } from "@/lib/utils";

import { CategoryIcon, categoryMeta, DistributionDots, EvidenceCell, HealthBadge, LastCheckInCell, LeaderCell } from "./adherence-ui";

const AnimatedRow = motion.create(TableRow);

export function ActionPointsListGroup({ category, items, expanded, onToggle, onSelect }: {
  category: AdherenceCategory;
  items: AdherenceActionPoint[];
  expanded: boolean;
  onToggle: () => void;
  onSelect: (actionPoint: AdherenceActionPoint) => void;
}) {
  const meta = categoryMeta[category.colorKey];
  const reducedMotion = useReducedMotion();
  const step = reducedMotion ? 0 : 0.06;
  const duration = reducedMotion ? 0 : 0.16;
  const contentVariants = (index: number) => ({
    hidden: { opacity: 0, y: reducedMotion ? 0 : -4, transition: { duration, delay: (items.length - index - 1) * step } },
    visible: { opacity: 1, y: 0, transition: { duration, delay: index * step } },
  });
  return (
    <>
      <TableRow>
        <TableCell className="relative !h-[53px] !py-0 !pl-0 align-top">
          <AnimatePresence initial={false}>
            {expanded && items.length > 0 && (
              <motion.span
                key="header-rail"
                aria-hidden="true"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration, delay: Math.max(0, items.length - 1) * step } }}
                className={cn("pointer-events-none absolute top-[28px] -bottom-px left-[13px] w-px", meta.solid)}
              />
            )}
          </AnimatePresence>
          <button type="button" aria-expanded={expanded} aria-label={`${expanded ? "Recolher" : "Expandir"} ${category.name}`} onClick={onToggle} className="relative flex min-h-10 items-start gap-2 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {category.colorKey === "comunicacao" ? <Image src="/action-points/communication.svg" width={26} height={26} alt="" aria-hidden="true" unoptimized className="mt-0.5 shrink-0" /> : <CategoryIcon category={category.colorKey} className="mt-0.5 size-[26px] rounded-full" />}
            <span className="flex flex-col">
              <span className="font-heading text-sm leading-5 font-medium">{category.name}</span>
              <span className="text-xs leading-4 font-normal text-muted-foreground tabular-nums">{category.version} · {items.length} action points</span>
            </span>
          </button>
        </TableCell>
        <TableCell><LeaderCell leader={category.leader} /></TableCell>
        <TableCell><HealthBadge health={rollupHealth(items)} /></TableCell>
        <TableCell><DistributionDots dist={countActionPoints(items)} /></TableCell>
        <TableCell />
      </TableRow>
      <AnimatePresence initial={false}>
      {expanded && items.map((ap, index) => {
        const last = index === items.length - 1;
        return (
          <AnimatedRow key={ap.id}
            initial="hidden" animate="visible" exit="hidden"
            variants={{ visible: {}, hidden: {} }}
            aria-hidden={!expanded}
            inert={!expanded}
          >
            <TableCell className="!h-auto !py-0 !pl-0 align-top">
              <motion.div
                variants={{
                  hidden: { height: 0, transition: { duration: reducedMotion ? 0 : 0.22, delay: (items.length - index - 1) * step, ease: [0.22, 1, 0.36, 1] } },
                  visible: { height: "auto", transition: { duration: reducedMotion ? 0 : 0.22, delay: index * step, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="overflow-hidden"
              >
                <div className="relative min-h-[53px]">
              <span aria-hidden="true" className={cn("pointer-events-none absolute top-0 left-[13px] h-5 w-9 rounded-bl-[6px] border-b border-l", meta.border)} />
              {!last && <span aria-hidden="true" className={cn("pointer-events-none absolute top-0 -bottom-px left-[13px] w-px", meta.solid)} />}
              <motion.span variants={contentVariants(index)}>
              {category.colorKey === "comunicacao" ? <Image src="/action-points/node.svg" width={6} height={6} alt="" aria-hidden="true" unoptimized className="pointer-events-none absolute top-[17px] left-[46px]" /> : <span aria-hidden="true" className={cn("absolute top-[17px] left-[46px] size-1.5 rounded-full", meta.solid)} />}
              </motion.span>
              <motion.div variants={contentVariants(index)}>
              <button type="button" onClick={() => onSelect(ap)} className="relative ml-[59px] flex min-h-10 flex-col rounded-sm pt-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="text-sm leading-5 font-medium hover:text-foreground">{ap.name}</span>
                <span className="text-xs leading-4 font-normal text-muted-foreground">{ap.frequency}</span>
              </button>
              </motion.div>
            </div></motion.div></TableCell>
            <TableCell className="!h-auto !py-0">
              <motion.div
                variants={{
                  hidden: { height: 0, transition: { duration: reducedMotion ? 0 : 0.22, delay: (items.length - index - 1) * step, ease: [0.22, 1, 0.36, 1] } },
                  visible: { height: "auto", transition: { duration: reducedMotion ? 0 : 0.22, delay: index * step, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="overflow-hidden"
              >
                <div className="relative flex min-h-[53px] flex-col justify-center"><motion.div variants={contentVariants(index)}><LeaderCell leader={category.leader} /></motion.div></div></motion.div></TableCell>
            <TableCell className="!h-auto !py-0">
              <motion.div
                variants={{
                  hidden: { height: 0, transition: { duration: reducedMotion ? 0 : 0.22, delay: (items.length - index - 1) * step, ease: [0.22, 1, 0.36, 1] } },
                  visible: { height: "auto", transition: { duration: reducedMotion ? 0 : 0.22, delay: index * step, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="overflow-hidden"
              >
                <div className="relative flex min-h-[53px] flex-col justify-center"><motion.div variants={contentVariants(index)}><HealthBadge health={ap.health} trend={ap.trend} /></motion.div></div></motion.div></TableCell>
            <TableCell className="!h-auto !py-0">
              <motion.div
                variants={{
                  hidden: { height: 0, transition: { duration: reducedMotion ? 0 : 0.22, delay: (items.length - index - 1) * step, ease: [0.22, 1, 0.36, 1] } },
                  visible: { height: "auto", transition: { duration: reducedMotion ? 0 : 0.22, delay: index * step, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="overflow-hidden"
              >
                <div className="relative flex min-h-[53px] flex-col justify-center"><motion.div variants={contentVariants(index)}><EvidenceCell ap={ap} /></motion.div></div></motion.div></TableCell>
            <TableCell className="!h-auto !py-0">
              <motion.div
                variants={{
                  hidden: { height: 0, transition: { duration: reducedMotion ? 0 : 0.22, delay: (items.length - index - 1) * step, ease: [0.22, 1, 0.36, 1] } },
                  visible: { height: "auto", transition: { duration: reducedMotion ? 0 : 0.22, delay: index * step, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="overflow-hidden"
              >
                <div className="relative flex min-h-[53px] flex-col justify-center"><motion.div variants={contentVariants(index)}><LastCheckInCell ap={ap} /></motion.div></div></motion.div></TableCell>
          </AnimatedRow>
        );
      })}
      </AnimatePresence>
      <TableRow aria-hidden="true">
        <TableCell colSpan={5} className="!h-6 !p-0" />
      </TableRow>
    </>
  );
}
