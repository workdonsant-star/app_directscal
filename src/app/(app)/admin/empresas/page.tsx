import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppTopbar } from "@/components/app-topbar";
import { AdminCompaniesTable } from "@/components/admin/admin-companies-table";
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

      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <AdminCompaniesTable />
        </div>
      </main>
    </>
  );
}
