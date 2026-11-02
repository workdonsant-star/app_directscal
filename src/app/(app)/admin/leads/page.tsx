import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminLeadsTable } from "@/components/admin/admin-leads-table";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { isFeatureAcquisitionEnabled } from "@/lib/env";
import { getAdminPageSnapshot } from "@/lib/data/admin-page-data";

export const metadata: Metadata = {
  title: "Leads — Admin Directscal",
};

export default async function AdminLeadsPage() {
  if (!isFeatureAcquisitionEnabled()) {
    notFound();
  }

  const initialSnapshot = await getAdminPageSnapshot();

  return (
    <>
      <AppTopbar />

      <AppPage>
        <div className="flex w-full flex-col gap-6">
          <AdminLeadsTable initialSnapshot={initialSnapshot} />
        </div>
      </AppPage>
    </>
  );
}
