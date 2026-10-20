"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RoutineChoice } from "./routine-editor";
import { routineSupervisionInputSchema, type RoutineSupervisionInput } from "@/lib/contracts/routine-supervision";
import { getRoutineReviewState, routineAlertLabels, type RoutineReviewCycle } from "@/lib/data/routine-supervision";
import { localRoutineInstant } from "@/lib/data/routine-calendar";
const date = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
type Decision = { item: RoutineReviewCycle; attempt: string };
export function RoutineReviewPanel({ companyId, initial, checkedAt }: { companyId: string; initial: RoutineReviewCycle[]; checkedAt: string }) {
  const [items, setItems] = useState(initial), [at, setAt] = useState(checkedAt);
  const [all, setAll] = useState(false), [pending, setPending] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [operation, setOperation] = useState<RoutineSupervisionInput["operation"]>("orientar");
  const [accepted, setAccepted] = useState("false"), [reason, setReason] = useState(""), [due, setDue] = useState("");
  const [error, setError] = useState<string | null>(null), [notice, setNotice] = useState<string | null>(null);
  const endpoint = `/api/admin/companies/${companyId}/routine-supervision`;
  const rows = items.map(item => ({ item, state: getRoutineReviewState(item, new Date(at)) })).filter(row => all || row.state.alerts.length);
  const state = decision ? getRoutineReviewState(decision.item, new Date(at)) : null;
  async function refresh() {
    const response = await fetch(endpoint, { cache: "no-store" }); const body = await response.json();
    if (!response.ok) throw new Error(body.message ?? "Não foi possível atualizar a fila.");
    setItems(body.items); setAt(new Date().toISOString());
  }
  function open(item: RoutineReviewCycle) {
    const current = getRoutineReviewState(item, new Date(at));
    setDecision({ item, attempt: crypto.randomUUID() }); setOperation(current.alerts.includes("evidencia") ? "evidencia" : current.alerts.includes("excecao") ? "excecao" : "orientar");
    setReason(""); setDue(""); setAccepted("false"); setError(null); setNotice(null);
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!decision || !state) return;
    setError(null);
    let responseDueAt: string | undefined;
    try {
      if (operation === "prazo") {
        const match = due.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
        if (!match) throw new Error("Informe o prazo de retorno.");
        responseDueAt = new Date(localRoutineInstant({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }, Number(match[4])).getTime() + Number(match[5]) * 60000).toISOString();
      }
    } catch { setError("Informe uma data e horário de retorno válidos, em São Paulo."); return; }
    const input = routineSupervisionInputSchema.safeParse({ id: decision.attempt, cycleId: decision.item.cycle.id, expectedEventId: state.expectedEventId, operation, reason,
      ...(operation === "evidencia" || operation === "excecao" ? { factId: operation === "evidencia" ? state.execution?.id : state.exception?.id, accepted: accepted === "true" }
        : { ...(state.blocker ? { proposalId: state.blocker.id } : {}), ...(operation === "prazo" ? { responseDueAt } : {}) }),
    });
    if (!input.success) { setError("Revise o registro de origem, a justificativa e os campos da decisão."); return; }
    setPending(true); let committed = false;
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input.data) }); const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Não foi possível salvar a decisão.");
      committed = true; setDecision(null); setNotice("Decisão registrada. O histórico e o prazo original da oportunidade foram preservados."); await refresh();
    } catch (cause) { setError(committed ? "A decisão foi gravada, mas a fila não carregou. Atualize os dados para conferir." : cause instanceof Error ? cause.message : "Não foi possível salvar. Seu texto foi mantido."); }
    finally { setPending(false); }
  }
  const canAccept = operation !== "evidencia" || Boolean(state?.execution?.payload.kind === "execucao_relatada" && state.execution.payload.performed && state.execution.payload.evidence.length);
  return <section className="space-y-4" aria-labelledby="routine-review-title">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="space-y-1"><h2 id="routine-review-title" className="text-ui-section">Revisão e intervenção</h2><p className="max-w-3xl text-sm text-muted-foreground">Confira evidências, exceções e bloqueios. Silêncio sinaliza acompanhamento pendente; não comprova falha de execução.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setAll(!all)}>{all ? "Somente pendências" : "Ver todos os ciclos"}</Button><Button variant="outline" disabled={pending} onClick={() => { setPending(true); setError(null); void refresh().catch(() => setError("Não foi possível atualizar a fila.")).finally(() => setPending(false)); }}>Atualizar fila</Button></div></div>
    {notice ? <p role="status" className="text-sm">{notice}</p> : null}
    {error && !decision ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    {!rows.length ? <p className="py-4 text-sm text-muted-foreground">{all ? "Nenhum ciclo disponível para revisão." : "Nenhuma pendência de revisão neste momento."}</p> : <Table variant="operational"><TableHeader><TableRow><TableHead>Rotina e ciclo</TableHead><TableHead>Pendência</TableHead><TableHead>Retorno</TableHead><TableHead><span className="sr-only">Ações</span></TableHead></TableRow></TableHeader><TableBody>{rows.map(({ item, state: current }) => <TableRow key={item.cycle.id}><TableCell><span className="block font-medium">{item.title}</span><span className="text-xs text-muted-foreground">{date(item.cycle.opensAt)} a {date(item.cycle.dueAt)}</span></TableCell><TableCell>{current.alerts.length ? current.alerts.map(alert => <span key={alert} className="block text-sm">{routineAlertLabels[alert]}</span>) : <span className="text-muted-foreground">Sem pendência</span>}</TableCell><TableCell className="tabular-nums">{date(current.returnDeadline)}</TableCell><TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => open(item)}>Revisar</Button></TableCell></TableRow>)}</TableBody></Table>}
    <Dialog open={Boolean(decision)} onOpenChange={open => { if (!open && !pending) setDecision(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Revisar rotina</DialogTitle><DialogDescription>{decision?.item.title} · {decision ? date(decision.item.cycle.dueAt) : ""}. A decisão fica registrada no acompanhamento do cliente.</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="space-y-4"><fieldset disabled={pending} className="space-y-4">
        <div className="space-y-2 text-sm"><p className="whitespace-pre-wrap">{decision?.item.cycle.rule.expectation}</p>{decision?.item.successIndicator ? <p className="whitespace-pre-wrap text-muted-foreground">Critério de sucesso: {decision.item.successIndicator}</p> : null}<p className="text-xs text-muted-foreground">Responsável no ciclo: {decision?.item.cycle.rule.assignee.userId}</p></div>
        <RoutineChoice label="Decisão" value={operation} onChange={value => { setOperation(value as RoutineSupervisionInput["operation"]); setAccepted("false"); }} items={[{ value: "orientar", label: "Orientar a execução" }, { value: "prazo", label: "Acordar prazo de retorno" }, ...(state?.execution ? [{ value: "evidencia", label: "Revisar evidência" }] : []), ...(state?.exception ? [{ value: "excecao", label: "Revisar exceção" }] : [])]} />
        {state?.blocker?.operation.kind === "bloqueio" ? <p className="whitespace-pre-wrap text-sm">Bloqueio: {state.blocker.operation.reason}</p> : null}
        {operation === "evidencia" && state?.execution?.payload.kind === "execucao_relatada" ? <div className="space-y-2 text-sm"><p>{state.execution.payload.performed ? "Execução relatada" : "Não execução relatada"}</p>{state.execution.payload.evidence.map(url => <a key={url} className="block break-all underline underline-offset-4" href={url} target="_blank" rel="noopener noreferrer">{url}</a>)}</div> : null}
        {operation === "excecao" && state?.exception?.payload.kind === "excecao_solicitada" ? <p className="whitespace-pre-wrap text-sm">{state.exception.payload.reason}</p> : null}
        {operation === "evidencia" || operation === "excecao" ? <RoutineChoice label="Resultado da revisão" value={accepted} onChange={setAccepted} items={[{ value: "false", label: operation === "excecao" ? "Recusar exceção" : "Devolver evidência" }, ...(canAccept ? [{ value: "true", label: operation === "excecao" ? "Aprovar exceção" : "Validar evidência" }] : [])]} /> : null}
        {operation === "prazo" ? <div className="space-y-2"><label className="text-sm font-medium" htmlFor="routine-return-deadline">Retorno até, horário de São Paulo</label><Input id="routine-return-deadline" type="datetime-local" value={due} onChange={event => setDue(event.target.value)} required /><p className="text-xs text-muted-foreground">Até 90 dias. O prazo da oportunidade e a medição original permanecem.</p></div> : null}
        <div className="space-y-2"><label htmlFor="routine-review-reason" className="text-sm font-medium">Justificativa e orientação</label><textarea id="routine-review-reason" value={reason} onChange={event => setReason(event.target.value)} required maxLength={2000} rows={4} className="w-full resize-y rounded-md border border-transparent bg-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
        {decision?.item.reviews.length ? <details><summary className="cursor-pointer text-sm">Decisões anteriores</summary><ol className="mt-3 space-y-3">{decision.item.reviews.map(review => <li key={review.id} className="text-sm"><p className="text-xs text-muted-foreground">{review.actorName} · {date(review.recordedAt)}</p><p className="whitespace-pre-wrap">{review.reason}</p></li>)}</ol></details> : null}
      </fieldset>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={() => setDecision(null)}>Cancelar</Button><Button type="submit" disabled={pending || !reason.trim()}>{pending ? "Registrando…" : "Registrar decisão"}</Button></DialogFooter></form>
    </DialogContent></Dialog>
  </section>;
}
