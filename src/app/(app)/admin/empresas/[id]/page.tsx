import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminCompanyDetail } from "@/components/admin/admin-company-detail";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { getAdminCompanyContext } from "@/lib/data/admin-company-operations-data-source";

export const metadata: Metadata = {
  title: "Empresa — Admin Directscal",
};

export default async function AdminCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await getAdminCompanyContext(id);
  if (!context) notFound();

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Empresas", href: "/admin/empresas" },
          { label: "Detalhe" },
        ]}
      />
      <AppPage>
        <AdminCompanyDetail key={`${id}:${context.operations.assignment.updatedAt}`} context={context} />
      </AppPage>
    </>
  );
}
