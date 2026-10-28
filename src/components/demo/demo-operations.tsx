"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { demoBoard } from "@/lib/data/demo/demo-data";
import { reviewDemoRecord } from "@/lib/data/demo/demo-state";
import { updateDemo, useDemo } from "@/components/demo/demo-store";

export function DemoOperations() {
  const { state } = useDemo();
  const pending = state.records.filter(record => record.status === "aguardando").length;
  return <div className="space-y-8"><header><p className="mb-2 text-xs text-muted-foreground">Operação DirectScal · Vertex Logistics</p><h1 className="text-ui-page">Acompanhamento das rotinas</h1><p className="mt-2 text-sm text-muted-foreground">{pending} {pending === 1 ? "relato aguardando revisão" : "relatos aguardando revisão"}. Consultora responsável: Clara Mendes.</p></header>
    <div className="flex flex-wrap gap-3"><Button variant="outline" nativeButton={false} render={<Link href="/demo/relatorio" />}>Revisar diagnóstico publicado</Button><Button variant="outline" nativeButton={false} render={<Link href="/demo/ativos" />}>Consultar ativos vigentes</Button></div>
    <Table variant="operational"><TableHeader><TableRow><TableHead>Rotina e relato</TableHead><TableHead>Responsável</TableHead><TableHead>Situação</TableHead><TableHead className="text-right">Revisão</TableHead></TableRow></TableHeader><TableBody>{[...state.records].reverse().map(record => { const category = demoBoard.categories.find(category => category.actionPoints.some(point => point.id === record.actionId)); const point = category?.actionPoints.find(point => point.id === record.actionId); return <TableRow key={record.id}><TableCell className="min-w-72 max-w-xl"><p className="font-medium">{point?.name ?? "Rotina de acompanhamento"}</p><p className="mt-2 whitespace-normal text-xs leading-5 text-muted-foreground">{record.note}</p></TableCell><TableCell>{category?.leader?.name ?? "Sem responsável"}</TableCell><TableCell>{record.status === "aguardando" ? "Aguardando revisão" : record.status === "validado" ? "Revisado" : "Devolvido para ajuste"}</TableCell><TableCell><div className="flex justify-end gap-2">{record.status === "aguardando" ? <><Button variant="outline" size="sm" onClick={() => updateDemo(current => reviewDemoRecord(current, record.id, "validado"))}>Validar relato</Button><Button variant="ghost" size="sm" onClick={() => updateDemo(current => reviewDemoRecord(current, record.id, "devolvido"))}>Devolver</Button></> : <span className="text-xs text-muted-foreground">Clara Mendes</span>}</div></TableCell></TableRow>; })}</TableBody></Table>
    <section className="max-w-2xl space-y-3"><h2 className="text-ui-title">Como apresentar o acompanhamento</h2><p className="text-sm leading-6 text-muted-foreground">Abra o Agente, selecione uma rotina e envie um relato como “fiz a reunião e registrei as prioridades”. Confirme o registro e volte aqui para revisar. A operação preserva o relato original.</p><p className="text-xs leading-5 text-muted-foreground">A revisão desta demo registra uma decisão de apresentação. Não comprova evidência de execução real nem altera os indicadores históricos do cenário.</p></section>
  </div>;
}
