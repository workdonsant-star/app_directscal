"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { listSlackDeliveries } from "@/lib/data/slack-delivery-operations";

type DeliveryPage = Awaited<ReturnType<typeof listSlackDeliveries>>;
type Delivery = DeliveryPage["items"][number];
const labels: Record<string, string> = { recebido: "Pendente", processando: "Processando", concluido: "Entregue", falhou: "Falhou", incerto: "Incerto" };
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

function recoveryText(item: Delivery) {
  if (item.status === "incerto") return "Confira a conversa no Slack. Não reenviar sem confirmar o recebimento.";
  if (item.status === "falhou" && item.retryable) return `Nova tentativa automática a partir de ${dateFormatter.format(new Date(item.nextAttemptAt))}.`;
  if (item.status === "falhou") return "Corrija a causa antes de tentar novamente.";
  if (item.status === "concluido") return item.deliveredTs ? "Recebimento confirmado pelo Slack." : "Evento encerrado sem envio de mensagem.";
  return "Aguardando processamento. Use Atualizar para consultar o estado.";
}

export function SlackDeliveriesPanel({ companyId }: { companyId: string }) {
  const [data, setData] = useState<DeliveryPage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selected, setSelected] = useState<Delivery | null>(null);
  const [retryLocked, setRetryLocked] = useState(false);
  const endpoint = `/api/admin/companies/${encodeURIComponent(companyId)}/slack-deliveries`;

  async function read(cursor?: string) {
    const response = await fetch(`${endpoint}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message ?? "Não foi possível consultar as entregas.");
    return body as DeliveryPage;
  }

  async function load(cursor?: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const page = await read(cursor);
      setData(previous => ({ ...page, items: cursor && previous ? [...previous.items, ...page.items.filter(item => !previous.items.some(existing => existing.id === item.id))] : page.items }));
      if (!cursor) setRetryLocked(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível consultar as entregas.");
    } finally { setBusy(false); }
  }

  async function retry() {
    if (!selected || busy || retryLocked) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    // Uma resposta perdida do POST exige releitura, nunca repetição cega.
    setRetryLocked(true);
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, expectedUpdatedAt: selected.updatedAt }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Não foi possível recuperar a entrega.");
      setNotice("Entrega recolocada na fila. Isso ainda não confirma o envio.");
      setSelected(null);
      setData(await read());
      setRetryLocked(false);
    } catch (cause) {
      setError(`${cause instanceof Error ? cause.message : "Não foi possível confirmar a operação."} Atualize a lista antes de uma nova tentativa.`);
      setSelected(null);
    } finally { setBusy(false); }
  }

  return <section className="space-y-4" aria-labelledby="slack-deliveries-title" aria-busy={busy}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h2 id="slack-deliveries-title" className="text-ui-section">Entregas no Slack</h2>
        <p className="max-w-prose text-balance text-sm text-muted-foreground">Consulte falhas e confirmações desta empresa. Horários de Brasília.</p>
      </div>
      <Button variant="secondary" disabled={busy} onClick={() => void load()}>{busy ? "Consultando…" : data ? "Atualizar" : "Consultar entregas"}</Button>
    </div>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    {notice ? <p role="status" className="text-sm text-muted-foreground">{notice}</p> : null}
    {data ? <>
      <Table variant="operational" aria-label="Entregas no Slack">
        <TableHeader><TableRow><TableHead>Recebido em</TableHead><TableHead>Origem</TableHead><TableHead>Situação</TableHead><TableHead>Tentativas</TableHead><TableHead>Acompanhamento</TableHead></TableRow></TableHeader>
        <TableBody>
          {data.items.map(item => <TableRow key={item.id}>
            <TableCell className="whitespace-nowrap tabular-nums">{dateFormatter.format(new Date(item.receivedAt))}</TableCell>
            <TableCell><p>{item.source === "rotina" ? "Rotina" : "Consulta"}</p><p className="text-xs text-muted-foreground">{item.channel ?? "Canal não definido"}</p></TableCell>
            <TableCell>{item.status === "concluido" && !item.deliveredTs ? "Encerrado sem envio" : labels[item.status] ?? "Não reconhecido"}</TableCell>
            <TableCell className="tabular-nums">{item.attempts}</TableCell>
            <TableCell className="min-w-64 max-w-md whitespace-normal py-3">
              <p className="text-sm text-muted-foreground">{recoveryText(item)}</p>
              {item.errorCode ? <p className="mt-1 text-xs text-muted-foreground">Código: {item.errorCode}</p> : null}
              {item.deliveredTs ? <p className="mt-1 text-xs text-muted-foreground tabular-nums">Confirmação: {item.deliveredTs}</p> : null}
              {item.status === "falhou" && !item.retryable ? <Button className="mt-2" size="sm" variant="secondary" disabled={busy || retryLocked} onClick={() => setSelected(item)}>Recuperar entrega</Button> : null}
            </TableCell>
          </TableRow>)}
          {data.items.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhuma entrega registrada para esta empresa.</TableCell></TableRow> : null}
        </TableBody>
      </Table>
      {data.nextCursor ? <Button variant="secondary" disabled={busy} onClick={() => void load(data.nextCursor ?? undefined)}>Carregar anteriores</Button> : null}
    </> : null}
    <Dialog open={!!selected} onOpenChange={open => { if (!open && !busy) setSelected(null); }}>
      <DialogContent>
        <DialogTitle>Recuperar entrega com falha?</DialogTitle>
        <DialogDescription>Confirme que a causa foi corrigida no workspace desta empresa. A entrega será recolocada na fila e poderá enviar a resposta no Slack. Envios incertos não podem ser recuperados por aqui.</DialogDescription>
        <DialogFooter>
          <Button variant="secondary" disabled={busy} onClick={() => setSelected(null)}>Cancelar</Button>
          <Button disabled={busy || retryLocked} onClick={() => void retry()}>{busy ? "Recuperando…" : "Causa corrigida, recuperar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>;
}
