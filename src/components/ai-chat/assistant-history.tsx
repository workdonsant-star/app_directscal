"use client";

import { useAppRuntime } from "@/components/app-runtime";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { assistantHistoryPageSchema, type AssistantHistoryPage } from "@/lib/contracts/assistant-history";
export function AssistantHistory() {
 const runtime = useAppRuntime();
 const [open, setOpen] = useState(false), [pending, setPending] = useState(false), [error, setError] = useState<string | null>(null);
 const [page, setPage] = useState<AssistantHistoryPage | null>(null);
 async function load(more = false) {
  setPending(true); setError(null);
  try {
   const response = await runtime.request(`/api/assistant/history${more && page?.nextCursor ? `?cursor=${encodeURIComponent(page.nextCursor)}` : ""}`, { cache: "no-store" });
   const body = await response.json(); if (!response.ok) throw new Error(body.message ?? "Não foi possível consultar o histórico.");
   const parsed = assistantHistoryPageSchema.parse(body);
   setPage(previous => ({ ...parsed, items: more ? [...previous?.items ?? [], ...parsed.items].filter((item, index, list) => list.findIndex(candidate => candidate.id === item.id) === index) : parsed.items }));
  } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível consultar o histórico."); }
  finally { setPending(false); }
 }
 return <><Button variant="ghost" size="sm" onClick={() => { setOpen(true); void load(); }}>Histórico de consultas</Button>
  <Sheet open={open} onOpenChange={setOpen}><SheetContent className="overflow-y-auto sm:max-w-lg"><SheetHeader><SheetTitle>Suas consultas no app</SheetTitle><SheetDescription>Registros da sua conta nesta empresa. Fontes indicam a versão usada na resposta; os links abrem o ativo vigente.</SheetDescription></SheetHeader>
   <div className="space-y-5 px-4 pb-6">{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}{page?.items.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma consulta registrada.</p> : null}
    {page?.items.map(item => <details key={item.id} className="border-b pb-4 text-sm"><summary className="cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="block text-xs text-muted-foreground tabular-nums">{new Date(item.createdAt).toLocaleString("pt-BR")}</span>{item.question}</summary><p className="mt-3 whitespace-pre-wrap">{item.answer}</p><ul className="mt-3 space-y-1 text-xs">{item.citations.map(citation => <li key={citation.chunkId}><Link className="underline underline-offset-4" href={citation.href}>{citation.title} · versão {citation.versionNumber} · {citation.section}</Link></li>)}</ul><p className="mt-2 text-xs text-muted-foreground">Registro {item.id}</p></details>)}
    {pending ? <p role="status" className="text-sm">Consultando histórico</p> : null}<Button variant="outline" disabled={pending} onClick={() => void load(Boolean(page?.nextCursor))}>{page?.nextCursor ? "Carregar anteriores" : "Atualizar histórico"}</Button>
   </div>
  </SheetContent></Sheet></>;
}
