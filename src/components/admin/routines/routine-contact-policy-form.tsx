"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoutineChoice } from "./routine-editor";
import { routineContactPolicyInputSchema, type RoutineContactPolicy } from "@/lib/contracts/routine-contacts";

const zones = [{ value: "America/Sao_Paulo", label: "São Paulo / Brasília" }, { value: "America/Manaus", label: "Manaus" }, { value: "America/Rio_Branco", label: "Rio Branco" }, { value: "America/Fortaleza", label: "Fortaleza" }];
const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
export function RoutineContactPolicyForm({ companyId, sectors, initial, onSaved, onPending }: { companyId: string; sectors: { id: string; name: string }[]; initial: RoutineContactPolicy | null; onSaved: (policy: RoutineContactPolicy) => void; onPending: (pending: boolean) => void }) {
  const [attempt] = useState(() => crypto.randomUUID());
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [selected, setSelected] = useState(initial?.sectorIds.filter(id => sectors.some(sector => sector.id === id)) ?? []);
  const [weekdays, setWeekdays] = useState(initial?.weekdays ?? [1, 2, 3, 4, 5]);
  const [start, setStart] = useState(String(initial?.startHour ?? 9));
  const [end, setEnd] = useState(String(initial?.endHour ?? 17));
  const [zone, setZone] = useState<string>(initial?.timeZone ?? "America/Sao_Paulo");
  const [companyLimit, setCompanyLimit] = useState(String(initial?.maxCompanyPerDay ?? 10));
  const [personLimit, setPersonLimit] = useState(String(initial?.maxPersonPerDay ?? 1));
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(null);
    const parsed = routineContactPolicyInputSchema.safeParse({ id: attempt, expectedRevision: initial?.revision ?? 0, enabled, sectorIds: selected, weekdays, startHour: Number(start), endHour: Number(end), timeZone: zone, maxCompanyPerDay: Number(companyLimit), maxPersonPerDay: Number(personLimit), reason });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Revise a configuração."); return; }
    setPending(true); onPending(true); let committed = false;
    try {
      const endpoint = `/api/admin/companies/${companyId}/routine-contact-policy`;
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const body = await response.json(); if (!response.ok) throw new Error(body.message ?? "Não foi possível salvar a configuração.");
      committed = true;
      const fresh = await fetch(endpoint, { cache: "no-store" }); const result = await fresh.json();
      if (!fresh.ok || !result.policy) throw new Error("Configuração salva. Reabra para conferir o estado atual.");
      onSaved(result.policy);
    } catch (error) { setError(committed ? "A configuração foi gravada. Reabra para conferir o estado atual antes de salvar novamente." : error instanceof Error ? error.message : "Não foi possível salvar. Seus campos foram mantidos."); }
    finally { setPending(false); onPending(false); }
  }
  const hours = (first: number, last: number) => Array.from({ length: last - first + 1 }, (_, i) => ({ value: String(first + i), label: `${String(first + i).padStart(2, "0")}:00` }));
  return <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
    <fieldset disabled={pending} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-6">
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-primary" /><span><span className="block font-medium">Autorizar contatos no Slack</span><span className="text-muted-foreground">O agente pode contatar somente os responsáveis das rotinas nos setores selecionados, dentro desta janela. Inclui um único lembrete por ciclo após 24 horas sem retorno, sujeito aos mesmos limites. Após 48 horas, o silêncio aparece na fila da operação, sem novas cobranças automáticas.</span></span></label>
      {initial?.sectorIds.some(id => !sectors.some(sector => sector.id === id)) && <p className="text-sm text-muted-foreground">Setores que deixaram de estar ativos foram retirados da nova seleção. A configuração anterior permanece no histórico.</p>}
      <fieldset className="space-y-3"><legend className="mb-2 text-sm font-medium">Público do acompanhamento</legend>{sectors.length ? sectors.map(sector => <label key={sector.id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={selected.includes(sector.id)} onChange={event => setSelected(current => event.target.checked ? [...current, sector.id] : current.filter(id => id !== sector.id))} className="size-4 accent-primary" />{sector.name}</label>) : <p className="text-sm text-muted-foreground">Cadastre um setor ativo antes de autorizar contatos.</p>}</fieldset>
      <fieldset><legend className="mb-2 text-sm font-medium">Dias de contato</legend><div className="flex flex-wrap gap-2">{days.map((day, i) => <Button key={day} type="button" size="sm" variant={weekdays.includes(i + 1) ? "secondary" : "outline"} aria-pressed={weekdays.includes(i + 1)} onClick={() => setWeekdays(current => current.includes(i + 1) ? current.filter(value => value !== i + 1) : [...current, i + 1])}>{day}</Button>)}</div></fieldset>
      <RoutineChoice label="Fuso dos contatos" value={zone} items={zones} onChange={setZone} />
      <div className="grid grid-cols-2 gap-4"><RoutineChoice label="Início da janela" value={start} items={hours(6, 21)} onChange={setStart} /><RoutineChoice label="Fim da janela" value={end} items={hours(7, 22)} onChange={setEnd} /></div>
      <p className="text-sm text-muted-foreground">O fim da janela não inclui novos envios. Os ciclos seguem o acordo da rotina; esta janela define quando o agente pode entrar em contato.</p>
      <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label htmlFor="contact-company-limit" className="text-sm font-medium">Limite diário da empresa</label><Input id="contact-company-limit" type="number" min={1} max={50} value={companyLimit} onChange={event => setCompanyLimit(event.target.value)} required /></div><div className="space-y-2"><label htmlFor="contact-person-limit" className="text-sm font-medium">Limite diário por pessoa</label><Input id="contact-person-limit" type="number" min={1} max={5} value={personLimit} onChange={event => setPersonLimit(event.target.value)} required /></div></div>
      <div className="space-y-2"><label htmlFor="contact-policy-reason" className="text-sm font-medium">Motivo e acordo de contato</label><textarea id="contact-policy-reason" rows={3} maxLength={2000} required value={reason} onChange={event => setReason(event.target.value)} className="w-full resize-y rounded-md border border-transparent bg-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
      {initial && <p className="text-xs text-muted-foreground tabular-nums">Revisão atual: {initial.revision}. Alterações preservam as configurações e os contatos anteriores.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </fieldset>
    <div className="shrink-0 border-t px-6 py-4"><Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar configuração"}</Button></div>
  </form>;
}
