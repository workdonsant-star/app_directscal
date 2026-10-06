import { connection } from "next/server";
import Link from "next/link";

import { AdminOperationsNavigation } from "@/components/admin/admin-operations-navigation";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAdminOrganizations } from "@/lib/data/management-assets-admin-data-source";

export default async function AssetCompanySelectionPage() {
  await connection();
  const companies = await listAdminOrganizations();
  return (
    <>
      <AppTopbar breadcrumb={[{ label: "Operação", href: "/admin/operacao" }, { label: "Criação dos ativos" }]} />
      <AppPage>
        <div className="flex w-full flex-col gap-5">
          <AdminOperationsNavigation section="assets" />
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold">Criação dos ativos</h1>
            <p className="text-sm text-muted-foreground">Abra uma empresa para produzir e acompanhar seus ativos de gestão.</p>
          </div>
          <div className="min-w-0">
            <Table>
              <TableHeader><TableRow><TableHead>Empresa</TableHead><TableHead className="text-right">Produção</TableHead></TableRow></TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium"><Link href={`/admin/empresas/company_${company.id}`}>{company.name}</Link></TableCell>
                    <TableCell className="text-right"><Link className="rounded-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring" href={`/admin/empresas/company_${company.id}/criacao-dos-ativos`}>Abrir criação dos ativos</Link></TableCell>
                  </TableRow>
                ))}
                {companies.length === 0 ? <TableRow><TableCell colSpan={2} className="py-12 text-center text-muted-foreground">Nenhuma empresa disponível.</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </div>
        </div>
      </AppPage>
    </>
  );
}
