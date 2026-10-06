"use client";

import {
  Archive,
  ArchiveRestore,
  Camera,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { type ChangeEvent, type FormEvent, useRef, useState } from "react";

import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import type { AdminSpecialist } from "@/lib/contracts/admin-operations";
import { adminSpecialists } from "@/lib/data/admin-operations-data-source";

const acceptedProfilePhotoTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AdminSpecialistsWorkspace() {
  const [specialists, setSpecialists] = useState(adminSpecialists);
  const [open, setOpen] = useState(false);
  const [profileSpecialist, setProfileSpecialist] =
    useState<AdminSpecialist | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profilePhotoError, setProfilePhotoError] = useState<string | null>(null);
  const [specialistPhotos, setSpecialistPhotos] = useState<Record<string, string>>(
    {},
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [archivedIds, setArchivedIds] = useState(() => new Set<string>());
  const [showArchived, setShowArchived] = useState(false);
  const [specialistPendingDeletion, setSpecialistPendingDeletion] =
    useState<AdminSpecialist | null>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const visibleSpecialists = specialists.filter((specialist) =>
    showArchived
      ? archivedIds.has(specialist.id)
      : !archivedIds.has(specialist.id),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const title = String(form.get("title") ?? "").trim();
    const location = String(form.get("location") ?? "").trim();

    if (!name || !email || !title || !location) return;

    const specialist: AdminSpecialist = {
      id: `specialist_local_${Date.now()}`,
      name,
      email,
      title,
      location,
      status: "ativo",
      companyCount: 0,
      activeDeliveryCount: 0,
      createdAt: new Date().toISOString(),
    };

    setSpecialists((current) => [specialist, ...current]);
    setFeedback(`${name} foi adicionado à equipe nesta prévia.`);
    setOpen(false);
  }

  function toggleSpecialistStatus(specialist: AdminSpecialist) {
    const nextStatus = specialist.status === "ativo" ? "inativo" : "ativo";

    setSpecialists((current) =>
      current.map((item) =>
        item.id === specialist.id ? { ...item, status: nextStatus } : item,
      ),
    );
    setFeedback(
      nextStatus === "ativo"
        ? `Status de ${specialist.name} alterado para ativo. Novas atribuições estão liberadas nesta prévia.`
        : `Status de ${specialist.name} alterado para inativo. As atribuições atuais foram preservadas nesta prévia.`,
    );
  }

  function openSpecialistProfile(specialist: AdminSpecialist) {
    setProfileSpecialist(specialist);
    setProfilePhoto(specialistPhotos[specialist.id] ?? null);
    setProfilePhotoError(null);
  }

  function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!acceptedProfilePhotoTypes.has(file.type)) {
      setProfilePhotoError("Selecione uma foto em JPG, PNG ou WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfilePhotoError("A foto deve ter no máximo 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") return;
      setProfilePhoto(reader.result);
      setProfilePhotoError(null);
    });
    reader.addEventListener("error", () => {
      setProfilePhotoError("Não foi possível carregar a foto selecionada.");
    });
    reader.readAsDataURL(file);
  }

  function saveSpecialistProfile() {
    if (!profileSpecialist) return;

    setSpecialistPhotos((current) => {
      const next = { ...current };
      if (profilePhoto) next[profileSpecialist.id] = profilePhoto;
      else delete next[profileSpecialist.id];
      return next;
    });
    setFeedback(`Foto de ${profileSpecialist.name} atualizada nesta prévia.`);
    setProfileSpecialist(null);
  }

  function archiveSpecialist(specialist: AdminSpecialist) {
    setArchivedIds((current) => new Set(current).add(specialist.id));
    setFeedback(
      `${specialist.name} saiu da equipe ativa; o registro foi arquivado nesta prévia.`,
    );
  }

  function restoreSpecialist(specialist: AdminSpecialist) {
    setArchivedIds((current) => {
      const next = new Set(current);
      next.delete(specialist.id);
      return next;
    });
    setFeedback(`${specialist.name} voltou para a equipe de análise nesta prévia.`);
  }

  function deleteSpecialist() {
    if (!specialistPendingDeletion) return;

    const specialistName = specialistPendingDeletion.name;
    const specialistId = specialistPendingDeletion.id;
    setSpecialists((current) =>
      current.filter((specialist) => specialist.id !== specialistId),
    );
    setArchivedIds((current) => {
      const next = new Set(current);
      next.delete(specialistId);
      return next;
    });
    setSpecialistPendingDeletion(null);
    setFeedback(`${specialistName} foi excluído da equipe nesta prévia.`);
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <AppTopbarActionsPortal>
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus aria-hidden="true" />
          Adicionar especialista
        </Button>
      </AppTopbarActionsPortal>

      <section aria-labelledby="specialists-title" className="space-y-1">
        <h1 id="specialists-title" className="font-heading text-2xl font-semibold">
          Especialistas
        </h1>
        <p className="text-sm text-muted-foreground">
          Organize quem pode receber empresas e preparar entregas para os clientes.
        </p>
      </section>

      {feedback ? (
        <p
          role="status"
          className="rounded-lg border border-[var(--chart-positive)]/20 bg-[var(--chart-positive)]/10 px-3 py-2 text-sm text-[var(--chart-positive)]"
        >
          {feedback}
        </p>
      ) : null}

      <section className="flex flex-col gap-4" aria-labelledby="specialist-list-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 id="specialist-list-title" className="font-heading text-lg font-semibold">
              {showArchived ? "Especialistas arquivados" : "Equipe de análise"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {showArchived
                ? "Profissionais removidos da operação, disponíveis para restauração ou exclusão."
                : "Profissionais internos e a capacidade operacional atualmente atribuída."}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowArchived((current) => !current)}
          >
            {showArchived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
            {showArchived
              ? "Voltar para ativos"
              : `Arquivados (${archivedIds.size.toLocaleString("pt-BR")})`}
          </Button>
        </div>

        <div className="min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Especialista</TableHead>
                <TableHead>Área de atuação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Empresas</TableHead>
                <TableHead className="text-right">Entregas em andamento</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleSpecialists.map((specialist) => (
                <TableRow key={specialist.id}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar size="sm">
                        {specialistPhotos[specialist.id] ? (
                          <AvatarImage
                            src={specialistPhotos[specialist.id]}
                            alt={`Foto de ${specialist.name}`}
                          />
                        ) : null}
                        <AvatarFallback>{getInitials(specialist.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <button
                          type="button"
                          className="block max-w-full truncate text-left font-medium text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => openSpecialistProfile(specialist)}
                        >
                          {specialist.name}
                        </button>
                        <p className="truncate text-xs text-muted-foreground">
                          {specialist.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-foreground">{specialist.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {specialist.location}
                    </p>
                  </TableCell>
                  <TableCell>
                    {showArchived ? (
                      <Badge variant="outline">Arquivado</Badge>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={specialist.status === "ativo"}
                          onCheckedChange={() => toggleSpecialistStatus(specialist)}
                          aria-label={`${specialist.status === "ativo" ? "Desativar" : "Ativar"} ${specialist.name}`}
                        />
                        <AdminStatusBadge status={specialist.status} />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {specialist.companyCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {specialist.activeDeliveryCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Ações de ${specialist.name}`}
                          />
                        }
                      >
                        <MoreHorizontal aria-hidden="true" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => openSpecialistProfile(specialist)}>
                          <Pencil aria-hidden="true" />
                          Editar perfil
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {showArchived ? (
                          <DropdownMenuItem onClick={() => restoreSpecialist(specialist)}>
                            <ArchiveRestore aria-hidden="true" />
                            Restaurar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => archiveSpecialist(specialist)}>
                            <Archive aria-hidden="true" />
                            Arquivar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setSpecialistPendingDeletion(specialist)}
                        >
                          <Trash2 aria-hidden="true" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {visibleSpecialists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {showArchived
                      ? "Nenhum especialista arquivado."
                      : "Nenhum especialista disponível na equipe."}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </section>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="data-[side=right]:!w-[min(100vw,32rem)] data-[side=right]:!max-w-none">
          <SheetHeader className="border-b">
            <SheetTitle>Adicionar especialista</SheetTitle>
            <SheetDescription>
              Cadastre o profissional que poderá receber empresas e preparar entregas.
            </SheetDescription>
          </SheetHeader>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
            <div className="grid gap-5 overflow-y-auto p-4">
              <div className="grid gap-2">
                <label htmlFor="specialist-name" className="text-sm font-medium">
                  Nome
                </label>
                <Input id="specialist-name" name="name" required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="specialist-email" className="text-sm font-medium">
                  E-mail corporativo
                </label>
                <Input id="specialist-email" name="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="specialist-title" className="text-sm font-medium">
                  Área de atuação
                </label>
                <Input
                  id="specialist-title"
                  name="title"
                  placeholder="Ex.: Especialista em processos"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="specialist-location" className="text-sm font-medium">
                  Localização
                </label>
                <Input
                  id="specialist-location"
                  name="location"
                  placeholder="Cidade, UF"
                  required
                />
              </div>
              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                O acesso por convite e a persistência serão conectados na etapa funcional.
              </div>
            </div>

            <SheetFooter className="border-t sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Adicionar especialista</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet
        open={profileSpecialist !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setProfileSpecialist(null);
        }}
      >
        <SheetContent className="data-[side=right]:!w-[min(100vw,30rem)] data-[side=right]:!max-w-none">
          <SheetHeader className="border-b">
            <SheetTitle>Perfil do especialista</SheetTitle>
            <SheetDescription>
              Atualize a foto usada na equipe e nas atribuições internas.
            </SheetDescription>
          </SheetHeader>

          {profileSpecialist ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-6 overflow-y-auto p-4">
                <section className="flex items-center gap-4" aria-labelledby="profile-photo-title">
                  <Avatar className="size-20">
                    {profilePhoto ? (
                      <AvatarImage
                        src={profilePhoto}
                        alt={`Foto de ${profileSpecialist.name}`}
                      />
                    ) : null}
                    <AvatarFallback className="text-lg">
                      {getInitials(profileSpecialist.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-2">
                    <div>
                      <h3 id="profile-photo-title" className="font-medium text-foreground">
                        Foto de perfil
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG ou WebP, até 5 MB.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Input
                        ref={profilePhotoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={handleProfilePhotoChange}
                        aria-label={`Selecionar foto de ${profileSpecialist.name}`}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => profilePhotoInputRef.current?.click()}
                      >
                        <Camera aria-hidden="true" />
                        {profilePhoto ? "Trocar foto" : "Adicionar foto"}
                      </Button>
                      {profilePhoto ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setProfilePhoto(null);
                            setProfilePhotoError(null);
                          }}
                        >
                          Remover
                        </Button>
                      ) : null}
                    </div>
                    {profilePhotoError ? (
                      <p role="alert" className="text-xs text-destructive">
                        {profilePhotoError}
                      </p>
                    ) : null}
                  </div>
                </section>

                <section className="border-t pt-5" aria-labelledby="profile-details-title">
                  <h3 id="profile-details-title" className="font-heading text-base font-medium">
                    Informações profissionais
                  </h3>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1 sm:col-span-2">
                      <dt className="text-xs text-muted-foreground">Nome</dt>
                      <dd className="font-medium text-foreground">
                        {profileSpecialist.name}
                      </dd>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <dt className="text-xs text-muted-foreground">E-mail corporativo</dt>
                      <dd className="break-all text-foreground">
                        {profileSpecialist.email}
                      </dd>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <dt className="text-xs text-muted-foreground">Área de atuação</dt>
                      <dd className="text-foreground">{profileSpecialist.title}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs text-muted-foreground">Localização</dt>
                      <dd className="text-foreground">{profileSpecialist.location}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs text-muted-foreground">Status</dt>
                      <dd>
                        <AdminStatusBadge status={profileSpecialist.status} />
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs text-muted-foreground">Empresas</dt>
                      <dd className="tabular-nums text-foreground">
                        {profileSpecialist.companyCount}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs text-muted-foreground">Entregas em andamento</dt>
                      <dd className="tabular-nums text-foreground">
                        {profileSpecialist.activeDeliveryCount}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>

              <SheetFooter className="border-t sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setProfileSpecialist(null)}
                >
                  Cancelar
                </Button>
                <Button type="button" onClick={saveSpecialistProfile}>
                  Salvar foto
                </Button>
              </SheetFooter>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog
        open={specialistPendingDeletion !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSpecialistPendingDeletion(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir especialista</DialogTitle>
            <DialogDescription>
              {specialistPendingDeletion
                ? `${specialistPendingDeletion.name} será removido da equipe. Esta ação não pode ser desfeita nesta prévia.`
                : "O especialista será removido da equipe."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" />}>
              Cancelar
            </DialogClose>
            <Button type="button" variant="destructive" onClick={deleteSpecialist}>
              Excluir especialista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
