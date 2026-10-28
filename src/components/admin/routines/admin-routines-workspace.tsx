"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RoutineEventForm } from "./routine-event-form";
import { RoutineContactPolicyForm } from "./routine-contact-policy-form";
import { RoutineResultsPanel } from "./routine-results-panel";
import type { ResultBaseline } from "@/lib/contracts/routine-results";
import { RoutineReviewPanel } from "./routine-review-panel";
import type { RoutineReviewCycle } from "@/lib/data/routine-supervision";
import type { RoutineContactPolicy } from "@/lib/contracts/routine-contacts";
import { RoutineChoice, RoutineEditor } from "./routine-editor";
import type { AdminRoutineWorkspace, AdminRoutineWrite, RoutineAction, RoutineRevision } from "@/lib/contracts/admin-adherence";
import type { SlackWorkspaceUser } from "@/lib/integrations/slack-format";

const date = (value: string) => new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
const cadenceLabels: Record<string, string> = { diaria: "Diária, de segunda a sexta", semanal: "Semanal", quinzenal: "Quinzenal", mensal: "Mensal", trimestral: "Trimestral", semestral: "Semestral", anual: "Anual" };

type Decision = { id: string; operation: "situacao"; rule: RoutineRevision; expectedEventId: string | null; action: "pausar" | "retomar" } | { id: string; operation: "transferir"; action: RoutineAction; expectedRules: { routineId: string; ruleId: string }[] };

export function AdminRoutinesWorkspace({ initial, initialPolicy = null, initialReview = [], initialBaselines = [], checkedAt }: { initial: AdminRoutineWorkspace; initialPolicy?: RoutineContactPolicy | null; initialReview?: RoutineReviewCycle[]; initialBaselines?: ResultBaseline[]; checkedAt: string }) {
  const [policy, setPolicy] = useState(initialPolicy);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyPending, setPolicyPending] = useState(false);
  const [occurrence, setOccurrence] = useState<RoutineRevision | null>(null);
  const [occurrencePending, setOccurrencePending] = useState(false);
  const [data, setData] = useState(initial);
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<{ rule: RoutineRevision | null } | null>(null);
  const [history, setHistory] = useState<RoutineRevision | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [users, setUsers] = useState<SlackWorkspaceUser[]>([]);
  const directoryRequest = useRef(0);
  const [directoryPending, setDirectoryPending] = useState(false);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const mutationsBlocked = pending || refreshing || needsRefresh;
  const missingRequirements = [!data.actions.length && "um action point publicado", !data.assets.length && "um ativo publicado", !data.sectors.length && "um setor ativo"].filter(Boolean);
  const endpoint = `/api/admin/companies/${data.companyId}/routines`;
  const byRoutine = new Map<string, RoutineRevision>();
  for (const rule of data.rules) if (rule.revision > (byRoutine.get(rule.routineId)?.revision ?? 0)) byRoutine.set(rule.routineId, rule);
  const rules = Array.from(byRoutine.values());
  const rows = rules.filter(rule => `${rule.title} ${rule.expectation} ${data.sectors.find(sector => sector.id === rule.sectorId)?.name ?? ""}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
  const currentEvent = (routineId: string) => data.events.filter(event => event.routineId === routineId).sort((a, b) => b.sequence - a.sequence)[0];
  const paused = rules.filter(rule => currentEvent(rule.routineId)?.action === "pausar").length;
  const actionFor = (rule: RoutineRevision) => data.actions.find(action => action.diagnosticId === rule.diagnosticId && action.actionPointId === rule.actionPointId);

  async function loadDirectory() {
    const request = ++directoryRequest.current;
    setDirectoryPending(true); setDirectoryError(null); setUsers([]);
    try {
      const response = await fetch(`${endpoint}?directory=1`, { cache: "no-store" }); const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? "Não foi possível listar as pessoas.");
      if (request === directoryRequest.current) setUsers(result.users);
    } catch (cause) { if (request === directoryRequest.current) setDirectoryError(cause instanceof Error ? cause.message : "Não foi possível listar as pessoas."); }
    finally { if (request === directoryRequest.current) setDirectoryPending(false); }
  }
  async function refresh() {
    const response = await fetch(endpoint, { cache: "no-store" }); const result = await response.json();
    if (!response.ok) throw new Error(result.message ?? "Não foi possível atualizar a lista.");
    setData(result.workspace);
    setNeedsRefresh(false);
  }
  async function reload() {
    if (pending || refreshing) return;
    setRefreshing(true); setError(null);
    try { await refresh(); }
    catch { setError("Não foi possível atualizar os dados. A lista anterior foi mantida."); }
    finally { setRefreshing(false); }
  }
  async function save(input: AdminRoutineWrite) {
    if (mutationsBlocked) return;
    setPending(true); setError(null); setNotice(null); let committed = false;
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const result = await response.json(); if (!response.ok) throw new Error(result.message ?? "Não foi possível salvar.");
      committed = true; setNeedsRefresh(true); setEditor(null); setDecision(null); setNotice(input.operation === "salvar" ? "Acordo da rotina salvo." : input.operation === "transferir" ? "Responsável e acordos transferidos. O histórico anterior foi mantido." : input.action === "pausar" ? "Rotina pausada. Os ciclos anteriores foram mantidos." : "Rotina retomada.");
      await refresh();
    } catch (cause) { setError(committed ? "A alteração foi gravada, mas a lista não carregou. Atualize os dados para conferir." : cause instanceof Error ? cause.message : "Não foi possível salvar. Seu texto foi mantido."); }
    finally { setPending(false); }
  }
  function openEditor(rule: RoutineRevision | null) { if (mutationsBlocked) return; setError(null); setEditor({ rule }); void loadDirectory(); }
  function openDecision(value: Decision) { if (mutationsBlocked) return; setError(null); setReason(""); setTargetUser(""); setDecision(value); if (value.operation === "transferir") void loadDirectory(); }
  function submitDecision(event: React.FormEvent) {
    event.preventDefault(); if (!decision || mutationsBlocked) return;
    if (decision.operation === "transferir" && (directoryPending || directoryError || !users.some(user => user.userId === targetUser && user.userId !== decision.action.assignment?.userId))) return;
    if (decision.operation === "situacao") void save({ operation: "situacao", id: decision.id, routineId: decision.rule.routineId, expectedEventId: decision.expectedEventId, action: decision.action, reason });
    else if (decision.action.assignment) void save({ operation: "transferir", id: decision.id, diagnosticId: decision.action.diagnosticId, actionPointId: decision.action.actionPointId, expectedUpdatedAt: decision.action.assignment.updatedAt, expectedRules: decision.expectedRules, assigneeUserId: targetUser, reason });
  }
  const historyItems = history ? [
    ...data.rules.filter(rule => rule.routineId === history.routineId).map(rule => ({ key: rule.id, at: rule.createdAt, title: `Revisão ${rule.revision} · ${rule.actorName}`, body: rule.reason ?? "Acordo inicial", detail: `${rule.title} · ${rule.expectation} · Critério: ${rule.successIndicator}` })),
    ...data.events.filter(event => event.routineId === history.routineId).map(event => ({ key: event.id, at: event.recordedAt, title: `${event.action === "pausar" ? "Pausa" : "Retomada"} · ${event.actorName}`, body: event.reason, detail: "" })),
  ].sort((a, b) => b.at.localeCompare(a.at)) : [];

  return <>
    <AppTopbar breadcrumb={[{ label: "Empresas", href: "/admin/empresas" }, { label: data.companyName, href: `/admin/empresas/${data.companyId}` }, { label: "Rotinas" }]} actions={<Button onClick={() => openEditor(null)} disabled={mutationsBlocked || missingRequirements.length > 0}><Plus aria-hidden="true" />Nova rotina</Button>} />
    <AppPage className="gap-6">
      <section className="space-y-2"><h1 className="text-ui-page">Rotinas de {data.companyName}</h1><p className="max-w-3xl text-sm text-muted-foreground">Defina o acordo de execução, vincule sua origem e acompanhe responsáveis e revisões.</p>
        <p className="text-sm text-muted-foreground tabular-nums">{rules.length} rotinas · {rules.length - paused} ativas · {paused} pausadas</p></section>
      {missingRequirements.length > 0 ? <p className="text-sm text-muted-foreground">Para criar uma rotina, esta empresa precisa de {missingRequirements.join(", ")}.</p> : null}
      {needsRefresh ? <p role="status" className="text-sm text-muted-foreground">Atualize os dados para liberar novas alterações nas rotinas.</p> : null}
      {notice ? <p role="status" className="text-sm">{notice}</p> : null}
      {error && !editor && !decision ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap items-center gap-3"><Button variant="outline" onClick={() => setPolicyOpen(true)}>Configurar acompanhamento</Button><span className="text-sm text-muted-foreground">{policy?.enabled ? "Contatos autorizados" : "Contatos desativados"}</span></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><Input aria-label="Buscar rotinas" placeholder="Buscar rotina ou setor" value={search} onChange={event => setSearch(event.target.value)} className="max-w-sm" /><Button variant="outline" disabled={pending || refreshing} onClick={() => void reload()}>{refreshing ? "Atualizando…" : "Atualizar dados"}</Button></div>
      {!rules.length ? <section className="space-y-2 py-8"><h2 className="text-ui-section">Nenhuma rotina configurada</h2><p className="max-w-2xl text-sm text-muted-foreground">Crie um acordo a partir de um action point publicado. É necessário ter um ativo publicado e um setor ativo nesta empresa.</p><Button nativeButton={false} variant="link" render={<Link href={`/admin/empresas/${data.companyId}`} />}>Voltar à operação da empresa</Button></section> : <Table variant="operational"><TableHeader><TableRow><TableHead>Rotina</TableHead><TableHead>Responsável</TableHead><TableHead>Setor</TableHead><TableHead>Regra</TableHead><TableHead>Situação</TableHead><TableHead><span className="sr-only">Ações</span></TableHead></TableRow></TableHeader><TableBody>
        {rows.map(rule => { const action = actionFor(rule); const event = currentEvent(rule.routineId); const isPaused = event?.action === "pausar"; return <TableRow key={rule.routineId}>
          <TableCell><span className="block font-medium">{rule.title}</span><span className="block text-xs text-muted-foreground">{action?.diagnosticName ?? "Diagnóstico de origem"} · Revisão {rule.revision}</span></TableCell>
          <TableCell>{action?.assignment?.name ?? "Não disponível"}</TableCell><TableCell>{data.sectors.find(sector => sector.id === rule.sectorId)?.name ?? "Setor inativo"}</TableCell><TableCell>{rule.schedule.kind === "periodica" ? cadenceLabels[rule.schedule.cadence] : `Por evento: ${rule.schedule.eventKey}`}</TableCell><TableCell>{!action ? "Origem indisponível" : isPaused ? "Pausada" : "Ativa"}</TableCell>
          <TableCell><div className="flex flex-wrap justify-end gap-1"><Button size="sm" variant="ghost" disabled={mutationsBlocked} onClick={() => openEditor(rule)}>Editar</Button><Button size="sm" variant="ghost" disabled={mutationsBlocked} onClick={() => openDecision({ id: crypto.randomUUID(), operation: "situacao", rule, expectedEventId: event?.id ?? null, action: isPaused ? "retomar" : "pausar" })}>{isPaused ? "Retomar" : "Pausar"}</Button><Button size="sm" variant="ghost" disabled={mutationsBlocked || !action?.assignment} onClick={() => { if (action) openDecision({ id: crypto.randomUUID(), operation: "transferir", action, expectedRules: rules.filter(item => item.diagnosticId === rule.diagnosticId && item.actionPointId === rule.actionPointId).map(item => ({ routineId: item.routineId, ruleId: item.id })) }); }}>Transferir responsável</Button>{rule.schedule.kind === "por_evento" && <Button size="sm" variant="ghost" disabled={mutationsBlocked || !policy?.enabled || isPaused || !action} title={!policy?.enabled ? "Configure e autorize o acompanhamento antes de registrar a ocorrência." : undefined} onClick={() => setOccurrence(rule)}>Registrar ocorrência</Button>}<Button size="sm" variant="ghost" onClick={() => setHistory(rule)}>Histórico</Button></div></TableCell>
        </TableRow>; })}
        {!rows.length ? <TableRow><TableCell colSpan={6} className="text-muted-foreground">Nenhuma rotina corresponde à busca.</TableCell></TableRow> : null}
      </TableBody></Table>}
      <RoutineResultsPanel companyId={data.companyId} initial={initialBaselines} rules={rules} assets={data.assets} />
    <RoutineReviewPanel companyId={data.companyId} initial={initialReview} checkedAt={checkedAt} />
    </AppPage>
    <Dialog open={Boolean(occurrence)} onOpenChange={open => { if (!open && !occurrencePending) setOccurrence(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Registrar ocorrência</DialogTitle><DialogDescription>{occurrence?.title}. A oportunidade e o contato serão conservados com esta versão do acordo.</DialogDescription></DialogHeader>{occurrence && policy && <RoutineEventForm key={occurrence.id} companyId={data.companyId} rule={occurrence} policy={policy} onPending={setOccurrencePending} onSaved={() => { setOccurrence(null); setNotice("Ocorrência registrada. O contato respeitará a configuração da empresa."); }} />}</DialogContent></Dialog>
    <Sheet open={policyOpen} onOpenChange={open => { if (!policyPending) setPolicyOpen(open); }}><SheetContent className="flex flex-col gap-0 data-[side=right]:w-full data-[side=right]:sm:w-[640px] data-[side=right]:sm:max-w-[min(640px,100vw)]"><SheetHeader className="shrink-0 px-6 py-6"><SheetTitle>Acompanhamento das rotinas</SheetTitle><SheetDescription>Configure público, horário e limites antes de autorizar contatos.</SheetDescription></SheetHeader>{policyOpen && <RoutineContactPolicyForm key={policy?.id ?? "new"} companyId={data.companyId} sectors={data.sectors} initial={policy} onPending={setPolicyPending} onSaved={next => { setPolicy(next); setPolicyOpen(false); setNotice("Configuração do acompanhamento salva."); }} />}</SheetContent></Sheet>
    <Sheet open={Boolean(editor)} onOpenChange={open => { if (!open && !pending) setEditor(null); }}><SheetContent className="flex flex-col gap-0 data-[side=right]:w-full data-[side=right]:sm:w-[640px] data-[side=right]:sm:max-w-[min(640px,100vw)]"><SheetHeader className="shrink-0 px-6 py-6"><SheetTitle>{editor?.rule ? "Revisar rotina" : "Nova rotina"}</SheetTitle><SheetDescription>Defina o acordo. Uma revisão nova preserva os ciclos e as versões anteriores.</SheetDescription></SheetHeader>
      {directoryPending ? <p role="status" className="px-6 pb-4 text-sm text-muted-foreground">Consultando o diretório do Slack…</p> : null}
      {directoryError ? <div className="space-y-2 px-6 pb-4"><p role="alert" className="text-sm text-destructive">{directoryError}</p><Button variant="outline" onClick={() => void loadDirectory()}>Tentar novamente</Button></div> : null}
      {editor ? <RoutineEditor key={editor.rule?.id ?? "new"} data={data} rule={editor.rule} users={users} directoryUnavailable={Boolean(directoryError)} pending={pending || directoryPending} error={error} onSave={input => void save(input)} onCancel={() => setEditor(null)} /> : null}
    </SheetContent></Sheet>
    <Dialog open={Boolean(decision)} onOpenChange={open => { if (!open && !pending) setDecision(null); }}><DialogContent><DialogHeader><DialogTitle>{decision?.operation === "transferir" ? "Transferir responsável" : decision?.action === "pausar" ? "Pausar rotina" : "Retomar rotina"}</DialogTitle><DialogDescription>{decision?.operation === "transferir" ? `A transferência atualiza a atribuição do action point e os acordos das ${decision.expectedRules.length} rotinas vinculadas. Ciclos anteriores conservam a pessoa e a versão originais.` : "A mudança vale para novas oportunidades. Os ciclos e as evidências anteriores permanecem no histórico."}</DialogDescription></DialogHeader>
      <form onSubmit={submitDecision} className="space-y-5">
        {decision?.operation === "transferir" ? <><RoutineChoice label="Novo responsável no Slack" value={targetUser} items={users.filter(user => user.userId !== decision.action.assignment?.userId).map(user => ({ value: user.userId, label: user.name }))} onChange={setTargetUser} disabled={pending || directoryPending} />{directoryError ? <div className="space-y-2"><p role="alert" className="text-sm text-destructive">{directoryError}</p><Button type="button" variant="outline" onClick={() => void loadDirectory()}>Tentar novamente</Button></div> : !directoryPending && !users.some(user => user.userId !== decision.action.assignment?.userId) ? <p className="text-sm text-muted-foreground">Não há outra pessoa ativa no workspace conectado. Revise o diretório do Slack antes de transferir.</p> : null}</> : null}
        <div className="space-y-2"><label className="text-sm font-medium" htmlFor="routine-decision-reason">Motivo da mudança</label><textarea className="w-full resize-y rounded-md border border-transparent bg-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" id="routine-decision-reason" value={reason} onChange={event => setReason(event.target.value)} required maxLength={1000} disabled={pending} rows={3} /></div>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter><Button type="button" variant="outline" onClick={() => setDecision(null)} disabled={pending}>Cancelar</Button><Button type="submit" disabled={pending || !reason.trim() || decision?.operation === "transferir" && (!targetUser || directoryPending || Boolean(directoryError) || !users.some(user => user.userId === targetUser && user.userId !== decision.action.assignment?.userId))}>{pending ? "Salvando…" : "Confirmar mudança"}</Button></DialogFooter>
      </form>
    </DialogContent></Dialog>
    <Sheet open={Boolean(history)} onOpenChange={open => { if (!open) setHistory(null); }}><SheetContent className="data-[side=right]:w-full data-[side=right]:sm:w-[640px] data-[side=right]:sm:max-w-[min(640px,100vw)]"><SheetHeader><SheetTitle>Histórico da rotina</SheetTitle><SheetDescription>{history?.title}</SheetDescription></SheetHeader><ol className="space-y-6 overflow-y-auto px-6 pb-6">{historyItems.map(item => <li key={item.key} className="space-y-2"><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{date(item.at)}</p><p className="text-sm">{item.body}</p>{item.detail ? <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.detail}</p> : null}</li>)}</ol></SheetContent></Sheet>
  </>;
}
