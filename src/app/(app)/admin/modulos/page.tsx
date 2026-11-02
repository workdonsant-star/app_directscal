import type { Metadata } from "next";

import { AdminModulesWorkspace } from "@/components/admin/admin-modules-workspace";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { getAdminPageSnapshot } from "@/lib/data/admin-page-data";

export const metadata: Metadata = {
  title: "Módulos — Admin Directscal",
};

export default async function AdminModulesPage() {
  const initialSnapshot = await getAdminPageSnapshot();
  return (
    <>
      <AppTopbar />

      <AppPage>
        <div className="w-full">
          <AdminModulesWorkspace initialSnapshot={initialSnapshot} />
        </div>
      </AppPage>
    </>
  );
}
