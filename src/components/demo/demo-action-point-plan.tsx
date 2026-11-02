"use client";

import { useState } from "react";
import type { AdminManagementAssetDetail } from "@/lib/contracts/management-assets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { demoDiagnosticQuestions, proposeDemoFollowUpPlan, simulateDemoFollowUpCycle, summarizeDemoFollowUp } from "@/lib/data/demo/demo-action-point-follow-up";
import { demoFollowUpPlanSchema, type DemoActionPoint, type DemoFollowUpCriterion, type DemoFollowUpPlan } from "@/lib/data/demo/demo-state";
import { updateDemo, useDemo } from "./demo-store";

const fieldClass = "w-full resize-y rounded-md border border-transparent bg-input px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const statusLabels = { atendido: "Atendido", parcial: "Parcial", nao_atendido: "Não atendido", inconclusivo: "Inconclusivo", sem_resposta: "Sem resposta" };

function savePlan(plan: DemoFollowUpPlan) {
  updateDemo(state => ({ ...state, adminFollowUpPlans: [...(state.adminFollowUpPlans ?? []).filter(entry => !(entry.actionPointId === plan.actionPointId && entry.version === plan.version)), plan] }));
}

export function DemoActionPointPlan({ item, asset, open, onClose }: { item: DemoActionPoint; asset: AdminManagementAssetDetail | undefined; open: boolean; onClose: () => void }) {
  const { state } = useDemo();
  const plans = (state.adminFollowUpPlans ?? []).filter(plan => plan.actionPointId === item.id).sort((a, b) => b.version - a.version);
  const saved = plans[0];
  const [draft, setDraft] = useState<DemoFollowUpPlan | null>(saved?.status === "rascunho" ? saved : null);
  const current = draft ?? saved;
  const sourceValid = Boolean(asset?.published && current?.assetId === item.assetId && current.assetVersionId === asset.published.id && current.actionFrequency === item.frequency);
  const summary = current?.status === "ativo" ? summarizeDemoFollowUp(current) : null;
  const canApprove = Boolean(current?.status === "rascunho" && sourceValid && demoFollowUpPlanSchema.safeParse(current).success);

  function startProposal() {
    if (!asset?.published) return;
    setDraft(proposeDemoFollowUpPlan(item, asset, (saved?.version ?? 0) + 1));
  }

  function editCriterion(index: number, field: keyof DemoFollowUpCriterion, value: string) {
    if (!draft) return;
    setDraft({ ...draft, criteria: draft.criteria.map((criterion, position) => position === index ? { ...criterion, [field]: value } : criterion) });
  }

  function runCycle() {
    if (!current || !sourceValid) return;
    const cycle = simulateDemoFollowUpCycle(current);
    if (cycle) savePlan({ ...current, cycles: [...current.cycles, cycle] });
  }

  return <Sheet open={open} onOpenChange={value => { if (!value) onClose(); }}>
    <SheetContent className="flex flex-col gap-0 data-[side=right]:w-full data-[side=right]:sm:w-[760px] data-[side=right]:sm:max-w-[min(760px,100vw)]">
      <SheetHeader className="shrink-0 border-b px-6 py-6">
        <SheetTitle>Plano do agente</SheetTitle>
        <SheetDescription>{item.title} · Simulação local, sem IA ou mensagens no Slack.</SheetDescription>
      </SheetHeader>
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-6">
        <section className="space-y-3" aria-labelledby="plan-origin-title">
          <div className="flex items-center justify-between gap-3"><h3 id="plan-origin-title" className="text-sm font-semibold">Origem e prática</h3>{current ? <Badge variant="outline">{current.status === "ativo" ? "Ativo" : "Rascunho"} · v{current.version}</Badge> : null}</div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Diagnóstico de origem</p><p className="mt-1 font-medium">Diagnóstico de outubro</p><p className="mt-1 text-muted-foreground">{item.reason}</p></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Ativo publicado</p><p className="mt-1 font-medium">{asset?.title ?? "Ativo indisponível"}{asset?.published ? ` · v${asset.published.versionNumber}` : ""}</p><p className="mt-1 text-muted-foreground">{item.continuity}</p></div>
          </div>
          {current ? <div className="space-y-2"><label htmlFor="plan-diagnostic-question" className="text-sm font-medium">Pergunta vinculada ao diagnóstico</label><Select value={current.diagnosticQuestion} items={demoDiagnosticQuestions} disabled={current.status === "ativo"} onValueChange={value => { if (draft && typeof value === "string") setDraft({ ...draft, diagnosticQuestion: value }); }}><SelectTrigger id="plan-diagnostic-question" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{demoDiagnosticQuestions.map(question => <SelectItem key={question.value} value={question.value}>{question.label}</SelectItem>)}</SelectContent></Select></div> : null}
          {current && !sourceValid ? <p role="status" className="text-sm text-destructive">O ativo ou a frequência mudou. Prepare uma nova versão antes de simular outros ciclos.</p> : null}
        </section>

        {!current ? <section className="space-y-3 rounded-md border p-4"><h3 className="text-sm font-semibold">Configurar antes de ativar</h3><p className="text-sm text-muted-foreground">A proposta fictícia usa o diagnóstico e um trecho da versão publicada do ativo. Revise os critérios e as perguntas antes de ativar.</p><Button type="button" onClick={startProposal} disabled={!asset?.published}>Montar proposta de exemplo</Button></section> : null}

        {current ? <>
          <section className="space-y-3" aria-labelledby="plan-criteria-title">
            <div className="flex items-center justify-between"><h3 id="plan-criteria-title" className="text-sm font-semibold">Critérios e roteiro</h3><span className="text-xs tabular-nums text-muted-foreground">{current.criteria.length} critérios</span></div>
            <p className="text-xs text-muted-foreground">A mesma regra volta a cada período. No período atual, o agente esclarece somente os campos ainda ausentes.</p>
            {current.criteria.map((criterion, index) => <div key={criterion.id} className="space-y-3 rounded-md border p-4">
              <div className="flex items-center justify-between"><p className="text-sm font-semibold">Critério {index + 1}</p>{draft && draft.criteria.length > 1 ? <Button type="button" size="sm" variant="ghost" onClick={() => setDraft({ ...draft, criteria: draft.criteria.filter(entry => entry.id !== criterion.id) })}>Remover</Button> : null}</div>
              <PlanField id={`fact-${index}`} label="Fato esperado" value={criterion.fact} editable={Boolean(draft)} onChange={value => editCriterion(index, "fact", value)} />
              <div><p className="text-xs font-medium text-muted-foreground">Trecho do ativo · versão {asset?.published?.versionNumber ?? "—"}</p><p className="mt-1 border-l-2 pl-3 text-sm text-muted-foreground">{criterion.source}</p></div>
              <PlanField id={`fields-${index}`} label="Resposta suficiente exige" value={criterion.requiredFields} editable={Boolean(draft)} onChange={value => editCriterion(index, "requiredFields", value)} />
              <PlanField id={`question-${index}`} label="Pergunta inicial" value={criterion.question} editable={Boolean(draft)} onChange={value => editCriterion(index, "question", value)} />
              <PlanField id={`clarification-${index}`} label="Se faltar informação" value={criterion.clarification} editable={Boolean(draft)} onChange={value => editCriterion(index, "clarification", value)} />
              <div className="space-y-1"><label htmlFor={`evidence-${index}`} className="text-xs font-medium text-muted-foreground">Evidência exigida</label><Select value={criterion.evidence} items={[{ value: "relato", label: "Relato do responsável" }, { value: "registro", label: "Registro apresentado" }]} disabled={!draft} onValueChange={value => { if (value === "relato" || value === "registro") editCriterion(index, "evidence", value); }}><SelectTrigger id={`evidence-${index}`} className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="relato">Relato do responsável</SelectItem><SelectItem value="registro">Registro apresentado</SelectItem></SelectContent></Select><p className="text-xs text-muted-foreground">A demo não confere o conteúdo de links ou arquivos.</p></div>
            </div>)}
            {draft && draft.criteria.length < 5 ? <Button type="button" variant="outline" size="sm" onClick={() => setDraft({ ...draft, criteria: [...draft.criteria, { ...draft.criteria[0], id: `${item.id}-c${Date.now()}`, fact: "", requiredFields: "", question: "", clarification: "" }] })}>Adicionar critério</Button> : null}
          </section>
          <section className="space-y-2"><label htmlFor="plan-orientation" className="text-sm font-medium">Orientação de conversa</label><textarea id="plan-orientation" className={fieldClass} rows={2} maxLength={500} disabled={!draft} value={current.orientation} onChange={event => { if (draft) setDraft({ ...draft, orientation: event.target.value }); }} /><p className="text-xs text-muted-foreground">A orientação ajusta foco e tom. Não altera os critérios nem a pontuação.</p></section>
          {current.status === "rascunho" ? <section className="space-y-3" aria-labelledby="plan-preview-title"><h3 id="plan-preview-title" className="text-sm font-semibold">Prévia antes da ativação</h3><div className="grid gap-2 text-sm"><div className="rounded-md border p-3"><p className="text-xs font-medium text-muted-foreground">Resposta completa</p><p className="mt-1">O líder informa {current.criteria[0]?.requiredFields || "todos os campos"}. O critério pode ser atendido com base no relato.</p></div><div className="rounded-md border p-3"><p className="text-xs font-medium text-muted-foreground">Resposta vaga ou parcial</p><p className="mt-1">“Está tudo encaminhado.” O agente pede os campos ausentes; se a lacuna continuar, classifica como inconclusivo.</p></div><div className="rounded-md border p-3"><p className="text-xs font-medium text-muted-foreground">Sem resposta</p><p className="mt-1">Após o contato fictício entregue e o prazo encerrado, o período fica sem resposta. Isso não prova que a prática deixou de acontecer.</p></div></div></section> : null}
          <section className="space-y-3 rounded-md border p-4"><h3 className="text-sm font-semibold">Como o resultado será lido</h3><p className="text-sm text-muted-foreground">Atendido exige todos os campos do critério. Parcial, inconclusivo e sem resposta ficam fora do numerador, com contagens próprias. Falha de envio não entra no denominador. Execução relatada e evolução do diagnóstico são leituras separadas.</p></section>
          {summary ? <section className="space-y-4" aria-labelledby="plan-cycles-title">
            <div><h3 id="plan-cycles-title" className="text-sm font-semibold">Ciclos simulados</h3><p className="text-xs text-muted-foreground">A aprovação ocorreu uma vez. Respostas e classificações são exemplos fixos para apresentação; nenhum texto é avaliado por IA.</p></div>
            <div className="grid gap-3 sm:grid-cols-3"><Metric label="Aderência demonstrada" value={`${summary.attended} de ${summary.expected}`} detail={current.cycles.length < 3 ? "Amostra insuficiente para faixa" : "Critérios atendidos nos ciclos"} /><Metric label="Respostas" value={`${summary.answeredPeriods} de ${current.cycles.length}`} detail="Períodos com relato" /><Metric label="Lacunas" value={String(summary.partial + summary.inconclusive + summary.unanswered)} detail="Parciais, inconclusivos e silêncio" /></div>
            {current.cycles.map(cycle => <div key={cycle.number} className="rounded-md border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">{cycle.period}</p><Badge variant="outline">Ciclo {cycle.number}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{cycle.response ? `Relato fictício: “${cycle.response}”` : "Sem resposta ao contato fictício entregue."}</p><ul className="mt-3 divide-y">{cycle.results.map(result => <li key={result.criterionId} className="flex flex-col gap-1 py-2 text-sm sm:flex-row sm:justify-between sm:gap-4"><span>{current.criteria.find(criterion => criterion.id === result.criterionId)?.fact ?? "Critério anterior"}<span className="block text-xs text-muted-foreground">{result.explanation}</span></span><span className="shrink-0 font-medium">{statusLabels[result.status]}</span></li>)}</ul></div>)}
          </section> : null}
        </> : null}
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
        {draft ? <><Button type="button" variant="outline" disabled={!demoFollowUpPlanSchema.safeParse(draft).success} onClick={() => { savePlan(draft); setDraft(null); }}>Salvar rascunho</Button><Button type="button" disabled={!canApprove} onClick={() => { savePlan({ ...draft, status: "ativo" }); setDraft(null); }}>Aprovar e ativar</Button></> : null}
        {current?.status === "ativo" && !draft ? <><Button type="button" variant="outline" onClick={startProposal}>Preparar nova versão</Button><Button type="button" disabled={!sourceValid || current.cycles.length >= (current.actionFrequency ? 3 : 1)} onClick={runCycle}>Simular próximo ciclo</Button></> : null}
        {current?.status === "rascunho" && !draft ? <Button type="button" onClick={() => setDraft(current)}>Revisar plano</Button> : null}
      </div>
    </SheetContent>
  </Sheet>;
}

function PlanField({ id, label, value, editable, onChange }: { id: string; label: string; value: string; editable: boolean; onChange: (value: string) => void }) {
  return <div className="space-y-1"><label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>{editable ? <Input id={id} value={value} maxLength={id.startsWith("fact-") || id.startsWith("fields-") ? 300 : 500} onChange={event => onChange(event.target.value)} /> : <p id={id} className="text-sm">{value}</p>}</div>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}
