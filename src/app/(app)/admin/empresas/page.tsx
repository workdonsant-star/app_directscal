import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppTopbar } from "@/components/app-topbar";
import { AdminCompaniesTable } from "@/components/admin/admin-companies-table";
import { AppPage } from "@/components/app-page";
import { isFeatureAcquisitionEnabled } from "@/lib/env";

export const metadata: Metadata = {
  title: "Empresas — Admin Directscal",
};

export default function AdminCompaniesPage() {
  if (!isFeatureAcquisitionEnabled()) {
    notFound();
  }

  return (
    <>
      <AppTopbar
        breadcrumb={[{ label: "Admin", href: "/admin/modulos" }, { label: "Empresas" }]}
      />

      <AppPage>
        <div className="flex w-full flex-col gap-6">
          <AdminCompaniesTable />
        </div>
      </AppPage>
    </>
  );
}
