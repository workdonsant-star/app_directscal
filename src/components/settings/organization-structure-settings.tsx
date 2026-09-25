"use client";

import { Loader2, Mail, MoreHorizontal, Plus, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type {
  LeadershipInviteDisplayStatus,
  OrganizationSector,
} from "@/lib/types";

type OrganizationStructureSettingsProps = {
  sectors: OrganizationSector[];
};

type Draft = {
  accessLevel: "owner" | "admin";
  leaderEmail: string;
  leaderPosition: string;
  name: string;
};

type Notice = {
  message: string;
  tone: "error" | "success";
};

const emptyDraft: Draft = {
  accessLevel: "admin",
  leaderEmail: "",
  leaderPosition: "",
  name: "",
};

const accessLabels = {
  admin: "Admin",
  owner: "Superadmin",
} as const;
const accessItems = [
  { label: accessLabels.admin, value: "admin" },
  { label: accessLabels.owner, value: "owner" },
];

const statusLabels: Record<LeadershipInviteDisplayStatus, string> = {
  ativo: "Confirmado",
  convite_enviado: "Convite enviado",
  convite_pendente: "Envio pendente",
  envio_falhou: "Falha no envio",
  inativo: "Inativo",
};

function StatusBadge({ status }: { status: LeadershipInviteDisplayStatus }) {
  return (
    <Badge
      variant={status === "envio_falhou" ? "destructive" : "outline"}
      className={
        status === "ativo"
          ? "border-transparent bg-primary/10 text-primary"
          : undefined
      }
    >
      {statusLabels[status]}
    </Badge>
  );
}

function LeaderIdentity({ sector }: { sector: OrganizationSector }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar size="sm">
        {sector.leader.avatarUrl ? (
          <AvatarImage src={sector.leader.avatarUrl} alt="" />
        ) : null}
        <AvatarFallback>
          {sector.leader.name?.charAt(0).toLocaleUpperCase("pt-BR") || (
            <Mail className="size-3" aria-hidden="true" />
          )}
        </AvatarFallback>
      </Avatar>
      <span
        className={
          sector.leader.name
            ? "truncate font-medium"
            : "truncate text-muted-foreground"
        }
      >
        {sector.leader.name ?? "Aguardando confirmação"}
      </span>
    </div>
  );
}

export function OrganizationStructureSettings({
  sectors,
}: OrganizationStructureSettingsProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [resendingSectorId, setResendingSectorId] = useState<string | null>(null);

  function updateDraft(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setNotice(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setNotice(null);

    const response = await fetch("/api/settings/sectors", {
      body: JSON.stringify(draft),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }).catch(() => null);
    const body = response
      ? ((await response.json().catch(() => null)) as {
          message?: string;
          persisted?: boolean;
        } | null)
      : null;

    setIsSaving(false);

    if (!response?.ok) {
      const message =
        body?.message ?? "Não foi possível cadastrar o setor e a liderança.";

      if (body?.persisted) {
        setDraft(emptyDraft);
        setIsOpen(false);
        setNotice({ message, tone: "error" });
        router.refresh();
        return;
      }

      setNotice({ message, tone: "error" });
      return;
    }

    setDraft(emptyDraft);
    setIsOpen(false);
    setNotice({
      message: "Setor cadastrado e convite enviado.",
      tone: "success",
    });
    router.refresh();
  }

  async function handleResend(sectorId: string) {
    setResendingSectorId(sectorId);
    setNotice(null);

    const response = await fetch(
      `/api/settings/sectors/${sectorId}/resend`,
      { method: "POST" },
    ).catch(() => null);
    const body = response
      ? ((await response.json().catch(() => null)) as {
          message?: string;
        } | null)
      : null;

    setResendingSectorId(null);
    setNotice({
      message:
        body?.message ??
        (response?.ok
          ? "Convite reenviado."
          : "Não foi possível reenviar o convite."),
      tone: response?.ok ? "success" : "error",
    });
    router.refresh();
  }

  return (
    <section className="grid min-w-0 gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">Setores e lideranças</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Cadastre a estrutura que será usada para distribuir os convites e,
            no futuro, direcionar os action points do diagnóstico.
          </p>
        </div>
        <Button type="button" onClick={() => setIsOpen(true)}>
          <Plus aria-hidden="true" />
          Adicionar setor
        </Button>
      </div>

      {notice ? (
        <p
          aria-live="polite"
          className={
            notice.tone === "error"
              ? "text-sm text-destructive"
              : "text-sm text-foreground"
          }
        >
          {notice.message}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-[5px] ring-1 ring-foreground/10">
        <Table className="min-w-[1040px] table-fixed">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="h-11 w-[180px] px-4">Setor</TableHead>
              <TableHead className="h-11 w-[220px] px-4">Liderança</TableHead>
              <TableHead className="h-11 w-[240px] px-4">E-mail</TableHead>
              <TableHead className="h-11 w-[180px] px-4">Cargo</TableHead>
              <TableHead className="h-11 w-[140px] px-4">Acesso</TableHead>
              <TableHead className="h-11 w-[150px] px-4">Situação</TableHead>
              <TableHead className="h-11 w-[60px] px-4">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sectors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-28 px-4 text-center text-muted-foreground"
                >
                  Nenhum setor cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              sectors.map((sector) => (
                <TableRow key={sector.id}>
                  <TableCell className="px-4 py-4 font-medium">
                    {sector.name}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <LeaderIdentity sector={sector} />
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {sector.leader.email}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {sector.leader.position}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    {accessLabels[sector.leader.accessLevel]}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <StatusBadge status={sector.inviteStatus} />
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right">
                    {sector.inviteStatus === "ativo" ||
                    sector.inviteStatus === "inativo" ? null : (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label={`Ações do setor ${sector.name}`}
                              disabled={resendingSectorId === sector.id}
                            />
                          }
                        >
                          {resendingSectorId === sector.id ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <MoreHorizontal />
                          )}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleResend(sector.id)}
                          >
                            <RotateCw />
                            Reenviar convite
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="data-[side=right]:!w-[min(100vw,34rem)] data-[side=right]:!max-w-none">
          <SheetHeader className="border-b pr-12">
            <SheetTitle>Adicionar setor</SheetTitle>
            <SheetDescription>
              Registre o setor e a pessoa responsável por sua liderança.
            </SheetDescription>
          </SheetHeader>

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
            <div className="grid gap-5 overflow-y-auto p-5">
              <div className="grid gap-2">
                <label htmlFor="sector-name" className="text-sm font-medium">
                  Nome do setor
                </label>
                <Input
                  id="sector-name"
                  value={draft.name}
                  maxLength={120}
                  placeholder="Ex.: Copywriting"
                  required
                  onChange={(event) => updateDraft("name", event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="leader-email" className="text-sm font-medium">
                  E-mail da liderança
                </label>
                <Input
                  id="leader-email"
                  type="email"
                  value={draft.leaderEmail}
                  maxLength={254}
                  placeholder="nome@gmail.com"
                  required
                  onChange={(event) =>
                    updateDraft("leaderEmail", event.target.value)
                  }
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  Aceitamos qualquer conta Google. O nome e a foto serão
                  preenchidos depois que a pessoa confirmar o convite.
                </p>
              </div>

              <div className="grid gap-2">
                <label htmlFor="leader-position" className="text-sm font-medium">
                  Cargo
                </label>
                <Input
                  id="leader-position"
                  value={draft.leaderPosition}
                  maxLength={120}
                  placeholder="Ex.: Head de Copywriting"
                  required
                  onChange={(event) =>
                    updateDraft("leaderPosition", event.target.value)
                  }
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="leader-access" className="text-sm font-medium">
                  Nível de acesso
                </label>
                <Select
                  items={accessItems}
                  value={draft.accessLevel}
                  onValueChange={(value) =>
                    updateDraft("accessLevel", value as Draft["accessLevel"])
                  }
                >
                  <SelectTrigger id="leader-access" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Superadmin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs leading-5 text-muted-foreground">
                  {draft.accessLevel === "owner"
                    ? "Acesso completo, incluindo configurações e contratos da empresa."
                    : "Acesso às funcionalidades da empresa, sem configurações e contratos."}
                </p>
              </div>

              {notice?.tone === "error" && isOpen ? (
                <p className="text-sm text-destructive" aria-live="polite">
                  {notice.message}
                </p>
              ) : null}
            </div>

            <SheetFooter className="border-t sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : <Mail />}
                {isSaving ? "Enviando" : "Salvar e enviar convite"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </section>
  );
}
