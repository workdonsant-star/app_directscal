"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { AdminAssetQuestionAudit } from "@/lib/contracts";
import { agentGapInputSchema, type AgentOperations } from "@/lib/contracts/agent-operations";

export const gapStatusLabels = { aberta: "Aberta", em_andamento: "Em andamento", resolvida: "Resolvida" };
const date = (value: string) => new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
export function AgentGapReviewDialog({ audit, operations, companyId }: { audit: AdminAssetQuestionAudit; operations: AgentOperations; companyId: string }) {
  const router = useRouter();
  const history = operations.reviews.filter(item => item.auditId === audit.id).sort((a, b) => a.sequence - b.sequence);
  const latest = history.at(-1);
  const isGap = audit.status !== "respondida" || audit.feedback === "nao_util";
  const [open, setOpen] = useState(false), [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(""), [status, setStatus] = useState(latest?.status ?? "aberta");
  const [assignee, setAssignee] = useState(latest?.assigneeUserId ?? "nenhum"), [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState(""), [due, setDue] = useState("");
  const [error, setError] = useState<string | null>(null), [notice, setNotice] = useState<string | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(null);
    const parsed = agentGapInputSchema.safeParse({ id: attempt, auditId: audit.id, expectedEventId: latest?.id ?? null, status,
      assigneeUserId: assignee === "nenhum" ? null : assignee, reason, evidenceUrl: evidence.trim() || null,
      dueAt: due ? new Date(`${due}T23:59:59-03:00`).toISOString() : null });
    if (!parsed.success) { setError("Revise responsável, justificativa, prazo e link HTTPS de evidência. Para resolver, responsável e evidência são obrigatórios."); return; }
    setPending(true);
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/agent-operations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const body = await response.json(); if (!response.ok) throw new Error(body.message ?? "Não foi possível salvar.");
      setOpen(false); setNotice("Revisão registrada. Atualizando o histórico."); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar. Seu texto foi mantido."); }
    finally { setPending(false); }
  }
  return <div className="space-y-1">
    {isGap ? <span className="block text-xs">{gapStatusLabels[latest?.status ?? "aberta"]}{latest?.dueAt ? ` · ${date(latest.dueAt)}` : ""}</span> : null}
    {latest?.assigneeUserId ? <span className="block text-xs text-muted-foreground">{operations.operators.find(item => item.id === latest.assigneeUserId)?.name ?? "Responsável indisponível"}</span> : null}
    <Button variant="ghost" size="sm" onClick={() => { setAttempt(crypto.randomUUID()); setStatus(latest?.status ?? "aberta"); setAssignee(latest?.assigneeUserId ?? "nenhum"); setReason(""); setDue(""); setEvidence(""); setError(null); setOpen(true); }}>{isGap ? "Acompanhar" : "Ver registro"}</Button>
    {notice ? <p role="status" className="text-xs">{notice}</p> : null}
    <Dialog open={open} onOpenChange={value => { if (!pending) setOpen(value); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{isGap ? "Acompanhar lacuna" : "Registro da consulta"}</DialogTitle><DialogDescription>Consulta {audit.id}. A revisão preserva a resposta original e não altera a avaliação do cliente.</DialogDescription></DialogHeader>
      <div className="space-y-4 text-sm"><p className="whitespace-pre-wrap font-medium">{audit.question}</p><p className="whitespace-pre-wrap">{audit.answer}</p><p className="text-xs text-muted-foreground">Fontes: {audit.sourceTitles.join(", ") || "Nenhuma fonte"} · {date(audit.createdAt)}</p>
        {history.length ? <ol className="space-y-3" aria-label="Histórico de acompanhamento">{history.map(item => <li key={item.id} className="border-t pt-3"><p>{gapStatusLabels[item.status]} · {item.actorName} · {date(item.recordedAt)}</p><p className="whitespace-pre-wrap text-muted-foreground">{item.reason}</p>{item.evidenceUrl ? <a className="underline underline-offset-4" href={item.evidenceUrl} target="_blank" rel="noopener noreferrer">Evidência de resolução</a> : null}</li>)}</ol> : null}
      </div>
      {isGap ? <form onSubmit={submit} className="space-y-4"><fieldset disabled={pending} className="space-y-4">
        <label className="block space-y-1 text-sm"><span>Status</span><Select value={status} onValueChange={value => { if (value) setStatus(value); }}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(gapStatusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></label>
        <label className="block space-y-1 text-sm"><span>Responsável da operação</span><Select value={assignee} onValueChange={value => { if (value) setAssignee(value); }}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nenhum">Sem responsável</SelectItem>{operations.operators.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></label>
        <label className="block space-y-1 text-sm"><span>Prazo de retorno (São Paulo, opcional)</span><Input type="date" value={due} onChange={event => setDue(event.target.value)} /></label>
        <label className="block space-y-1 text-sm"><span>Justificativa</span><textarea className="min-h-24 w-full rounded-md border bg-background px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring" required maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} /></label>
        <label className="block space-y-1 text-sm"><span>Link da evidência (obrigatório para resolver)</span><Input type="url" placeholder="https://" maxLength={2000} value={evidence} onChange={event => setEvidence(event.target.value)} /></label>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<Button type="submit">{pending ? "Registrando" : "Registrar revisão"}</Button>
      </fieldset></form> : null}
    </DialogContent></Dialog>
  </div>;
}
