"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUp, BookOpen, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { answerDemoQuestion, demoBoard, normalizeDemoText } from "@/lib/data/demo/demo-data";
import { updateDemo, useDemo } from "@/components/demo/demo-store";

const routines = demoBoard.categories.flatMap(category => category.actionPoints.map(point => ({ ...point, assetId: category.id })));

export function DemoAgent() {
  const { state } = useDemo();
  const [question, setQuestion] = useState("");
  const [routineId, setRoutineId] = useState(routines[0].id);
  const [proposal, setProposal] = useState<{ note: string; actionId: string } | null>(null);
  const [notice, setNotice] = useState("");
  const routine = routines.find(item => item.id === routineId)!;
  function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || state.messages.length >= 98 || proposal) return;
    const normalized = normalizeDemoText(trimmed);
    const isReport = /\b(fiz|realizei|conclui|executei|nao consegui)\b/.test(normalized);
    const answer = isReport ? { text: `Entendi seu relato sobre “${routine.name}”: ${trimmed.replace(/[.!?]+$/, "")}. Confirme abaixo para registrar. O relato ficará aguardando revisão da DirectScal.`, assetId: routine.assetId } : answerDemoQuestion(trimmed);
    updateDemo(current => ({ ...current, messages: [...current.messages, { role: "user", text: trimmed, assetId: null }, { role: "assistant", ...answer }] }));
    if (isReport) setProposal({ note: trimmed, actionId: routineId });
    setQuestion(""); setNotice("");
  }
  return <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
    <header><h1 className="text-ui-page">Agente</h1><p className="mt-2 text-sm text-muted-foreground">Consulte os ativos publicados e acompanhe as rotinas da Vertex.</p></header>
    <div className="flex flex-wrap items-center gap-3"><label htmlFor="demo-routine" className="text-xs text-muted-foreground">Rotina em acompanhamento</label><Select value={routineId} onValueChange={value => { if (value) setRoutineId(value); }} disabled={Boolean(proposal)}><SelectTrigger id="demo-routine" className="max-w-full"><SelectValue>{routine.name}</SelectValue></SelectTrigger><SelectContent>{routines.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
    {state.messages.length === 0 && <div className="py-8"><p className="text-ui-section">O que você precisa colocar em prática?</p><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Escolha uma pergunta para começar ou escreva uma dúvida sobre as orientações da biblioteca.</p><div className="mt-6 flex flex-wrap gap-2">{["Como funciona a comunicação?", "Quem cuida dos processos?", "Como funciona a governança?"].map(text => <Button variant="outline" key={text} onClick={() => ask(text)}>{text}</Button>)}</div></div>}
    <div aria-live="polite" className="space-y-6">{state.messages.map((message, index) => <article key={index} className={message.role === "user" ? "ml-8 rounded-lg bg-muted p-4" : "mr-4 py-2"}><p className="mb-2 text-xs font-medium text-muted-foreground">{message.role === "user" ? "Você" : "Agente DirectScal"}</p><p className="whitespace-pre-line text-sm leading-7">{message.text}</p>{message.assetId && <Link className="mt-3 inline-flex items-center gap-2 text-xs underline underline-offset-4" href={`/demo/ativos/${message.assetId}`}><BookOpen className="size-3.5" />Abrir documento de referência</Link>}</article>)}</div>
    {proposal && <section className="rounded-lg border p-4"><h2 className="text-sm font-medium">Registrar este relato?</h2><p className="mt-2 text-sm text-muted-foreground">{state.records.length >= 100 ? "O limite de relatos desta apresentação foi atingido. Reinicie a demo para começar outra sessão." : "A confirmação inclui o relato na fila de revisão da DirectScal."}</p><div className="mt-4 flex gap-2"><Button disabled={state.records.length >= 100} onClick={() => { updateDemo(current => ({ ...current, records: [...current.records, { id: crypto.randomUUID(), ...proposal, status: "aguardando" }] })); setProposal(null); setNotice("Relato registrado. Acompanhe a revisão em Operação."); }}><Check className="size-4" />Confirmar relato</Button><Button variant="outline" onClick={() => { setProposal(null); setNotice("Registro cancelado. Nenhuma rotina foi alterada."); }}><X className="size-4" />Cancelar</Button></div></section>}
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice} <Link href="/demo/operacao" className="underline">Abrir operação</Link></p>}
    <form className="sticky bottom-0 flex gap-2 bg-background py-4" onSubmit={event => { event.preventDefault(); ask(question); }}><Input aria-label="Mensagem para o agente" placeholder="Pergunte sobre um ativo ou relate o que executou" maxLength={2000} value={question} onChange={event => setQuestion(event.target.value)} disabled={Boolean(proposal)} /><Button type="submit" size="icon" aria-label="Enviar mensagem" disabled={!question.trim() || Boolean(proposal) || state.messages.length >= 98}><ArrowUp className="size-4" /></Button></form>
    <p className="text-xs leading-5 text-muted-foreground">Neste ambiente de apresentação, as respostas seguem o acervo fictício e os relatos ficam neste navegador. Nenhuma mensagem é enviada ao Slack.</p>
  </div>;
}
