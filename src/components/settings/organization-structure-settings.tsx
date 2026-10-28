"use client";

import { useAppRuntime } from "@/components/app-runtime";

import { Check, Loader2, Plus, Search, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
type SlackWorkspaceUser = { userId: string; name: string; avatarUrl: string | null; position?: string | null };
import type { OrganizationSector } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = { sectors: OrganizationSector[]; inlineActions?: boolean };
type Draft = { name: string; slackUserId: string; position: string };
const emptyDraft: Draft = { name: "", slackUserId: "", position: "" };

export function OrganizationStructureSettings({ sectors, inlineActions = false }: Props) {
  const router = useRouter();
  const runtime = useAppRuntime();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [positionEdited, setPositionEdited] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<SlackWorkspaceUser[]>([]);
  const [search, setSearch] = useState("");
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ message: string; error: boolean } | null>(null);

  async function loadDirectory() {
    setIsLoading(true);
    setDirectoryError(null);
    setUsers([]);
    try {
      const response = await runtime.request("/api/settings/slack-users", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Não foi possível listar as pessoas do Slack.");
      setUsers(body.users);
    } catch (error) {
      setDirectoryError(error instanceof Error ? error.message : "Não foi possível listar as pessoas do Slack.");
    } finally {
      setIsLoading(false);
    }
  }

  function openDrawer() {
    setNotice(null);
    setSearch("");
    setIsOpen(true);
    void loadDirectory();
  }

  function selectPerson(user: SlackWorkspaceUser) {
    setDraft((current) => ({ ...current, slackUserId: user.userId, position: user.position ?? "" }));
    setPositionEdited(false);
    setNotice(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!users.some((user) => user.userId === draft.slackUserId)) return;
    setIsSaving(true);
    setNotice(null);
    try {
      const response = await runtime.request("/api/settings/sectors", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.name, slackUserId: draft.slackUserId, ...(positionEdited ? { position: draft.position } : {}) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Não foi possível salvar o setor e a liderança.");
      setDraft(emptyDraft);
      setPositionEdited(false);
      setIsOpen(false);
      setNotice({ message: "Setor e liderança salvos.", error: false });
      router.refresh();
    } catch (error) {
      setNotice({ message: error instanceof Error ? error.message : "Não foi possível salvar o setor e a liderança.", error: true });
    } finally {
      setIsSaving(false);
    }
  }

  const visibleUsers = users.filter((user) => `${user.name} ${user.position ?? ""}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
  const selected = users.find((user) => user.userId === draft.slackUserId);
  const Heading = inlineActions ? "h2" : "h1";
  const addButton = <Button type="button" variant={inlineActions ? "outline" : "default"} onClick={openDrawer}><Plus aria-hidden="true" />Adicionar setor</Button>;

  return (
    <section className="grid min-w-0 gap-5">
      {inlineActions ? <div>{addButton}</div> : <AppTopbarActionsPortal>{addButton}</AppTopbarActionsPortal>}
      <div>
        <Heading className="font-heading text-ui-page">Setores e lideranças</Heading>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Selecione as pessoas do Slack e defina o setor que cada uma lidera. O cargo é opcional.</p>
      </div>
      {notice && !isOpen ? <p role="status" className={cn("text-sm", notice.error && "text-destructive")}>{notice.message}</p> : null}
      <Table variant="operational" className="min-w-[640px]">
        <TableHeader><TableRow><TableHead>Setor</TableHead><TableHead>Liderança</TableHead><TableHead>Cargo</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader>
        <TableBody>
          {!sectors.length ? <TableRow><TableCell colSpan={4} className="h-28 text-center text-muted-foreground">Nenhum setor cadastrado.</TableCell></TableRow> : sectors.map((sector) => (
            <TableRow key={sector.id}>
              <TableCell className="font-medium">{sector.name}</TableCell>
              <TableCell><div className="flex items-center gap-3"><Avatar size="sm">{sector.leader.avatarUrl ? <AvatarImage src={sector.leader.avatarUrl} alt="" /> : null}<AvatarFallback>{(sector.leader.name ?? sector.leader.email).charAt(0).toLocaleUpperCase("pt-BR") || <UsersRound className="size-3" />}</AvatarFallback></Avatar><span>{sector.leader.name ?? sector.leader.email}</span></div></TableCell>
              <TableCell className="text-muted-foreground">{sector.leader.position || "Não informado"}</TableCell>
              <TableCell><Badge variant="outline">{sector.leader.slackUserId ? sector.inviteStatus === "ativo" ? "Ativa no Slack" : "Indisponível no Slack" : "Cadastro anterior"}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Sheet open={isOpen} onOpenChange={(open) => { if (!isSaving) setIsOpen(open); }}>
        <SheetContent className="data-[side=right]:!w-[min(100vw,34rem)] data-[side=right]:!max-w-none">
          <SheetHeader className="border-b pr-12"><SheetTitle>Adicionar setor</SheetTitle><SheetDescription>Escolha a liderança no Slack e informe o setor. O cargo será preenchido quando estiver disponível no perfil.</SheetDescription></SheetHeader>
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
            <div className="grid gap-5 overflow-y-auto p-5">
              <fieldset className="grid min-w-0 gap-3" disabled={isSaving}>
                <legend className="mb-3 text-sm font-medium">Liderança no Slack</legend>
                <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input aria-label="Buscar pessoa no Slack" className="pl-9" placeholder="Buscar por nome ou cargo" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
                {isLoading ? <p role="status" className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden="true" />Buscando pessoas do Slack</p> : directoryError ? <div className="grid justify-items-start gap-2"><p role="alert" className="text-sm text-destructive">{directoryError}</p><Button type="button" variant="outline" onClick={loadDirectory}>Tentar novamente</Button></div> : <div className="max-h-64 overflow-y-auto rounded-md border" role="radiogroup" aria-label="Pessoas do Slack">{visibleUsers.length ? visibleUsers.map((user) => (
                  <label key={user.userId} className={cn("flex cursor-pointer items-center gap-3 border-b px-3 py-3 last:border-b-0 focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring", draft.slackUserId === user.userId && "bg-muted")}>
                    <input type="radio" className="sr-only" name="slack-leader" value={user.userId} checked={draft.slackUserId === user.userId} onChange={() => selectPerson(user)} aria-label={user.name} />
                    <Avatar size="sm">{user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}<AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{user.name}</span><span className="block truncate text-xs text-muted-foreground">{user.position || "Cargo não informado"}</span></span>
                    {draft.slackUserId === user.userId ? <Check className="size-4 shrink-0" aria-hidden="true" /> : null}
                  </label>
                )) : <p className="p-4 text-sm text-muted-foreground">{users.length ? "Nenhuma pessoa encontrada." : "Nenhuma pessoa ativa encontrada no Slack."}</p>}</div>}
              </fieldset>
              {selected ? <p className="text-sm">Liderança selecionada: <strong>{selected.name}</strong></p> : null}
              <div className="grid gap-2"><label htmlFor="leader-position" className="text-sm font-medium">Cargo <span className="font-normal text-muted-foreground">(opcional)</span></label><Input id="leader-position" value={draft.position} maxLength={120} disabled={isSaving || !selected} placeholder="Ex.: Head de operações" onChange={(event) => { setDraft((current) => ({ ...current, position: event.target.value })); setPositionEdited(true); }} /><p className="text-xs text-muted-foreground">Você pode ajustar o cargo para esta liderança.</p></div>
              <div className="grid gap-2"><label htmlFor="sector-name" className="text-sm font-medium">Setor da liderança</label><Input id="sector-name" value={draft.name} minLength={2} maxLength={120} required disabled={isSaving} placeholder="Ex.: Operações" onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></div>
              {notice?.error ? <p role="alert" className="text-sm text-destructive">{notice.message}</p> : null}
            </div>
            <SheetFooter className="border-t sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={isSaving} onClick={() => setIsOpen(false)}>Cancelar</Button><Button type="submit" disabled={isSaving || isLoading || !selected || draft.name.trim().length < 2}>{isSaving ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}{isSaving ? "Salvando" : "Salvar setor"}</Button></SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </section>
  );
}
