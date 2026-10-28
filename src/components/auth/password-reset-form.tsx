"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completePasswordResetSchema, recoveryTokenSchema } from "@/lib/contracts/password-recovery";

export function PasswordResetForm() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""), [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null), [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false), [completed, setCompleted] = useState(false);
  const codeRead = useRef(false);
  useEffect(() => {
    if (codeRead.current) return;
    codeRead.current = true;
    const code = new URLSearchParams(window.location.hash.slice(1)).get("codigo");
    // O fragmento existe somente no navegador e é removido após a leitura inicial.
    setToken(code && recoveryTokenSchema.safeParse(code).success ? code : null);
    if (code !== null) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      // Sincroniza o erro com o fragmento inicial, que não existe no servidor.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!recoveryTokenSchema.safeParse(code).success) setError("Link de recuperação inválido. Solicite novas instruções.");
    }
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setMessage(null);
    if (token && !completePasswordResetSchema.safeParse({ token, password, confirmation }).success) { setError("Use uma senha de 12 a 128 caracteres e confirme com o mesmo valor."); return; }
    setPending(true);
    try {
      const response = await fetch(token ? "/api/auth/reset-password/complete" : "/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(token ? { token, password, confirmation } : { email }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? "Não foi possível processar a solicitação.");
      if (token) { setPassword(""); setConfirmation(""); setToken(null); setCompleted(true); }
      setMessage(body?.message ?? "Solicitação recebida.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível processar a solicitação. Tente novamente."); }
    finally { setPending(false); }
  }
  if (token === undefined) return <p role="status" className="text-sm text-muted-foreground">Preparando a recuperação…</p>;
  if (completed) return <div className="space-y-5"><p role="status" className="text-sm">{message}</p><Button type="button" variant="link" onClick={() => void signOut({ callbackUrl: "/entrar" })}>Entrar com a nova senha</Button></div>;
  return <form className="grid gap-5" onSubmit={submit}>
    {token ? <>
      <div className="space-y-2"><label htmlFor="reset-password" className="text-sm font-medium">Nova senha</label><Input id="reset-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} required disabled={pending} className="h-[45px] px-2.5 text-sm md:text-sm" /></div>
      <div className="space-y-2"><label htmlFor="reset-password-confirmation" className="text-sm font-medium">Confirme a nova senha</label><Input id="reset-password-confirmation" type="password" autoComplete="new-password" maxLength={128} value={confirmation} onChange={event => setConfirmation(event.target.value)} required disabled={pending} className="h-[45px] px-2.5 text-sm md:text-sm" /></div>
      <p className="text-xs text-muted-foreground">O link funciona uma única vez, em até uma hora da solicitação. Após alterar, entre novamente.</p>
    </> : <>
      <div><label htmlFor="email" className="sr-only">E-mail</label><Input id="email" type="email" autoComplete="email" placeholder="Digite seu e-mail" value={email} onChange={event => setEmail(event.target.value)} required disabled={pending} maxLength={320} className="h-[45px] px-2.5 text-sm md:text-sm" /></div>
      <p className="text-xs leading-[18px] text-muted-foreground">Para uma conta com senha cadastrada, solicite as instruções por e-mail. Se você usa Google, entre pelo botão Entrar com Google e gerencie a senha na sua conta Google.</p>
    </>}
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    {message ? <p role="status" className="text-sm">{message}</p> : null}
    <Button type="submit" size="lg" className="h-[45px] w-full text-sm font-medium" disabled={pending}>{pending ? "Processando" : token ? "Salvar nova senha" : "Enviar instruções"}</Button>
    {token ? <button type="button" className="text-left text-xs underline underline-offset-4" disabled={pending} onClick={() => { setToken(null); setPassword(""); setConfirmation(""); setError(null); setMessage(null); }}>Link expirado ou indisponível? Solicitar outro</button> : null}
    <p className="text-xs leading-[18px] text-muted-foreground"><Link href="/entrar" className="rounded-sm text-foreground/80 underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring">Voltar para entrada</Link></p>
  </form>;
}
