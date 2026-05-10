import type { Metadata } from "next";

import { AppTopbar } from "@/components/app-topbar";
import { AdminLeadsTable } from "@/components/admin/admin-leads-table";

export const metadata: Metadata = {
  title: "Leads — Admin Directscal",
};

export default function AdminLeadsPage() {
  return (
    <>
      <AppTopbar
        breadcrumb={[{ label: "Admin", href: "/admin/modulos" }, { label: "Leads" }]}
      />

      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-foreground text-3xl font-semibold tracking-tight">
              Leads
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              Acompanhe os cadastros capturados pelos links de aquisição dos
              módulos Directscal.
            </p>
          </div>
          <AdminLeadsTable />
        </div>
      </main>
    </>
  );
}
