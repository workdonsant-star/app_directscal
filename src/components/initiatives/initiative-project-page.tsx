"use client";

import Link from "next/link";
import { useState } from "react";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useInitiatives, type Initiative } from "@/lib/initiatives/storage";
import { InitiativeForm } from "./initiatives-workspace";
import { ProjectWorkspace } from "./project-workspace";

export function InitiativeProjectPage({
  id,
  scope,
  userName,
}: {
  id: string;
  scope: string;
  userName: string;
}) {
  const { initiatives, save } = useInitiatives(scope);
  const initiative = initiatives.find((item) => item.id === id);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  function persist(item: Initiative) {
    if (
      save(
        initiatives.map((current) => (current.id === item.id ? item : current)),
      )
    ) {
      setEditing(false);
      setNotice("");
    } else
      setNotice(
        "Não foi possível salvar. Verifique se o navegador permite armazenamento local.",
      );
  }
  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Iniciativas", href: "/iniciativas" },
          { label: initiative?.title ?? "Detalhe" },
        ]}
      />
      <AppPage>
        {initiative ? (
          <ProjectWorkspace
            key={`${scope}:${id}`}
            initiative={initiative}
            userName={userName}
            onEdit={() => setEditing(true)}
          />
        ) : (
          <section className="space-y-3">
            <h1 className="text-2xl font-semibold">
              Iniciativa não encontrada
            </h1>
            <Link
              href="/iniciativas"
              className="text-sm text-primary underline"
            >
              Voltar para iniciativas
            </Link>
          </section>
        )}
      </AppPage>
      {initiative && (
        <Dialog open={editing} onOpenChange={setEditing}>
          <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar projeto</DialogTitle>
              <DialogDescription>
                Atualize o objetivo, o responsável e o prazo desta iniciativa.
              </DialogDescription>
            </DialogHeader>
            <InitiativeForm
              key={JSON.stringify(initiative)}
              initial={initiative}
              onSave={persist}
            />
            <p role="status" className="text-sm text-destructive">
              {notice}
            </p>
            <DialogClose render={<Button variant="ghost" />}>
              Cancelar
            </DialogClose>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
