"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminRoutineWorkspace, AdminRoutineWrite, RoutineRevision } from "@/lib/contracts/admin-adherence";
import type { SlackWorkspaceUser } from "@/lib/integrations/slack-format";

type Choice = { value: string; label: string };
export function RoutineChoice({ label, value, items, onChange, disabled }: { label: string; value: string; items: Choice[]; onChange: (value: string) => void; disabled?: boolean }) {
  return <div className="space-y-2"><span className="text-sm font-medium">{label}</span><Select items={items} value={value || null} onValueChange={next => onChange(next ?? "")} disabled={disabled}>
    <SelectTrigger className="w-full" aria-label={label}><SelectValue placeholder="Selecione" /></SelectTrigger>
    <SelectContent>{items.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
  </Select></div>;
}

const cadences = [{ value: "diaria", label: "Diária, de segunda a sexta" }, { value: "semanal", label: "Semanal" }, { value: "quinzenal", label: "Quinzenal" }, { value: "mensal", label: "Mensal" }, { value: "trimestral", label: "Trimestral" }, { value: "semestral", label: "Semestral" }, { value: "anual", label: "Anual" }];

export function RoutineEditor({ data, rule, users, pending, error, onSave, onCancel }: { data: AdminRoutineWorkspace; rule: RoutineRevision | null; users: SlackWorkspaceUser[]; pending: boolean; error: string | null; onSave: (input: AdminRoutineWrite) => void; onCancel: () => void }) {
  const [attemptId] = useState(() => crypto.randomUUID());
  const [routineId] = useState(() => rule?.routineId ?? crypto.randomUUID());
  const [actionKey, setActionKey] = useState(rule ? `${rule.diagnosticId}:${rule.actionPointId}` : "");
  const action = data.actions.find(item => `${item.diagnosticId}:${item.actionPointId}` === actionKey);
  const [title, setTitle] = useState(rule?.title ?? "");
  const [expectation, setExpectation] = useState(rule?.expectation ?? "");
  const [indicator, setIndicator] = useState(rule?.successIndicator ?? "");
  const [assetId, setAssetId] = useState(rule?.assetId ?? "");
  const [questionId, setQuestionId] = useState(rule?.questionId ?? "");
  const [sectorId, setSectorId] = useState(rule?.sectorId ?? "");
  const [userId, setUserId] = useState(rule?.assigneeUserId ?? "");
  const [kind, setKind] = useState<"periodica" | "por_evento">(rule?.schedule.kind ?? "periodica");
  const [cadence, setCadence] = useState(rule?.schedule.kind === "periodica" ? rule.schedule.cadence : "semanal");
  const [eventKey, setEventKey] = useState(rule?.schedule.kind === "por_evento" ? rule.schedule.eventKey : "");
  const [reason, setReason] = useState("");
  const asset = data.assets.find(item => item.id === assetId);
  const assignee = action?.assignment?.userId ?? userId;
  const personOptions = users.map(user => ({ value: user.userId, label: user.name }));
  if (action?.assignment && !personOptions.some(item => item.value === action.assignment!.userId)) personOptions.push({ value: action.assignment.userId, label: action.assignment.name });

  function selectAction(key: string) {
    setActionKey(key); setQuestionId("");
    const selected = data.actions.find(item => `${item.diagnosticId}:${item.actionPointId}` === key);
    setTitle(selected?.title ?? ""); setExpectation(selected?.description ?? ""); setIndicator(selected?.successIndicator ?? ""); setUserId(selected?.assignment?.userId ?? "");
  }
  function submit(event: React.FormEvent) {
    event.preventDefault(); if (!action || !asset) return;
    onSave({ operation: "salvar", id: attemptId, routineId, expectedRuleId: rule?.id ?? null, diagnosticId: action.diagnosticId, actionPointId: action.actionPointId,
      expectedAssignmentUpdatedAt: action.assignment?.updatedAt ?? null, title, expectation, successIndicator: indicator, assetId: asset.id, assetVersionId: asset.versionId,
      questionId, sectorId, assigneeUserId: assignee, schedule: kind === "periodica" ? { kind, cadence, timeZone: "America/Sao_Paulo" } : { kind, eventKey, timeZone: "America/Sao_Paulo" }, reason });
  }
  return <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
    <fieldset disabled={pending} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-6">
      <RoutineChoice label="Action point de origem" value={actionKey} disabled={Boolean(rule)} items={data.actions.map(item => ({ value: `${item.diagnosticId}:${item.actionPointId}`, label: `${item.diagnosticName} · ${item.title}` }))} onChange={selectAction} />
      <div className="space-y-2"><label className="text-sm font-medium" htmlFor="routine-title">Nome da rotina</label><Input id="routine-title" value={title} onChange={event => setTitle(event.target.value)} required maxLength={200} /></div>
      <RoutineChoice label="Pergunta de origem" value={questionId} items={data.questions.filter(item => item.diagnosticId === action?.diagnosticId).map(item => ({ value: item.id, label: item.text }))} onChange={setQuestionId} />
      <RoutineChoice label="Ativo publicado" value={assetId} items={data.assets.map(item => ({ value: item.id, label: `${item.title} · versão ${item.version}` }))} onChange={setAssetId} />
      {rule && asset && rule.assetVersionId !== asset.versionId ? <p className="text-sm text-muted-foreground">O ativo tem uma publicação mais recente. Confira o conteúdo antes de vincular esta revisão à versão vigente.</p> : null}
      <RoutineChoice label="Setor" value={sectorId} items={data.sectors.map(item => ({ value: item.id, label: item.name }))} onChange={setSectorId} />
      <RoutineChoice label="Responsável no Slack" value={assignee} disabled={Boolean(action?.assignment)} items={personOptions} onChange={setUserId} />
      {action?.assignment ? <p className="text-sm text-muted-foreground">O responsável acompanha a atribuição do action point. Use Transferir responsável na lista para mudar todas as rotinas vinculadas.</p> : null}
      <RoutineChoice label="Regra de execução" value={kind} items={[{ value: "periodica", label: "Periódica" }, { value: "por_evento", label: "Por evento" }]} onChange={value => setKind(value as typeof kind)} />
      {kind === "periodica" ? <RoutineChoice label="Periodicidade" value={cadence} items={cadences} onChange={value => setCadence(value as typeof cadence)} /> : <div className="space-y-2"><label className="text-sm font-medium" htmlFor="routine-event">Evento que abre uma oportunidade</label><Input id="routine-event" value={eventKey} onChange={event => setEventKey(event.target.value)} required maxLength={200} /><p className="text-sm text-muted-foreground">Defina um evento identificável, como o fechamento de um projeto.</p></div>}
      <div className="space-y-2"><label className="text-sm font-medium" htmlFor="routine-expectation">O que precisa ser executado</label><textarea className="w-full resize-y rounded-md border border-transparent bg-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" id="routine-expectation" value={expectation} onChange={event => setExpectation(event.target.value)} required maxLength={2000} rows={4} /></div>
      <div className="space-y-2"><label className="text-sm font-medium" htmlFor="routine-indicator">Critério de sucesso e evidência esperada</label><textarea className="w-full resize-y rounded-md border border-transparent bg-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" id="routine-indicator" value={indicator} onChange={event => setIndicator(event.target.value)} required maxLength={1000} rows={3} /></div>
      <div className="space-y-2"><label className="text-sm font-medium" htmlFor="routine-reason">Motivo {rule ? "da revisão" : "do acordo"}</label><textarea className="w-full resize-y rounded-md border border-transparent bg-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" id="routine-reason" value={reason} onChange={event => setReason(event.target.value)} required maxLength={1000} rows={2} /></div>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </fieldset>
    <div className="flex justify-end gap-2 border-t px-6 py-4"><Button type="button" variant="outline" onClick={onCancel} disabled={pending}>Cancelar</Button><Button type="submit" disabled={pending || !action || !asset || !questionId || !sectorId || !assignee || !users.length}>{pending ? "Salvando…" : rule ? "Salvar revisão" : "Criar rotina"}</Button></div>
  </form>;
}
