import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminLeadsTable } from "@/components/admin/admin-leads-table";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
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
        breadcrumb={[{ label: "Admin", href: "/admin/operacao" }, { label: "Leads" }]}
      />

      <AppPage>
        <div className="flex w-full flex-col gap-6">
          <AdminLeadsTable />
        </div>
      </AppPage>
    </>
  );
}
