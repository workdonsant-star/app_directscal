"use client";

import { ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

import { AdminCompanyTabs } from "@/components/admin/admin-company-tabs";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { adherenceLeaderPhotos } from "@/lib/data/action-points-adherence-example";
import { getDemoAdminAssets } from "@/lib/data/demo/demo-admin-assets";
import { demoRoutineUsers } from "@/lib/data/demo/demo-admin-routines";
import type { DemoActionPoint, DemoState } from "@/lib/data/demo/demo-state";
import { cn } from "@/lib/utils";
import { updateDemo, useDemo } from "./demo-store";
import { DemoActionPointPlan } from "./demo-action-point-plan";

const textareaClass = "w-full resize-y rounded-md border border-transparent bg-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

const actionPointTypes = [{ value: "pontual", label: "Pontual" }, { value: "recorrente", label: "Recorrente" }];
const frequencies = [
  { value: "diaria", label: "Diária" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
] satisfies { value: NonNullable<DemoActionPoint["frequency"]>; label: string }[];

// Exemplos exibidos até o primeiro salvamento; depois a lista vem só do estado local.
function seedActionPoints(state: DemoState): DemoActionPoint[] {
  const [first, second] = getDemoAdminAssets(state);
  if (!first || !second) return [];
  return [
    { id: "demo-ap-1", title: "Sustentar o ritual semanal de prioridades", assetId: first.id, leaderUserId: demoRoutineUsers[0]?.userId ?? "", deadline: null, frequency: "semanal", reason: "Comunicação teve a maior divergência entre camadas: a operação não reconhece as prioridades definidas pela liderança.", action: "Conduzir o ritual toda segunda e registrar prioridades e impedimentos no canal da área.", continuity: `${first.title} define pauta, participantes e registro. O agente usa esse padrão para acompanhar o ritual no Slack.` },
    { id: "demo-ap-2", title: "Aplicar o padrão de resultados semanais", assetId: second.id, leaderUserId: demoRoutineUsers[1]?.userId ?? "", deadline: "2026-11-30", frequency: "semanal", reason: "Performance tem indicadores sem dono e revisões sem regularidade.", action: "Atualizar os resultados da semana e registrar desvios com a causa.", continuity: `${second.title} é a referência única do acompanhamento. Desvios recorrentes indicam que ele precisa de revisão.` },
  ];
}

function formatDeadline(value: string) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export function DemoAdminActionPoints({ company }: { company: { id: string; name: string } }) {
  const { state } = useDemo();
  const items = state.adminActionPoints ?? seedActionPoints(state);
  const assets = getDemoAdminAssets(state).filter(asset => !asset.archivedAt);
  const [editing, setEditing] = useState<DemoActionPoint | "new" | null>(null);
  const [planningId, setPlanningId] = useState<string | null>(null);
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const people = Array.from(new Set(items.map(item => item.leaderUserId))).map(userId => ({
    userId,
    leader: demoRoutineUsers.find(user => user.userId === userId),
    points: items.filter(item => item.leaderUserId === userId),
  }));

  function togglePerson(userId: string) {
    setOpened(current => {
      const next = new Set(current);
      if (!next.delete(userId)) next.add(userId);
      return next;
    });
  }

  function save(item: DemoActionPoint) {
    updateDemo(current => {
      const list = current.adminActionPoints ?? seedActionPoints(current);
      const next = list.some(entry => entry.id === item.id) ? list.map(entry => entry.id === item.id ? item : entry) : [...list, item];
      return { ...current, adminActionPoints: next };
    });
    setOpened(current => new Set(current).add(item.leaderUserId));
    setEditing(null);
  }

  return <>
    <AppTopbar breadcrumb={[{ label: "Empresas", href: "/admin/empresas" }, { label: company.name }]} />
    <AppPage>
      <div className="flex w-full flex-col gap-8">
        <div><h1 className="text-ui-page">{company.name}</h1></div>
        <AdminCompanyTabs companyId={company.id} active="action-points" hasOrganization showActionPoints actions={<Button type="button" onClick={() => setEditing("new")}><Plus aria-hidden="true" />Novo action point</Button>} />
        <section aria-label="Action points" className="space-y-6">
          {items.length ? <ul className="divide-y">
            {people.map(({ userId, leader, points }, index) => {
              const expanded = opened.has(userId);
              const name = leader?.name ?? "Sem líder";
              return <li key={userId}>
                <button type="button" aria-expanded={expanded} aria-controls={`admin-person-${index}`} onClick={() => togglePerson(userId)} className="flex w-full cursor-pointer items-center gap-3 rounded-md py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-[180ms] motion-reduce:transition-none", expanded && "rotate-90")} aria-hidden="true" />
                  <Avatar className="size-8 shrink-0">
                    <AvatarImage src={leader?.avatarUrl ?? adherenceLeaderPhotos[name]} alt="" />
                    <AvatarFallback>{leader ? name.split(" ").map(part => part[0]).slice(0, 2).join("") : "?"}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{name}</span>
                    <span className="block text-xs text-muted-foreground"><span className="tabular-nums">{points.length}</span> {points.length === 1 ? "action point" : "action points"}</span>
                  </span>
                </button>
                <ul id={`admin-person-${index}`} aria-label={`Action points de ${name}`} hidden={!expanded} className="divide-y pb-3 pl-[72px]">
                  {points.map(item => <li key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                    <button type="button" onClick={() => setEditing(item)} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:gap-6">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium hover:underline">{item.title}</span>
                        <span className="block text-xs text-muted-foreground">{assets.find(asset => asset.id === item.assetId)?.title ?? "Ativo indisponível"}</span>
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground sm:text-right">
                        {item.frequency ? <span className="block">{frequencies.find(frequency => frequency.value === item.frequency)?.label}</span> : null}
                        <span className="block">{item.deadline ? <>{item.frequency ? "Até " : ""}<time dateTime={item.deadline}>{formatDeadline(item.deadline)}</time></> : item.frequency ? "Sem encerramento" : "Sem prazo"}</span>
                      </span>
                    </button>
                    <Button type="button" size="sm" variant="outline" className="self-start sm:self-auto" onClick={() => setPlanningId(item.id)}>{(state.adminFollowUpPlans ?? []).some(plan => plan.actionPointId === item.id && plan.status === "ativo") ? "Ver plano do agente" : "Configurar agente"}</Button>
                  </li>)}
                </ul>
              </li>;
            })}
          </ul> : <p className="text-sm text-muted-foreground">Nenhum action point cadastrado.</p>}
        </section>
      </div>
    </AppPage>
    <Sheet open={Boolean(editing)} onOpenChange={open => { if (!open) setEditing(null); }}>
      <SheetContent className="flex flex-col gap-0 data-[side=right]:w-full data-[side=right]:sm:w-[640px] data-[side=right]:sm:max-w-[min(640px,100vw)]">
        <SheetHeader className="shrink-0 px-6 py-6"><SheetTitle>{editing && editing !== "new" ? "Editar action point" : "Novo action point"}</SheetTitle><SheetDescription>Vincule um ativo de gestão e escolha o líder no Slack do cliente.</SheetDescription></SheetHeader>
        {editing ? <ActionPointForm key={editing === "new" ? "new" : editing.id} item={editing === "new" ? null : editing} assets={assets.map(asset => ({ value: asset.id, label: asset.title }))} onCancel={() => setEditing(null)} onSave={save} /> : null}
      </SheetContent>
    </Sheet>
    {planningId && items.find(item => item.id === planningId) ? <DemoActionPointPlan key={planningId} item={items.find(item => item.id === planningId)!} asset={assets.find(asset => asset.id === items.find(item => item.id === planningId)?.assetId)} open onClose={() => setPlanningId(null)} /> : null}
  </>;
}

function ActionPointForm({ item, assets, onCancel, onSave }: { item: DemoActionPoint | null; assets: { value: string; label: string }[]; onCancel: () => void; onSave: (item: DemoActionPoint) => void }) {
  const [id] = useState(() => item?.id ?? crypto.randomUUID());
  const [title, setTitle] = useState(item?.title ?? "");
  const [assetId, setAssetId] = useState<string | null>(item?.assetId ?? null);
  const [leaderUserId, setLeaderUserId] = useState<string | null>(item?.leaderUserId ?? null);
  const [type, setType] = useState(item?.frequency ? "recorrente" : "pontual");
  const [frequency, setFrequency] = useState<NonNullable<DemoActionPoint["frequency"]>>(item?.frequency ?? "semanal");
  const [deadline, setDeadline] = useState(item?.deadline ?? "");
  const [reason, setReason] = useState(item?.reason ?? "");
  const [action, setAction] = useState(item?.action ?? "");
  const [continuity, setContinuity] = useState(item?.continuity ?? "");
  const leaders = demoRoutineUsers.map(user => ({ value: user.userId, label: user.name }));
  const canSave = Boolean(assetId && leaderUserId) && [title, reason, action, continuity].every(value => value.trim());

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave || !assetId || !leaderUserId) return;
    onSave({ id, title: title.trim(), assetId, leaderUserId, deadline: deadline || null, frequency: type === "recorrente" ? frequency : null, reason: reason.trim(), action: action.trim(), continuity: continuity.trim() });
  }

  return <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-6">
    <div className="grid gap-2"><label htmlFor="action-point-title" className="text-sm font-medium">Título</label><Input id="action-point-title" required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} /></div>
    <div className="grid gap-2"><label htmlFor="action-point-asset" className="text-sm font-medium">Ativo de gestão</label><Select value={assetId} items={assets} onValueChange={value => setAssetId(typeof value === "string" ? value : null)}><SelectTrigger id="action-point-asset" className="w-full"><SelectValue placeholder="Selecione um ativo" /></SelectTrigger><SelectContent>{assets.map(asset => <SelectItem key={asset.value} value={asset.value}>{asset.label}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid gap-2"><label htmlFor="action-point-leader" className="text-sm font-medium">Líder no Slack</label><Select value={leaderUserId} items={leaders} onValueChange={value => setLeaderUserId(typeof value === "string" ? value : null)}><SelectTrigger id="action-point-leader" className="w-full"><SelectValue placeholder="Selecione o líder" /></SelectTrigger><SelectContent>{leaders.map(leader => <SelectItem key={leader.value} value={leader.value}>{leader.label}</SelectItem>)}</SelectContent></Select></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2"><label htmlFor="action-point-type" className="text-sm font-medium">Tipo</label><Select value={type} items={actionPointTypes} onValueChange={value => { if (value === "pontual" || value === "recorrente") { setType(value); setDeadline(""); } }}><SelectTrigger id="action-point-type" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{actionPointTypes.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
      {type === "recorrente" ? <div className="grid gap-2"><label htmlFor="action-point-frequency" className="text-sm font-medium">Frequência</label><Select value={frequency} items={frequencies} onValueChange={value => { const selected = frequencies.find(option => option.value === value); if (selected) setFrequency(selected.value); }}><SelectTrigger id="action-point-frequency" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{frequencies.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div> : null}
    </div>
    <div className="grid gap-2">
      <label htmlFor="action-point-deadline" className="text-sm font-medium">{type === "recorrente" ? "Encerramento (opcional)" : "Prazo (opcional)"}</label>
      <Input id="action-point-deadline" type="date" aria-describedby="action-point-deadline-help" value={deadline} onChange={event => setDeadline(event.target.value)} />
      <p id="action-point-deadline-help" className="text-xs text-muted-foreground">{type === "recorrente" ? "Deixe em branco para repetir sem data de encerramento." : "Deixe em branco se ainda não houver um prazo."}</p>
    </div>
    <div className="grid gap-2"><label htmlFor="action-point-reason" className="text-sm font-medium">Por que existe</label><textarea id="action-point-reason" className={textareaClass} required maxLength={2000} rows={3} value={reason} onChange={event => setReason(event.target.value)} /></div>
    <div className="grid gap-2"><label htmlFor="action-point-action" className="text-sm font-medium">O que fazer</label><textarea id="action-point-action" className={textareaClass} required maxLength={2000} rows={3} value={action} onChange={event => setAction(event.target.value)} /></div>
    <div className="grid gap-2"><label htmlFor="action-point-continuity" className="text-sm font-medium">Papel do ativo na continuidade</label><textarea id="action-point-continuity" className={textareaClass} required maxLength={2000} rows={3} value={continuity} onChange={event => setContinuity(event.target.value)} /></div>
    </div>
    <div className="flex justify-end gap-2 border-t px-6 py-4"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="submit" disabled={!canSave}>Salvar</Button></div>
  </form>;
}
