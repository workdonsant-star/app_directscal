type Schedule = { frequency: "diaria" | "semanal" | "quinzenal" | "mensal" | null; weekdays: number[] | null; send_time: string | null; schedule_starts_on: string | null; deadline: string | null };

const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export function dueManualActionPointSlot(point: Schedule, now: Date): string | null {
  if (!point.frequency || !point.weekdays?.length || !point.send_time || !point.schedule_starts_on) return null;
  const parts = Object.fromEntries(formatter.formatToParts(now).map(part => [part.type, part.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  if (date < point.schedule_starts_on || (point.deadline && date > point.deadline)) return null;
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (!point.weekdays.includes(weekday)) return null;
  const [hour, minute] = point.send_time.slice(0, 5).split(":").map(Number);
  const elapsed = Number(parts.hour) * 60 + Number(parts.minute) - hour * 60 - minute;
  if (elapsed < 0 || elapsed >= 10) return null;
  if (point.frequency === "mensal" && Number(parts.day) > 7) return null;
  if (point.frequency === "quinzenal") {
    const start = new Date(`${point.schedule_starts_on}T12:00:00Z`);
    const current = new Date(`${date}T12:00:00Z`);
    const startMonday = start.getTime() - ((start.getUTCDay() + 6) % 7) * 86_400_000;
    const currentMonday = current.getTime() - ((current.getUTCDay() + 6) % 7) * 86_400_000;
    if (Math.round((currentMonday - startMonday) / 604_800_000) % 2 !== 0) return null;
  }
  return `${date}T${point.send_time.slice(0, 5)}:America/Sao_Paulo`;
}
