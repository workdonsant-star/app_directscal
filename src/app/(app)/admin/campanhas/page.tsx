import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminCampaignsWorkspace } from "@/components/admin/admin-campaigns-workspace";
import { AppTopbar } from "@/components/app-topbar";
import { isFeatureAcquisitionEnabled } from "@/lib/env";

export const metadata: Metadata = {
  title: "Campanhas — Admin Directscal",
};

export default function AdminCampaignsPage() {
  if (!isFeatureAcquisitionEnabled()) {
    notFound();
  }

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Admin", href: "/admin/modulos" },
          { label: "Campanhas" },
        ]}
      />

      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl">
          <AdminCampaignsWorkspace />
        </div>
      </main>
    </>
  );
}
