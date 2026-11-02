import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminCampaignsWorkspace } from "@/components/admin/admin-campaigns-workspace";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { getAdminPageSnapshot } from "@/lib/data/admin-page-data";
import { isFeatureAcquisitionEnabled } from "@/lib/env";

export const metadata: Metadata = {
  title: "Campanhas — Admin Directscal",
};

export default async function AdminCampaignsPage() {
  if (!isFeatureAcquisitionEnabled()) {
    notFound();
  }

  const initialSnapshot = await getAdminPageSnapshot();

  return (
    <>
      <AppTopbar />

      <AppPage>
        <div className="w-full">
          <AdminCampaignsWorkspace initialSnapshot={initialSnapshot} />
        </div>
      </AppPage>
    </>
  );
}
