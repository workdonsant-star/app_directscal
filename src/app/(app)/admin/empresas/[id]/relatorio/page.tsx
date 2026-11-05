import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminCompanyReportsWorkspace } from "@/components/admin/admin-company-reports-workspace";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { getAdminCompanyOverview } from "@/lib/data/admin-company-operations-data-source";
import { listCustomerDocuments } from "@/lib/data/customer-documents-data-source";
import { requireAdminPageSession } from "@/lib/data/admin-page-data";

export const metadata: Metadata = { title: "Diagnósticos da empresa — Admin Directscal" };

export default async function AdminCompanyReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPageSession();
  const company = await getAdminCompanyOverview(id);
  if (!company?.organizationId) notFound();
  const documents = await listCustomerDocuments([company.organizationId], "report");

  return <>
    <AppTopbar breadcrumb={[{ label: "Empresas", href: "/admin/empresas" }, { label: company.name }]} />
    <AppPage>
      <div className="flex w-full flex-col gap-8">
        <h1 className="text-ui-page">{company.name}</h1>
        <AdminCompanyReportsWorkspace companyId={id} documents={documents} />
      </div>
    </AppPage>
  </>;
}
