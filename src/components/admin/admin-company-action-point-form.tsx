"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AdminCompanyActionPoint, AdminCompanyActionPointInput } from "@/lib/contracts/admin-company-action-points";

const fieldClass = "w-full resize-y rounded-md border border-transparent bg-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const frequencies = [{ value: "diaria", label: "Diária" }, { value: "semanal", label: "Semanal" }, { value: "quinzenal", label: "Quinzenal" }, { value: "mensal", label: "Mensal" }] as const;
const days = [{ value: 1, label: "Seg" }, { value: 2, label: "Ter" }, { value: 3, label: "Qua" }, { value: 4, label: "Qui" }, { value: 5, label: "Sex" }, { value: 6, label: "Sáb" }, { value: 0, label: "Dom" }];
const hours = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const minutes = Array.from({ length: 12 }, (_, step) => String(step * 5).padStart(2, "0"));
const todayInSaoPaulo = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export function AdminCompanyActionPointForm({ companyId, item, open, assets, leaders, onClose, onSaved }: {
  companyId: string; item: AdminCompanyActionPoint | null; open: boolean;
  assets: { id: string; title: string }[]; leaders: { userId: string; name: string }[];
  onClose: () => void; onSaved: () => void;
}) {
  return <Sheet open={open} onOpenChange={value => { if (!value) onClose(); }}>
    <SheetContent className="flex flex-col gap-0 data-[side=right]:w-full data-[side=right]:sm:w-[640px] data-[side=right]:sm:max-w-[min(640px,100vw)]">
      <SheetHeader className="shrink-0 px-6 py-6"><SheetTitle>{item ? "Editar action point" : "Novo action point"}</SheetTitle><SheetDescription>Vincule um ativo publicado e escolha o líder no Slack da empresa.</SheetDescription></SheetHeader>
      {open ? <Fields key={item?.id ?? "new"} companyId={companyId} item={item} assets={assets} leaders={leaders} onClose={onClose} onSaved={onSaved} /> : null}
    </SheetContent>
  </Sheet>;
}

function Fields({ companyId, item, assets, leaders, onClose, onSaved }: {
  companyId: string; item: AdminCompanyActionPoint | null;
  assets: { id: string; title: string }[]; leaders: { userId: string; name: string }[];
  onClose: () => void; onSaved: () => void;
}) {
  const [id] = useState(() => item?.id ?? crypto.randomUUID());
  const [title, setTitle] = useState(item?.title ?? "");
  const [assetId, setAssetId] = useState<string | null>(item?.assetId ?? null);
  const [leaderUserId, setLeaderUserId] = useState<string | null>(item?.leaderUserId ?? null);
  const [type, setType] = useState(item?.frequency ? "recorrente" : "pontual");
  const [frequency, setFrequency] = useState<NonNullable<AdminCompanyActionPoint["frequency"]>>(item?.frequency ?? "semanal");
  const [weekdays, setWeekdays] = useState<number[]>(item?.weekdays ?? [1]);
  const [sendTime, setSendTime] = useState(item?.sendTime ?? "09:00");
  const [sendHour, sendMinute] = sendTime.split(":");
  const alignedTime = minutes.includes(sendMinute);
  const [scheduleStartsOn] = useState(item?.scheduleStartsOn ?? todayInSaoPaulo);
  const [deadline, setDeadline] = useState(item?.deadline ?? "");
  const [reason, setReason] = useState(item?.reason ?? "");
  const [action, setAction] = useState(item?.action ?? "");
  const [continuity, setContinuity] = useState(item?.continuity ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSave = Boolean(assetId && leaderUserId) && [title, reason, action, continuity].every(value => value.trim()) && (type === "pontual" || (weekdays.length > 0 && alignedTime));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave || !assetId || !leaderUserId || saving) return;
    const payload: AdminCompanyActionPointInput = {
      id, expectedUpdatedAt: item?.updatedAt ?? null, title: title.trim(), assetId, leaderUserId,
      deadline: deadline || null, frequency: type === "recorrente" ? frequency : null,
      weekdays: type === "recorrente" ? weekdays : [], sendTime: type === "recorrente" ? sendTime : null,
      scheduleStartsOn: type === "recorrente" ? scheduleStartsOn : null,
      reason: reason.trim(), action: action.trim(), continuity: continuity.trim(),
    };
    setSaving(true); setError(null);
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/action-points`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Não foi possível salvar o action point.");
      onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar o action point."); }
    finally { setSaving(false); }
  }

  return <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-6">
      <div className="grid gap-2"><label htmlFor="action-point-title" className="text-sm font-medium">Título</label><Input id="action-point-title" required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} /></div>
      <div className="grid gap-2"><label htmlFor="action-point-asset" className="text-sm font-medium">Ativo de gestão</label><Select value={assetId} items={assets.map(asset => ({ value: asset.id, label: asset.title }))} onValueChange={value => setAssetId(typeof value === "string" ? value : null)}><SelectTrigger id="action-point-asset" className="w-full"><SelectValue placeholder="Selecione um ativo" /></SelectTrigger><SelectContent>{assets.map(asset => <SelectItem key={asset.id} value={asset.id}>{asset.title}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid gap-2"><label htmlFor="action-point-leader" className="text-sm font-medium">Líder no Slack</label><Select value={leaderUserId} items={leaders.map(leader => ({ value: leader.userId, label: leader.name }))} onValueChange={value => setLeaderUserId(typeof value === "string" ? value : null)}><SelectTrigger id="action-point-leader" className="w-full"><SelectValue placeholder="Selecione o líder" /></SelectTrigger><SelectContent>{leaders.map(leader => <SelectItem key={leader.userId} value={leader.userId}>{leader.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label htmlFor="action-point-type" className="text-sm font-medium">Tipo</label><Select value={type} items={[{ value: "pontual", label: "Pontual" }, { value: "recorrente", label: "Recorrente" }]} onValueChange={value => { if (value === "pontual" || value === "recorrente") { setType(value); setDeadline(""); } }}><SelectTrigger id="action-point-type" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pontual">Pontual</SelectItem><SelectItem value="recorrente">Recorrente</SelectItem></SelectContent></Select></div>
        {type === "recorrente" ? <div className="grid gap-2"><label htmlFor="action-point-frequency" className="text-sm font-medium">Frequência</label><Select value={frequency} items={frequencies.map(option => ({ value: option.value, label: option.label }))} onValueChange={value => { const selected = frequencies.find(option => option.value === value); if (selected) setFrequency(selected.value); }}><SelectTrigger id="action-point-frequency" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{frequencies.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div> : null}</div>
      <div className="grid gap-2"><label htmlFor="action-point-deadline" className="text-sm font-medium">{type === "recorrente" ? "Encerramento (opcional)" : "Prazo (opcional)"}</label><Input id="action-point-deadline" type="date" value={deadline} onChange={event => setDeadline(event.target.value)} /></div>
      {type === "recorrente" ? <div className="space-y-4 rounded-md border p-4"><div><p className="text-sm font-medium">Dias de envio</p><p className="text-xs text-muted-foreground">Horário de Brasília. Na frequência quinzenal, a contagem começa na semana do cadastro. Na mensal, os dias escolhidos valem na primeira semana de cada mês.</p></div><div className="flex flex-wrap gap-2" role="group" aria-label="Dias da semana">{days.map(day => <button key={day.value} type="button" aria-pressed={weekdays.includes(day.value)} onClick={() => setWeekdays(current => current.includes(day.value) ? current.filter(value => value !== day.value) : [...current, day.value].sort())} className="min-h-8 min-w-10 rounded-md border px-2 text-xs font-medium aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{day.label}</button>)}</div><div className="grid gap-2"><p className="text-sm font-medium">Horário de Brasília</p><div className="flex max-w-48 items-center gap-2"><Select value={sendHour} items={hours.map(hour => ({ value: hour, label: hour }))} onValueChange={value => { if (typeof value === "string") setSendTime(`${value}:${sendMinute}`); }}><SelectTrigger aria-label="Hora" className="w-20"><SelectValue /></SelectTrigger><SelectContent>{hours.map(hour => <SelectItem key={hour} value={hour}>{hour}</SelectItem>)}</SelectContent></Select><span aria-hidden="true">:</span><Select value={sendMinute} items={[...(!alignedTime ? [{ value: sendMinute, label: `${sendMinute} (ajustar)` }] : []), ...minutes.map(minute => ({ value: minute, label: minute }))]} onValueChange={value => { if (typeof value === "string") setSendTime(`${sendHour}:${value}`); }}><SelectTrigger aria-label="Minuto" className="w-24"><SelectValue /></SelectTrigger><SelectContent>{!alignedTime ? <SelectItem value={sendMinute}>{sendMinute} (ajustar)</SelectItem> : null}{minutes.map(minute => <SelectItem key={minute} value={minute}>{minute}</SelectItem>)}</SelectContent></Select></div><p className="text-xs text-muted-foreground">Os envios são verificados a cada cinco minutos.</p>{!alignedTime ? <p className="text-xs text-destructive">Escolha um minuto disponível para atualizar este horário.</p> : null}</div></div> : null}
      <div className="grid gap-2"><label htmlFor="action-point-reason" className="text-sm font-medium">Por que existe</label><textarea id="action-point-reason" className={fieldClass} required maxLength={2000} rows={3} value={reason} onChange={event => setReason(event.target.value)} /></div>
      <div className="grid gap-2"><label htmlFor="action-point-action" className="text-sm font-medium">O que fazer</label><textarea id="action-point-action" className={fieldClass} required maxLength={2000} rows={3} value={action} onChange={event => setAction(event.target.value)} /></div>
      <div className="grid gap-2"><label htmlFor="action-point-continuity" className="text-sm font-medium">Papel do ativo na continuidade</label><textarea id="action-point-continuity" className={fieldClass} required maxLength={2000} rows={3} value={continuity} onChange={event => setContinuity(event.target.value)} /></div>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
    <div className="flex justify-end gap-2 border-t px-6 py-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={!canSave || saving}>{saving ? "Salvando…" : "Salvar"}</Button></div>
  </form>;
}
