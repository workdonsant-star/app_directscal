import type { Metadata } from "next";

import { AppTopbar } from "@/components/app-topbar";
import { AdminCompaniesTable } from "@/components/admin/admin-companies-table";

export const metadata: Metadata = {
  title: "Empresas — Admin Directscal",
};

export default function AdminCompaniesPage() {
  return (
    <>
      <AppTopbar
        breadcrumb={[{ label: "Admin", href: "/admin/modulos" }, { label: "Empresas" }]}
      />

      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-foreground text-3xl font-semibold tracking-tight">
              Empresas
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              Visualize as empresas que entraram pela aquisição e os módulos de
              interesse.
            </p>
          </div>
          <AdminCompaniesTable />
        </div>
      </main>
    </>
  );
}
