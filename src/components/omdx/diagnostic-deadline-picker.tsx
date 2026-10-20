"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

const fullDate = new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" });
const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function DiagnosticDeadlinePicker({ value, onChange, disabled, invalid, describedBy }: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}) {
  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => parseDate(value || todayKey));
  const [focusedDay, setFocusedDay] = useState(value || todayKey);
  const calendar = useRef<HTMLDivElement>(null);
  const start = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  start.setDate(start.getDate() - start.getDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    return date;
  });

  function choose(date: Date) {
    onChange(dateKey(date));
    setOpen(false);
  }

  function moveMonth(offset: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1, 12);
    setMonth(next);
    setFocusedDay(dateKey(next));
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, date: Date) {
    const next = new Date(date);
    const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -date.getDay(), End: 6 - date.getDay() };
    if (event.key in offsets) next.setDate(next.getDate() + offsets[event.key]);
    else if (event.key === "PageUp" || event.key === "PageDown") {
      const day = next.getDate();
      next.setDate(1);
      next.setMonth(next.getMonth() + (event.key === "PageUp" ? -1 : 1));
      const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(day, last));
    } else return;
    event.preventDefault();
    const key = dateKey(next);
    setMonth(next);
    setFocusedDay(key);
    window.requestAnimationFrame(() => calendar.current?.querySelector<HTMLButtonElement>(`[data-date="${key}"]`)?.focus());
  }

  return (
    <Popover open={open} onOpenChange={(nextOpen) => {
      if (nextOpen) {
        setMonth(parseDate(value || todayKey));
        setFocusedDay(value || todayKey);
      }
      setOpen(nextOpen);
    }}>
      <PopoverPrimitive.Trigger
        id="diagnostic-deadline"
        disabled={disabled}
        aria-label={`Prazo de resposta${value ? `: ${fullDate.format(parseDate(value))}` : ""}`}
        aria-required="true"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        render={<Button type="button" variant="outline" className="w-full justify-between font-normal" />}
      >
        <span className={cn("tabular-nums", !value && "text-muted-foreground")}>{value ? new Intl.DateTimeFormat("pt-BR").format(parseDate(value)) : "Selecionar data"}</span>
        <CalendarDays aria-hidden="true" className="size-4 text-muted-foreground" />
      </PopoverPrimitive.Trigger>
      <PopoverContent side="bottom" align="start" className="w-72 border-[0.5px] border-border bg-muted text-foreground shadow-none ring-0" initialFocus={() => calendar.current?.querySelector<HTMLButtonElement>(`[data-date="${focusedDay}"]`) ?? false}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Mês anterior" onClick={() => moveMonth(-1)}><ChevronLeft className="size-4" /></Button>
          <span className="text-sm font-medium" aria-live="polite">{monthLabel.format(month)}</span>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Próximo mês" onClick={() => moveMonth(1)}><ChevronRight className="size-4" /></Button>
        </div>
        <div ref={calendar} role="grid" aria-label={monthLabel.format(month)}>
          <div role="row" className="grid grid-cols-7">
            {weekdays.map((day) => <span key={day} role="columnheader" className="py-2 text-center text-xs text-muted-foreground">{day}</span>)}
          </div>
          {Array.from({ length: 6 }, (_, week) => (
            <div key={week} role="row" className="grid grid-cols-7 gap-1 py-0.5">
              {days.slice(week * 7, week * 7 + 7).map((date) => {
                const key = dateKey(date);
                return (
                  <div key={key} role="gridcell" aria-selected={value === key}>
                    <button type="button" data-date={key} tabIndex={focusedDay === key ? 0 : -1} aria-label={fullDate.format(date)} aria-current={key === todayKey ? "date" : undefined} onFocus={() => setFocusedDay(key)} onKeyDown={(event) => navigate(event, date)} onClick={() => choose(date)} className={cn("flex size-8 items-center justify-center rounded-[5px] text-xs tabular-nums outline-none hover:bg-action-neutral-hover focus-visible:ring-2 focus-visible:ring-ring", date.getMonth() !== month.getMonth() && "text-muted-foreground", key === todayKey && "font-medium", value === key && "bg-foreground text-background hover:bg-foreground")}>
                      {date.getDate()}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" className="mt-3 w-full" onClick={() => choose(parseDate(todayKey))}>Hoje</Button>
      </PopoverContent>
    </Popover>
  );
}
