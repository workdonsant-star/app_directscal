"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { routineEventInputSchema, type RoutineContactPolicy } from "@/lib/contracts/routine-contacts";
import type { RoutineRevision } from "@/lib/contracts/admin-adherence";
function localValue(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const value = (name: string) => parts.find(part => part.type === name)?.value;
  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}:${value("second")}`;
}
export function RoutineEventForm({ companyId, rule, policy, onSaved, onPending }: { companyId: string; rule: RoutineRevision; policy: RoutineContactPolicy; onSaved: () => void; onPending: (pending: boolean) => void }) {
  const [attempt] = useState(() => crypto.randomUUID());
  const [source, setSource] = useState(""); const [reference, setReference] = useState(""); const [description, setDescription] = useState("");
  const [happened, setHappened] = useState(() => localValue(new Date(), policy.timeZone));
  const [due, setDue] = useState(() => localValue(new Date(Date.now() + 86_400_000), policy.timeZone));
  const [pending, setPending] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(null);
    const parsed = routineEventInputSchema.safeParse({ id: attempt, ruleId: rule.id, expectedPolicyRevision: policy.revision, sourceKey: source, referenceUrl: reference, description, happenedLocal: happened, dueLocal: due });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Revise a ocorrência."); return; }
    setPending(true); onPending(true);
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/routine-events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const body = await response.json(); if (!response.ok) throw new Error(body.message ?? "Não foi possível registrar a ocorrência.");
      onSaved();
    } catch (error) { setError(error instanceof Error ? error.message : "Não foi possível registrar. Seus campos foram mantidos."); }
    finally { setPending(false); onPending(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    <fieldset disabled={pending} className="space-y-4">
      <p className="text-sm text-muted-foreground">Registre somente uma ocorrência real de {rule.schedule.kind === "por_evento" ? rule.schedule.eventKey : "evento"}. O identificador impede repetir a mesma oportunidade.</p>
      <div className="space-y-2"><label htmlFor="routine-event-source" className="text-sm font-medium">Identificador da ocorrência</label><Input id="routine-event-source" value={source} onChange={event => setSource(event.target.value)} placeholder="Ex.: entrega-2026-014" maxLength={160} required /></div>
      <div className="space-y-2"><label htmlFor="routine-event-reference" className="text-sm font-medium">Referência que confirma a ocorrência</label><Input id="routine-event-reference" type="url" value={reference} onChange={event => setReference(event.target.value)} placeholder="https://" maxLength={2000} required /></div>
      <div className="space-y-2"><label htmlFor="routine-event-description" className="text-sm font-medium">O que aconteceu</label><textarea id="routine-event-description" value={description} onChange={event => setDescription(event.target.value)} required maxLength={2000} rows={3} className="w-full resize-y rounded-md border border-transparent bg-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label htmlFor="routine-event-happened" className="text-sm font-medium">Quando aconteceu</label><Input id="routine-event-happened" type="datetime-local" step={1} value={happened} onChange={event => setHappened(event.target.value)} required /></div><div className="space-y-2"><label htmlFor="routine-event-due" className="text-sm font-medium">Prazo da rotina</label><Input id="routine-event-due" type="datetime-local" step={1} value={due} onChange={event => setDue(event.target.value)} required /></div></div>
      <p className="text-xs text-muted-foreground">Horários no fuso {policy.timeZone}. O contato respeitará a janela e os limites autorizados.</p>
    </fieldset>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex justify-end"><Button type="submit" disabled={pending}>{pending ? "Registrando…" : "Registrar ocorrência"}</Button></div>
  </form>;
}
