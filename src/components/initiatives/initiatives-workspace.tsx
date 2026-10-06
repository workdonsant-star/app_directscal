"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppTopbarActionsPortal } from "@/components/app-topbar-actions-portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  initiativeKinds,
  initiativeStatuses,
  useInitiatives,
  type Initiative,
} from "@/lib/initiatives/storage";
import { initiativeIcons } from "./initiative-navigation";

const blank: Initiative = {
  id: "",
  title: "",
  kind: "website",
  objective: "",
  owner: "",
  deadline: "",
  status: "planejada",
};

export function InitiativeForm({
  initial,
  onSave,
}: {
  initial: Initiative;
  onSave: (item: Initiative) => void;
}) {
  const [draft, setDraft] = useState(initial);
  return (
    <form
      id="initiative-form"
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const titleInput =
          event.currentTarget.querySelector<HTMLInputElement>(
            "#initiative-title",
          );
        if (draft.title.trim().length < 3) {
          titleInput?.setCustomValidity("Use pelo menos 3 caracteres no nome.");
          titleInput?.reportValidity();
          return;
        }
        onSave({
          ...draft,
          title: draft.title.trim(),
          owner: draft.owner.trim(),
          objective: draft.objective.trim(),
        });
      }}
    >
      <div className="space-y-2">
        <label htmlFor="initiative-title" className="text-sm font-medium">
          Nome da iniciativa
        </label>
        <Input
          id="initiative-title"
          required
          minLength={3}
          maxLength={120}
          value={draft.title}
          onChange={(e) => {
            e.currentTarget.setCustomValidity("");
            setDraft({ ...draft, title: e.target.value });
          }}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["kind", "Tipo", initiativeKinds],
            ["status", "Status", initiativeStatuses],
          ] as const
        ).map(([field, label, options]) => (
          <div key={field} className="space-y-2">
            <label
              id={`initiative-${field}-label`}
              className="text-sm font-medium"
            >
              {label}
            </label>
            <Select
              value={draft[field]}
              items={Object.entries(options).map(([value, text]) => ({
                value,
                label: text,
              }))}
              onValueChange={(value) => {
                if (value && value in options)
                  setDraft({ ...draft, [field]: value });
              }}
            >
              <SelectTrigger
                aria-labelledby={`initiative-${field}-label`}
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(options).map(([value, text]) => (
                  <SelectItem key={value} value={value}>
                    {text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <label htmlFor="initiative-objective" className="text-sm font-medium">
          Objetivo
        </label>
        <textarea
          id="initiative-objective"
          maxLength={1200}
          rows={4}
          value={draft.objective}
          onChange={(e) => setDraft({ ...draft, objective: e.target.value })}
          placeholder="Qual resultado esta iniciativa deve produzir?"
          className="w-full rounded-md border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="initiative-owner" className="text-sm font-medium">
            Responsável
          </label>
          <Input
            id="initiative-owner"
            maxLength={120}
            value={draft.owner}
            onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="initiative-deadline" className="text-sm font-medium">
            Prazo
          </label>
          <Input
            id="initiative-deadline"
            type="date"
            value={draft.deadline}
            onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">Salvar iniciativa</Button>
      </div>
    </form>
  );
}

export function InitiativesWorkspace({ scope }: { scope: string }) {
  const { initiatives, save } = useInitiatives(scope);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  function persist(item: Initiative) {
    const next = item.id
      ? initiatives.map((current) => (current.id === item.id ? item : current))
      : [...initiatives, { ...item, id: crypto.randomUUID() }];
    if (save(next)) {
      setCreating(false);
      setNotice("Iniciativa salva.");
    } else
      setNotice(
        "Não foi possível salvar. Verifique se o navegador permite armazenamento local.",
      );
  }
  const filtered = initiatives.filter((item) =>
    `${item.title} ${item.owner}`
      .toLocaleLowerCase("pt-BR")
      .includes(query.toLocaleLowerCase("pt-BR")),
  );
  return (
    <section className="space-y-6">
      <AppTopbarActionsPortal>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Nova iniciativa
        </Button>
      </AppTopbarActionsPortal>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Iniciativas</h1>
        <p className="text-sm text-muted-foreground">
          Organize as frentes de trabalho, responsáveis e prazos.
        </p>
      </div>
      <Input
        type="search"
        aria-label="Buscar iniciativas"
        placeholder="Buscar iniciativa ou responsável"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />
      <div className="min-w-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Iniciativa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Prazo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => {
              const Icon = initiativeIcons[item.kind];
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/iniciativas/${item.id}`}
                      className="flex items-center gap-2 rounded-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      {item.title}
                    </Link>
                  </TableCell>
                  <TableCell>{initiativeStatuses[item.status]}</TableCell>
                  <TableCell>{item.owner || "A definir"}</TableCell>
                  <TableCell className="tabular-nums">
                    {item.deadline
                      ? item.deadline.split("-").reverse().join("/")
                      : "A definir"}
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  {query
                    ? "Nenhuma iniciativa encontrada."
                    : "Crie sua primeira iniciativa para organizar a execução."}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {notice}
      </p>
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Nova iniciativa</DialogTitle>
            <DialogDescription>
              Defina a frente de trabalho e o resultado esperado.
            </DialogDescription>
          </DialogHeader>
          <InitiativeForm initial={blank} onSave={persist} />
          <p role="status" className="text-sm text-muted-foreground">
            {notice}
          </p>
        </DialogContent>
      </Dialog>
    </section>
  );
}
