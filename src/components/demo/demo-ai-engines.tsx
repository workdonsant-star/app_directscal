"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { demoAiProviders, emptyDemoAiAssignments, assignDemoAiEngine, removeDemoAiEngine, saveDemoAiEngine } from "@/lib/data/demo/demo-ai-engines";
import { demoAiEngineSchema, type DemoAiEngine } from "@/lib/data/demo/demo-state";
import { updateDemo, useDemo } from "./demo-store";

const roles = [
  { id: "planner", label: "Planejamento", description: "Propõe os critérios antes da aprovação do consultor." },
  { id: "conductor", label: "Conversa", description: "Redige perguntas dentro do plano aprovado." },
  { id: "classifier", label: "Classificação", description: "Interpreta respostas para aplicação das regras." },
] as const;

function providerName(id: DemoAiEngine["provider"]) {
  return demoAiProviders.find(provider => provider.id === id)?.name ?? id;
}

export function DemoAiEngines() {
  const { state } = useDemo();
  const engines = state.adminAiEngines ?? [];
  const assignments = state.adminAiAssignments ?? emptyDemoAiAssignments;
  const enabled = engines.filter(engine => engine.enabled);
  const [editing, setEditing] = useState<DemoAiEngine | "new" | null>(null);
  const [providerChoice, setProviderChoice] = useState<DemoAiEngine["provider"]>("anthropic");

  function start(provider: DemoAiEngine["provider"]) {
    setProviderChoice(provider);
    setEditing("new");
  }

  return <div className="flex w-full flex-col gap-9">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2"><h1 className="text-ui-page">Motores de IA</h1><p className="max-w-3xl text-sm text-muted-foreground">Cadastre modelos de diferentes provedores e distribua as etapas do agente. Esta configuração é fictícia e fica apenas neste navegador.</p></div>
      <Button type="button" onClick={() => start("anthropic")}><Plus aria-hidden="true" />Adicionar motor</Button>
    </header>

    <section className="space-y-4" aria-labelledby="ai-providers-title">
      <div><h2 id="ai-providers-title" className="text-ui-section">Provedores</h2><p className="mt-1 text-sm text-muted-foreground">Você pode cadastrar mais de um modelo por provedor. Nenhuma chave de API é solicitada na demo.</p></div>
      <div className="grid gap-3 md:grid-cols-3">{demoAiProviders.map(provider => <div key={provider.id} className="flex flex-col gap-3 rounded-md border p-4"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-semibold">{provider.name}</h3><span className="text-xs tabular-nums text-muted-foreground">{engines.filter(engine => engine.provider === provider.id).length} modelos</span></div><p className="flex-1 text-sm text-muted-foreground">{provider.description}</p><Button type="button" size="sm" variant="outline" className="self-start" onClick={() => start(provider.id)}>Adicionar modelo</Button></div>)}</div>
    </section>

    <section className="space-y-4" aria-labelledby="ai-models-title">
      <div><h2 id="ai-models-title" className="text-ui-section">Modelos cadastrados</h2><p className="mt-1 text-sm text-muted-foreground">“Disponível” significa apenas que o modelo pode ser escolhido no roteiro fictício. Não indica conexão ativa.</p></div>
      {engines.length ? <Table variant="operational"><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Provedor</TableHead><TableHead>Identificador do modelo</TableHead><TableHead>Situação na demo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{engines.map(engine => <TableRow key={engine.id}><TableCell className="font-medium">{engine.name}</TableCell><TableCell>{providerName(engine.provider)}</TableCell><TableCell className="font-mono text-xs">{engine.model}</TableCell><TableCell><Badge variant="outline">{engine.enabled ? "Disponível" : "Pausado"}</Badge></TableCell><TableCell><div className="flex justify-end gap-1"><Button type="button" size="sm" variant="ghost" onClick={() => setEditing(engine)}>Editar</Button><Button type="button" size="sm" variant="ghost" onClick={() => updateDemo(current => saveDemoAiEngine(current, { ...engine, enabled: !engine.enabled }))}>{engine.enabled ? "Pausar" : "Disponibilizar"}</Button><Button type="button" size="sm" variant="ghost" onClick={() => updateDemo(current => removeDemoAiEngine(current, engine.id))}>Remover</Button></div></TableCell></TableRow>)}</TableBody></Table> : <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">Nenhum modelo cadastrado. Escolha Anthropic, OpenAI ou Google para montar o catálogo da demonstração.</div>}
    </section>

    <section className="space-y-4" aria-labelledby="ai-routing-title">
      <div><h2 id="ai-routing-title" className="text-ui-section">Etapas do agente de Action Points</h2><p className="mt-1 text-sm text-muted-foreground">Selecione um modelo para cada etapa. Um mesmo modelo pode atender mais de uma etapa; só os disponíveis aparecem na seleção.</p></div>
      <div className="grid gap-4 lg:grid-cols-3">{roles.map(role => <div key={role.id} className="space-y-3 rounded-md border p-4"><div><label htmlFor={`ai-role-${role.id}`} className="text-sm font-semibold">{role.label}</label><p className="mt-1 text-xs text-muted-foreground">{role.description}</p></div><Select value={assignments[role.id] ?? "none"} items={[{ value: "none", label: "Sem modelo" }, ...enabled.map(engine => ({ value: engine.id, label: `${engine.name} · ${providerName(engine.provider)}` }))]} onValueChange={value => updateDemo(current => assignDemoAiEngine(current, role.id, typeof value === "string" && value !== "none" ? value : null))}><SelectTrigger id={`ai-role-${role.id}`} className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sem modelo</SelectItem>{enabled.map(engine => <SelectItem key={engine.id} value={engine.id}>{engine.name} · {providerName(engine.provider)}</SelectItem>)}</SelectContent></Select></div>)}</div>
      <p className="text-xs text-muted-foreground">Essas escolhas não alteram os planos já aprovados nem os ciclos simulados. A conexão operacional exigirá configuração segura no servidor e validação de cada provedor.</p>
    </section>

    <Sheet open={editing !== null} onOpenChange={open => { if (!open) setEditing(null); }}>
      <SheetContent className="flex flex-col gap-0 data-[side=right]:w-full data-[side=right]:sm:w-[480px] data-[side=right]:sm:max-w-[min(480px,100vw)]">
        <SheetHeader className="border-b px-6 py-6"><SheetTitle>{editing === "new" ? "Adicionar modelo" : "Editar modelo"}</SheetTitle><SheetDescription>Identifique o modelo usado no roteiro da demonstração. Não informe chaves de API.</SheetDescription></SheetHeader>
        {editing ? <EngineForm key={editing === "new" ? `new-${providerChoice}` : editing.id} item={editing === "new" ? null : editing} providerChoice={providerChoice} onCancel={() => setEditing(null)} onSave={engine => { updateDemo(current => saveDemoAiEngine(current, engine)); setEditing(null); }} /> : null}
      </SheetContent>
    </Sheet>
  </div>;
}

function EngineForm({ item, providerChoice, onCancel, onSave }: { item: DemoAiEngine | null; providerChoice: DemoAiEngine["provider"]; onCancel: () => void; onSave: (engine: DemoAiEngine) => void }) {
  const [id] = useState(() => item?.id ?? crypto.randomUUID());
  const [provider, setProvider] = useState<DemoAiEngine["provider"]>(item?.provider ?? providerChoice);
  const [name, setName] = useState(item?.name ?? "");
  const [model, setModel] = useState(item?.model ?? "");
  const parsed = demoAiEngineSchema.safeParse({ id, provider, name, model, enabled: item?.enabled ?? true });
  return <form className="flex min-h-0 flex-1 flex-col" onSubmit={event => { event.preventDefault(); if (parsed.success) onSave(parsed.data); }}><div className="flex-1 space-y-5 overflow-y-auto px-6 py-6"><div className="space-y-2"><label htmlFor="ai-engine-provider" className="text-sm font-medium">Provedor</label><Select value={provider} items={demoAiProviders.map(entry => ({ value: entry.id, label: entry.name }))} onValueChange={value => { if (value === "anthropic" || value === "openai" || value === "google") setProvider(value); }}><SelectTrigger id="ai-engine-provider" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{demoAiProviders.map(entry => <SelectItem key={entry.id} value={entry.id}>{entry.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><label htmlFor="ai-engine-name" className="text-sm font-medium">Nome interno</label><Input id="ai-engine-name" autoFocus required maxLength={100} placeholder="Ex.: Modelo para conversa" value={name} onChange={event => setName(event.target.value)} /></div><div className="space-y-2"><label htmlFor="ai-engine-model" className="text-sm font-medium">Identificador do modelo</label><Input id="ai-engine-model" required maxLength={120} placeholder="Informe o identificador do provedor" value={model} onChange={event => setModel(event.target.value)} /><p className="text-xs text-muted-foreground">Na demo, este texto não é consultado no provedor.</p></div></div><div className="flex justify-end gap-2 border-t px-6 py-4"><Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button><Button type="submit" disabled={!parsed.success}>Salvar modelo</Button></div></form>;
}
