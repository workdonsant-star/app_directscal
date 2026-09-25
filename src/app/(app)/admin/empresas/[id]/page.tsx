import type { Metadata } from "next";

import { AdminCompanyDetail } from "@/components/admin/admin-company-detail";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";

export const metadata: Metadata = {
  title: "Empresa — Admin Directscal",
};

export default async function AdminCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Admin", href: "/admin/operacao" },
          { label: "Empresas", href: "/admin/empresas" },
          { label: "Detalhe" },
        ]}
      />
      <AppPage>
        <AdminCompanyDetail companyId={id} />
      </AppPage>
    </>
  );
}
