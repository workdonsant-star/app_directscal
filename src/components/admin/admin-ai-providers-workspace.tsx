"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AgentProvider } from "@/lib/data/agent-provider-data-source";

type ProviderItem = {
  provider: AgentProvider;
  name: string;
  model: string;
  configured: boolean;
  keySource: "painel" | "servidor" | null;
  selected: boolean;
};

type ResponseBody = { message?: string; providers?: ProviderItem[] };

export function AdminAiProvidersWorkspace({ initialProviders }: { initialProviders: ProviderItem[] }) {
  const [providers, setProviders] = useState(initialProviders);
  return <div className="flex w-full flex-col gap-8">
    <header className="space-y-2">
      <h1 className="text-ui-page">Motores de IA</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">Conecte os provedores e escolha o modelo que responde às perguntas sobre os ativos publicados. A busca e as fontes continuam restritas à empresa de cada pessoa.</p>
    </header>
    <div className="grid gap-4 xl:grid-cols-3">
      {providers.map(item => <ProviderForm key={item.provider} item={item} onUpdate={setProviders} />)}
    </div>
    <p className="text-sm text-muted-foreground">As chaves ficam cifradas no servidor. Testar envia apenas uma frase fictícia ao modelo, sem dados de clientes e sem alterar o motor em uso.</p>
  </div>;
}

function ProviderForm({ item, onUpdate }: { item: ProviderItem; onUpdate: (providers: ProviderItem[]) => void }) {
  const [model, setModel] = useState(item.model);
  const [apiKey, setApiKey] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(method: "POST" | "PUT" | "DELETE", select = false) {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/ai-providers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(method === "DELETE" ? { provider: item.provider } : {
          provider: item.provider, model: model.trim(), ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
          ...(method === "PUT" ? { select } : {}),
        }),
        cache: "no-store",
      });
      const body = await response.json() as ResponseBody;
      if (!response.ok) throw new Error(body.message || "Não foi possível concluir a operação.");
      if (body.providers) onUpdate(body.providers);
      if (method !== "POST") setApiKey("");
      setMessage(method === "POST" ? "Resposta de teste recebida do modelo." : method === "DELETE" ? "Conexão removida." : select ? "Motor selecionado para o agente." : "Conexão salva.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível concluir a operação.");
    } finally { setPending(false); }
  }

  return <section className="flex flex-col gap-5 rounded-md border p-5" aria-label={item.name}>
    <div className="flex items-start justify-between gap-3">
      <div><h2 className="text-ui-section">{item.name}</h2><p className="mt-1 text-xs text-muted-foreground">{item.configured ? item.keySource === "painel" ? "Chave salva no painel" : "Chave configurada no servidor" : "Sem chave conectada"}</p></div>
      {item.selected ? <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">Em uso</span> : null}
    </div>
    <div className="space-y-2"><label htmlFor={`${item.provider}-model`} className="text-sm font-medium">Modelo</label><Input id={`${item.provider}-model`} value={model} onChange={event => setModel(event.target.value)} maxLength={120} spellCheck={false} autoComplete="off" /></div>
    <div className="space-y-2"><label htmlFor={`${item.provider}-key`} className="text-sm font-medium">Chave de API</label><Input id={`${item.provider}-key`} type="password" value={apiKey} onChange={event => setApiKey(event.target.value)} autoComplete="new-password" placeholder={item.configured ? "Digite para substituir a chave" : "Cole a chave de API"} /><p className="text-xs text-muted-foreground">A chave salva nunca é mostrada novamente.</p></div>
    <div className="mt-auto flex flex-wrap gap-2">
      <Button type="button" size="sm" onClick={() => void submit("PUT")} disabled={pending || !model.trim() || (!item.configured && !apiKey.trim())}>Salvar conexão</Button>
      <Button type="button" size="sm" variant="outline" onClick={() => void submit("POST")} disabled={pending || !model.trim() || (!item.configured && !apiKey.trim())}>Testar</Button>
      {!item.selected && (item.configured || apiKey.trim()) ? <Button type="button" size="sm" variant="outline" onClick={() => void submit("PUT", true)} disabled={pending || !model.trim()}>Usar no agente</Button> : null}
      {item.keySource === "painel" ? <Button type="button" size="sm" variant="ghost" onClick={() => void submit("DELETE")} disabled={pending}>Desconectar</Button> : null}
    </div>
    {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
  </section>;
}
