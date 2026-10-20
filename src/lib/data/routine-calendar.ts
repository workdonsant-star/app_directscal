import type { AdherenceRule } from "@/lib/contracts/asset-adherence";

type LocalDate = { year: number; month: number; day: number };
const dayMs = 86_400_000;
function localParts(at: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(at);
  const number = (name: string) => Number(parts.find(part => part.type === name)?.value);
  return { year: number("year"), month: number("month"), day: number("day"), hour: number("hour"), minute: number("minute"), second: number("second") };
}
function dateFromEpoch(at: number): LocalDate {
  const date = new Date(at); return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}
function epoch(date: LocalDate) { return Date.UTC(date.year, date.month - 1, date.day); }
function key(date: LocalDate) { return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`; }
export function localRoutineInstant(date: LocalDate, hour: number, timeZone = "America/Sao_Paulo") {
  const target = epoch(date) + hour * 3_600_000;
  let instant = target;
  for (let step = 0; step < 4; step++) {
    const parts = localParts(new Date(instant), timeZone);
    const represented = epoch(parts) + parts.hour * 3_600_000 + parts.minute * 60_000 + parts.second * 1000;
    const correction = target - represented;
    if (!correction) return new Date(instant);
    instant += correction;
  }
  throw new Error("Horário local indisponível para este ciclo.");
}
/** Uma oportunidade no período corrente; nunca fabrica eventos ou ciclos anteriores ao acordo. */
export function currentRoutineOpportunity(rule: Pick<AdherenceRule, "schedule" | "createdAt">, at = new Date()) {
  if (!Number.isFinite(at.getTime()) || !Number.isFinite(Date.parse(rule.createdAt))) throw new Error("Instante inválido.");
  if (rule.schedule.kind === "por_evento") return null;
  const local = localParts(at, rule.schedule.timeZone);
  const today = epoch(local); let first = today; let next = today + dayMs;
  const cadence = rule.schedule.cadence;
  if (cadence === "diaria") {
    const day = new Date(today).getUTCDay();
    if (day === 0 || day === 6) return null;
  } else if (cadence === "semanal" || cadence === "quinzenal") {
    const width = cadence === "semanal" ? 7 : 14;
    const anchor = Date.UTC(2020, 0, 6);
    first = anchor + Math.floor((today - anchor) / (width * dayMs)) * width * dayMs;
    next = first + width * dayMs;
  } else {
    const width = ({ mensal: 1, trimestral: 3, semestral: 6, anual: 12 } as const)[cadence];
    const month = Math.floor((local.month - 1) / width) * width;
    first = Date.UTC(local.year, month, 1); next = Date.UTC(local.year, month + width, 1);
  }
  const due = localRoutineInstant(dateFromEpoch(next - dayMs), 17, rule.schedule.timeZone);
  const start = localRoutineInstant(dateFromEpoch(first), 9, rule.schedule.timeZone);
  const opensAt = new Date(Math.max(start.getTime(), Date.parse(rule.createdAt)));
  if (opensAt > due || opensAt > at) return null;
  return { opportunityKey: `calendario:${cadence}:${key(dateFromEpoch(first))}`, opensAt: opensAt.toISOString(), dueAt: due.toISOString() };
}
