"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { resultBaselineSchema, type ResultBaseline } from "@/lib/contracts/routine-results";
import type { RoutineRevision } from "@/lib/contracts/admin-adherence";
const groups = { fundador: "Fundador", lideranca: "Liderança", operacao: "Time" };
const date = (value: string) => new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
export function RoutineResultsPanel({ companyId, initial, rules, assets }: { companyId: string; initial: ResultBaseline[]; rules: RoutineRevision[]; assets: Array<{ id: string; versionId: string; title: string; version: string }> }) {
 const [items, setItems] = useState(initial), [pending, setPending] = useState(false), [error, setError] = useState<string | null>(null);
 const endpoint = `/api/admin/companies/${companyId}/result-baselines`;
 async function update(ruleId?: string) {
  setPending(true); setError(null); let committed = false;
  try {
   if (ruleId) {
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ruleId }) });
    const body = await response.json(); if (!response.ok) throw new Error(body.message ?? "Não foi possível registrar a base."); committed = true;
   }
   const response = await fetch(endpoint, { cache: "no-store" }); const body = await response.json();
   if (!response.ok) throw new Error(body.message ?? "Não foi possível carregar as bases.");
   setItems(resultBaselineSchema.array().parse(body.items));
  } catch (cause) { setError(committed ? "A base foi registrada, mas a leitura falhou. Atualize para conferir." : cause instanceof Error ? cause.message : "Não foi possível carregar a linha de base."); }
  finally { setPending(false); }
 }
 return <section className="space-y-4" aria-labelledby="routine-results-title"><div className="flex flex-wrap items-start justify-between gap-3"><div className="space-y-1"><h2 id="routine-results-title" className="text-ui-section">Base de resultado</h2><p className="max-w-3xl text-sm text-muted-foreground">A nota da coleta fica vinculada à pergunta, ação e versão do ativo. Estimativa entre coletas: sinal insuficiente até definição da rubrica, base de percepção e revisão.</p></div><Button variant="outline" disabled={pending} onClick={() => void update()}>Atualizar bases</Button></div>
  <p className="text-xs text-muted-foreground">Consulta interna da operação. Nenhum relato de execução ou uso do ativo é convertido automaticamente em nota de maturidade.</p>
  {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
  {!rules.length ? <p className="text-sm text-muted-foreground">Nenhum acordo de rotina para vincular à linha de base.</p> : <Table variant="operational"><TableHeader><TableRow><TableHead>Rotina e pergunta</TableHead><TableHead>Coleta por camada</TableHead><TableHead>Registro</TableHead></TableRow></TableHeader><TableBody>{rules.map(rule => {
   const baseline = items.find(item => item.ruleId === rule.id);
   const asset = assets.find(item => item.id === rule.assetId);
   return <TableRow key={rule.id}><TableCell className="whitespace-normal"><span className="block font-medium">{rule.title}</span><span className="text-sm text-muted-foreground">{baseline?.questionText ?? "Linha de base ainda não registrada"}</span><span className="mt-1 block text-xs text-muted-foreground">{asset?.title ?? "Ativo vinculado"} · {asset?.versionId === rule.assetVersionId ? `versão ${asset.version}` : "versão histórica preservada"}</span></TableCell><TableCell>{baseline ? baseline.layers.map(layer => <span key={layer.group} className="block tabular-nums text-sm">{groups[layer.group]}: {layer.score === null ? "Sem respostas" : layer.score.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} · {layer.responses} respostas</span>) : <span className="text-sm text-muted-foreground">Sem base capturada</span>}</TableCell><TableCell className="whitespace-normal text-sm">{baseline ? <><span className="block tabular-nums">Capturada em {date(baseline.capturedAt)}</span><span className="text-xs text-muted-foreground">{baseline.diagnosticClosedAt ? `Coleta encerrada em ${date(baseline.diagnosticClosedAt)}` : "Encerramento sem data histórica registrada"}. Registro preservado; não representa estimativa.</span></> : <Button size="sm" variant="outline" disabled={pending} onClick={() => void update(rule.id)}>Registrar base da coleta encerrada</Button>}</TableCell></TableRow>;
  })}</TableBody></Table>}
 </section>;
}
