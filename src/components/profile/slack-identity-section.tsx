"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SlackIdentityStatus } from "@/lib/contracts/slack-identity";

export function SlackIdentitySection({ initial }: { initial: SlackIdentityStatus }) {
  const [status, setStatus] = useState(initial);
  const [challenge, setChallenge] = useState<{ command: string; expiresAt: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  async function refresh() {
    const response = await fetch("/api/profile/slack-identity", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message ?? "Não foi possível verificar a confirmação.");
    setStatus(body);
    if (body.connected) setChallenge(null);
    return body as SlackIdentityStatus;
  }
  async function run(operation: "start" | "refresh" | "unlink") {
    setBusy(true); setNotice(null);
    try {
      if (operation === "refresh") {
        const current = await refresh();
        setNotice(current.connected ? "Identidade confirmada nos dois canais." : "A confirmação ainda não foi recebida. Envie o código na conversa privada com o DirectScal.");
      } else {
        setChallenge(null);
        const response = await fetch("/api/profile/slack-identity", { method: operation === "start" ? "POST" : "DELETE", headers: { "Content-Type": "application/json" }, body: "{}" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.message ?? "Não foi possível atualizar sua identidade.");
        if (operation === "start") setChallenge(body);
        else { setConfirmUnlink(false); await refresh(); setNotice("Identidade desvinculada. As conversas anteriores foram preservadas."); }
      }
    } catch (error) { setNotice(error instanceof Error ? error.message : "Não foi possível concluir. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <section className="grid min-w-0 gap-4 border-t pt-6" aria-labelledby="slack-identity-title">
    <div>
      <h2 id="slack-identity-title" className="text-ui-title">Identidade no Slack</h2>
      <p className="mt-1 text-sm text-muted-foreground">Confirme o vínculo entre sua conta no app e seu perfil no Slack para evitar contagem duplicada nos indicadores de uso.</p>
    </div>
    {!status.available ? <p className="text-sm text-muted-foreground">O Slack da empresa precisa estar conectado. Peça ao responsável pela conta para conferir a conexão.</p> : status.connected ? <>
      <p className="text-sm">Identidade confirmada{status.workspace ? ` em ${status.workspace}` : " no Slack"}.</p>
      {confirmUnlink ? <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">Desvincular interrompe a conciliação entre os canais. As conversas e os registros anteriores permanecem.</p>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => run("unlink")}>Confirmar desvinculação</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => setConfirmUnlink(false)}>Cancelar</Button></div>
      </div> : <Button type="button" variant="outline" className="w-fit" disabled={busy} onClick={() => setConfirmUnlink(true)}>Desvincular identidade</Button>}
    </> : <>
      <div><Button type="button" variant="outline" disabled={busy} onClick={() => run("start")}>{busy ? "Aguarde" : challenge ? "Gerar novo código" : "Gerar código de confirmação"}</Button></div>
      {challenge && <div className="grid min-w-0 gap-3">
        <label htmlFor="slack-identity-command" className="text-sm font-medium">Envie esta mensagem ao DirectScal em uma conversa privada no Slack</label>
        <Input id="slack-identity-command" readOnly value={challenge.command} className="font-mono text-xs" onFocus={event => event.target.select()} />
        <p className="text-sm text-muted-foreground">O código vale por dez minutos. Compartilhe somente com o bot da sua empresa, em mensagem privada. Depois, verifique a confirmação abaixo.</p>
        <Button type="button" variant="outline" className="w-fit" disabled={busy} onClick={() => run("refresh")}>Verificar confirmação</Button>
      </div>}
    </>}
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
  </section>;
}
