import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppTopbar } from "@/components/app-topbar";
import { AdminLeadsTable } from "@/components/admin/admin-leads-table";
import { isFeatureAcquisitionEnabled } from "@/lib/env";

export const metadata: Metadata = {
  title: "Leads — Admin Directscal",
};

export default function AdminLeadsPage() {
  if (!isFeatureAcquisitionEnabled()) {
    notFound();
  }

  return (
    <>
      <AppTopbar
        breadcrumb={[{ label: "Admin", href: "/admin/modulos" }, { label: "Leads" }]}
      />

      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <AdminLeadsTable />
        </div>
      </main>
    </>
  );
}
