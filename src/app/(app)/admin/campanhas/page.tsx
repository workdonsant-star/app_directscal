import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminCampaignsWorkspace } from "@/components/admin/admin-campaigns-workspace";
import { AppPage } from "@/components/app-page";
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

      <AppPage>
        <div className="w-full">
          <AdminCampaignsWorkspace />
        </div>
      </AppPage>
    </>
  );
}
