"use client";

import Link from "next/link";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import { useAdminData } from "@/components/admin/use-admin-data";
import { AdminDeliveryStatusBadge } from "@/components/admin/admin-delivery-status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { adminUpdatedEventName } from "@/lib/data/admin-data-source";
import { companyDeletionResultSchema } from "@/lib/contracts/company-deletion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminCompanyOperationsPreview } from "@/lib/data/admin-operations-data-source";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatEmployeeCount(value: number | null) {
  return value ? `${value.toLocaleString("pt-BR")} pessoas` : "Não informado";
}

export function AdminCompaniesTable() {
  const { companies, modules } = useAdminData();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [deleteTargets, setDeleteTargets] = useState<Array<{ id: string; name: string }>>([]);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const visibleCompanies = companies.filter((company) => !deletedIds.includes(company.id));
  const selectedCompanies = visibleCompanies.filter((company) => selectedIds.includes(company.id));
  const allSelected = visibleCompanies.length > 0 && selectedCompanies.length === visibleCompanies.length;

  async function handleDelete() {
    if (pending || confirmation !== "EXCLUIR") return;
    setPending(true);
    setError(null);
    let failureMessage = "Não foi possível confirmar a exclusão. Atualize a página antes de tentar novamente.";
    try {
      const response = await fetch("/api/admin/companies", {
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
  const moduleNameById = new Map(
    modules.map((module) => [module.id, module.shortName]),
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-ui-title text-foreground">
            Clientes cadastrados
          </h2>
          <p className="text-muted-foreground text-sm">
            Organizações com conta criada e histórico de aquisição associado.
          </p>
        </div>
        <div className="flex items-center gap-2">
        {selectedCompanies.length > 0 && (
          <Button variant="destructive" size="sm" disabled={pending} onClick={() => {
            setDeleteTargets(selectedCompanies.map(({ id, name }) => ({ id, name })));
            setConfirmation(""); setError(null); setNotice(null);
          }}>
            <Trash2 /> Excluir selecionadas ({selectedCompanies.length})
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/admin/leads" />}
        >
          Ver leads
        </Button>
        </div>
      </div>

      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
      {selectedCompanies.length > 0 && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="tabular-nums">{selectedCompanies.length} de {visibleCompanies.length} selecionadas</span>
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => setSelectedIds([])}>Limpar seleção</Button>
          {visibleCompanies.length > 100 && <span>Até 100 empresas por exclusão.</span>}
        </div>
      )}

      <div className="min-w-0">
        <Table variant="operational">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input type="checkbox" aria-label="Selecionar todas as empresas" checked={allSelected}
                  ref={(node) => { if (node) node.indeterminate = selectedCompanies.length > 0 && !allSelected; }}
                  disabled={pending || visibleCompanies.length === 0}
                  className="size-4 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) => setSelectedIds(event.target.checked ? visibleCompanies.slice(0, 100).map((company) => company.id) : [])} />
              </TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Especialista</TableHead>
              <TableHead>Entrega atual</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Acessos ativos</TableHead>
              <TableHead>Origens</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead className="text-right">Último lead</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleCompanies.map((company) => {
              const preview = getAdminCompanyOperationsPreview(company.name);
              const currentDelivery = preview.deliveries.find(
                (delivery) => delivery.status !== "publicada",
              );

              return (
              <TableRow key={company.id}>
                <TableCell>
                  <input type="checkbox" aria-label={`Selecionar ${company.name}`} checked={selectedIds.includes(company.id)}
                    disabled={pending || (!selectedIds.includes(company.id) && selectedCompanies.length >= 100)}
                    className="size-4 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, company.id] : current.filter((id) => id !== company.id))} />
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  <Link
                    href={`/admin/empresas/${company.id}`}
                    className="rounded-sm outline-none hover:underline hover:underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {company.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {preview.specialist?.name ?? "Não atribuído"}
                </TableCell>
                <TableCell>
                  {currentDelivery ? (
                    <AdminDeliveryStatusBadge status={currentDelivery.status} />
                  ) : (
                    <span className="text-muted-foreground">Sem entrega</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {company.companySize ?? formatEmployeeCount(company.employeeCount)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {company.moduleAccess
                    .filter((access) => access.enabled)
                    .map((access) => moduleNameById.get(access.moduleId) ?? access.moduleId)
                    .join(", ") || "Nenhum"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {company.sources.join(", ") || "Sem campanha"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {company.leadCount}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {company.lastLeadAt ? formatDate(company.lastLeadAt) : "Sem leads"}
                </TableCell>
              </TableRow>
              );
            })}

            {visibleCompanies.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  Nenhuma empresa mapeada até agora.
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
