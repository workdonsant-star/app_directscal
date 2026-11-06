"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AuthLegalNotice } from "@/components/auth/auth-legal-notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DemoAuth({ mode }: { mode: "login" | "signup" | "reset" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "reset") {
      setMessage("Se esta fosse uma conta operacional, as instruções seriam enviadas por e-mail. Nenhuma mensagem foi enviada nesta demo.");
      return;
    }
    if (mode === "signup") {
      if (!name.trim()) return;
      setMessage("Cadastro simulado. Nenhuma conta foi criada.");
      return;
    }
    router.push(email.toLowerCase() === "admin@directscal.example" ? "/demo/admin" : "/demo");
  }

  if (mode === "login") return <AuthPageShell title={<>Acesse sua estrutura<br />de gestão agentica</>} visualVariant="login">
    <div className="grid gap-5">
      <Button type="button" variant="outline" size="lg" className="h-[45px] w-full gap-2.5 bg-secondary text-sm font-normal" onClick={() => router.push("/demo")}><Image src="/auth-figma-google.svg" alt="" width={18} height={18} className="size-4" aria-hidden="true" />Entrar com Google (simulação)</Button>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-xs text-foreground/80 dark:text-muted-foreground"><div className="h-px bg-border" /><span>ou</span><div className="h-px bg-border" /></div>
      <form onSubmit={submit} className="grid gap-5">
        <label className="sr-only" htmlFor="demo-login-email">E-mail</label><Input id="demo-login-email" type="email" autoComplete="email" className="h-[45px]" placeholder="Digite seu e-mail" value={email} onChange={event => setEmail(event.target.value)} required />
        <label className="sr-only" htmlFor="demo-login-password">Senha</label><Input id="demo-login-password" type="password" autoComplete="off" className="h-[45px]" placeholder="Digite sua senha" value={password} onChange={event => setPassword(event.target.value)} required />
        <Button type="submit" size="lg" className="h-[45px] w-full">Entrar na demo</Button>
      </form>
      <div className="flex flex-wrap justify-between gap-2 text-xs"><Link href="/demo/recuperar-senha" className="underline underline-offset-2">Esqueceu a senha?</Link><Link href="/demo/criar-conta" className="underline underline-offset-2">Criar conta</Link></div>
      <p className="text-xs text-muted-foreground">Use admin@directscal.example para a visão de superadmin ou outro e-mail para a visão de cliente. A senha não é verificada nem armazenada.</p>
      <AuthLegalNotice />
    </div>
  </AuthPageShell>;

  return <AuthPageShell title={mode === "reset" ? "Recupere o acesso" : "Crie seu acesso"} description={mode === "reset" ? "Informe o e-mail da conta para iniciar a recuperação de senha." : "Registre uma conta para navegar pela operação mockada de Maturidade."} visualVariant="app">
    <form onSubmit={submit} className="grid gap-4">
      {mode === "signup" ? <div className="grid gap-2"><label htmlFor="demo-signup-name" className="text-sm font-medium">Nome</label><Input id="demo-signup-name" value={name} onChange={event => setName(event.target.value)} required /></div> : null}
      <div className="grid gap-2"><label htmlFor="demo-auth-email" className="text-sm font-medium">E-mail</label><Input id="demo-auth-email" type="email" value={email} onChange={event => setEmail(event.target.value)} required /></div>
      {mode === "signup" ? <div className="grid gap-2"><label htmlFor="demo-signup-password" className="text-sm font-medium">Senha</label><Input id="demo-signup-password" type="password" value={password} onChange={event => setPassword(event.target.value)} required /></div> : null}
      <Button type="submit">{mode === "reset" ? "Solicitar recuperação" : "Criar acesso de demonstração"}</Button>
      {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
      <Link href="/demo/entrar" className="text-sm underline underline-offset-2">Voltar para entrar</Link>
      <p className="text-xs text-muted-foreground">Fluxo ilustrativo, sem e-mail ou conta real.</p>
    </form>
  </AuthPageShell>;
}
