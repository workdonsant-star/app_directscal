"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AdminCompanyActionPoint, AdminCompanyActionPointInput } from "@/lib/contracts/admin-company-action-points";

const fieldClass = "w-full resize-y rounded-md border border-transparent bg-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const frequencies = [{ value: "diaria", label: "Diária" }, { value: "semanal", label: "Semanal" }, { value: "quinzenal", label: "Quinzenal" }, { value: "mensal", label: "Mensal" }] as const;

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
  const [deadline, setDeadline] = useState(item?.deadline ?? "");
  const [reason, setReason] = useState(item?.reason ?? "");
  const [action, setAction] = useState(item?.action ?? "");
  const [continuity, setContinuity] = useState(item?.continuity ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSave = Boolean(assetId && leaderUserId) && [title, reason, action, continuity].every(value => value.trim());

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave || !assetId || !leaderUserId || saving) return;
    const payload: AdminCompanyActionPointInput = {
      id, expectedUpdatedAt: item?.updatedAt ?? null, title: title.trim(), assetId, leaderUserId,
      deadline: deadline || null, frequency: type === "recorrente" ? frequency : null,
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
      <div className="grid gap-2"><label htmlFor="action-point-reason" className="text-sm font-medium">Por que existe</label><textarea id="action-point-reason" className={fieldClass} required maxLength={2000} rows={3} value={reason} onChange={event => setReason(event.target.value)} /></div>
      <div className="grid gap-2"><label htmlFor="action-point-action" className="text-sm font-medium">O que fazer</label><textarea id="action-point-action" className={fieldClass} required maxLength={2000} rows={3} value={action} onChange={event => setAction(event.target.value)} /></div>
      <div className="grid gap-2"><label htmlFor="action-point-continuity" className="text-sm font-medium">Papel do ativo na continuidade</label><textarea id="action-point-continuity" className={fieldClass} required maxLength={2000} rows={3} value={continuity} onChange={event => setContinuity(event.target.value)} /></div>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
    <div className="flex justify-end gap-2 border-t px-6 py-4"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={!canSave || saving}>{saving ? "Salvando…" : "Salvar"}</Button></div>
  </form>;
}
