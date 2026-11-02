"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppRuntime } from "@/components/app-runtime";
import { Search, Trash2 } from "lucide-react";

import { useAdminDataSnapshot } from "@/components/admin/use-admin-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { adminUpdatedEventName, type AdminDataSnapshot } from "@/lib/data/admin-snapshot";
import { companyDeletionResultSchema } from "@/lib/contracts/company-deletion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AdminCompaniesTable({
  initialSnapshot,
}: {
  initialSnapshot: AdminDataSnapshot;
}) {
  const { companies } = useAdminDataSnapshot(initialSnapshot);
  const runtime = useAppRuntime();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [deleteTargets, setDeleteTargets] = useState<Array<{ id: string; name: string }>>([]);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const visibleCompanies = companies
    .filter((company) => company.organizationId && !deletedIds.includes(company.id))
    .map((company) => ({ ...company, users: company.users ?? [] }));
  const normalizedSearch = search.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const filteredCompanies = visibleCompanies.filter((company) =>
    [company.name, ...company.users.flatMap((user) => [user.name ?? "", user.email])]
      .some((value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalizedSearch)),
  );
  const selectedCompanies = visibleCompanies.filter((company) => selectedIds.includes(company.id));
  const allSelected = filteredCompanies.length > 0 && filteredCompanies.every((company) => selectedIds.includes(company.id));

  async function handleDelete() {
    if (pending || confirmation !== "EXCLUIR") return;
    setPending(true);
    setError(null);
    let failureMessage = "Não foi possível confirmar a exclusão. Atualize a página antes de tentar novamente.";
    try {
      const response = await runtime.request("/api/admin/companies", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyIds: deleteTargets.map((company) => company.id), confirmation }),
      });
      const body = await response.json();
      if (!response.ok) {
        if (typeof body.message === "string") failureMessage = body.message;
        throw new Error(failureMessage);
      }
      const result = companyDeletionResultSchema.parse(body);
      setDeletedIds((current) => [...current, ...result.deletedCompanyIds]);
      setSelectedIds((current) => current.filter((id) => !result.deletedCompanyIds.includes(id)));
      setDeleteTargets([]);
      setConfirmation("");
      setNotice(`${result.deletedCompanyIds.length} ${result.deletedCompanyIds.length === 1 ? "empresa excluída" : "empresas excluídas"}. ${result.deletedUsers} ${result.deletedUsers === 1 ? "conta removida" : "contas removidas"}.${result.retainedUsers ? ` ${result.retainedUsers} ${result.retainedUsers === 1 ? "conta preservada" : "contas preservadas"} por vínculos fora da seleção.` : ""}`);
      window.dispatchEvent(new Event(adminUpdatedEventName));
    } catch {
      setError(failureMessage);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-ui-page">Empresas cadastradas</h1>
        <p className="text-sm text-muted-foreground">
          Empresas com conta criada no sistema. Abra uma empresa para acessar seus dados e ativos de gestão.
        </p>
      </div>

      <div className="relative w-full max-w-3xl">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Buscar empresa cadastrada"
          className="pl-10"
          placeholder="Buscar empresa, nome ou e-mail"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
      {selectedCompanies.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="tabular-nums">{selectedCompanies.length} de {visibleCompanies.length} selecionadas</span>
          <Button variant="destructive" size="sm" disabled={pending} onClick={() => {
            setDeleteTargets(selectedCompanies.map(({ id, name }) => ({ id, name })));
            setConfirmation(""); setError(null); setNotice(null);
          }}>
            <Trash2 aria-hidden="true" /> Excluir selecionadas ({selectedCompanies.length})
          </Button>
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => setSelectedIds([])}>Limpar seleção</Button>
          {visibleCompanies.length > 100 && <span>Até 100 empresas por exclusão.</span>}
        </div>
      )}

      <div className="min-w-0">
        <Table variant="operational">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  aria-label="Selecionar empresas exibidas"
                  checked={allSelected}
                  ref={(node) => { if (node) node.indeterminate = filteredCompanies.some((company) => selectedIds.includes(company.id)) && !allSelected; }}
                  disabled={pending || filteredCompanies.length === 0}
                  className="size-4 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) => setSelectedIds(event.target.checked
                    ? [...new Set([...selectedIds, ...filteredCompanies.slice(0, 100).map((company) => company.id)])].slice(0, 100)
                    : selectedIds.filter((id) => !filteredCompanies.some((company) => company.id === id)))}
                />
              </TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>E-mail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.map((company) => (
              <TableRow key={company.id} className="group relative cursor-pointer">
                <TableCell>
                  <input
                    type="checkbox"
                    aria-label={`Selecionar ${company.name}`}
                    checked={selectedIds.includes(company.id)}
                    disabled={pending || (!selectedIds.includes(company.id) && selectedCompanies.length >= 100)}
                    className="relative z-10 size-4 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, company.id] : current.filter((id) => id !== company.id))}
                  />
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  <Link
                    href={runtime.href(`/admin/empresas/${company.id}`)}
                    className="rounded-sm text-sm font-medium underline-offset-4 after:absolute after:inset-0 group-hover:underline focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                  >
                    {company.name}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-foreground">
                  {company.users.length ? company.users.map((user) => <div key={user.email}>{user.name ?? "Nome não informado"}</div>) : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {company.users.length ? company.users.map((user) => <div key={user.email}>{user.email}</div>) : "—"}
                </TableCell>
              </TableRow>
            ))}
            {filteredCompanies.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                  {visibleCompanies.length === 0 ? "Nenhuma empresa cadastrada até agora." : "Nenhuma empresa encontrada para esta busca."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={deleteTargets.length > 0} onOpenChange={(open) => { if (!open && !pending) setDeleteTargets([]); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {deleteTargets.length === 1 ? "empresa" : `${deleteTargets.length} empresas`} definitivamente?</DialogTitle>
            <DialogDescription>
              Os dados destas empresas serão apagados: usuários exclusivos, pesquisas e respostas, relatórios, ativos, rotinas, leads e integrações. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-32 list-disc overflow-y-auto pl-5 text-sm">
            {deleteTargets.map((company) => <li key={company.id}>{company.name}</li>)}
          </ul>
          <p className="text-sm text-muted-foreground">Contas com vínculos em outras empresas são preservadas. Contas e mensagens no Google ou Slack não são apagadas.</p>
          <div className="flex flex-col gap-2">
            <label htmlFor="company-delete-confirmation" className="text-sm">Digite <strong>EXCLUIR</strong> para confirmar</label>
            <Input id="company-delete-confirmation" value={confirmation} disabled={pending} autoComplete="off" onChange={(event) => setConfirmation(event.target.value)} />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => setDeleteTargets([])}>Cancelar</Button>
            <Button variant="destructive" disabled={pending || confirmation !== "EXCLUIR"} onClick={handleDelete}>
              {pending ? "Excluindo…" : "Excluir definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
