import type { Metadata } from "next";

import { AdminModulesWorkspace } from "@/components/admin/admin-modules-workspace";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";

export const metadata: Metadata = {
  title: "Módulos — Admin Directscal",
};

export default function AdminModulesPage() {
  return (
    <>
      <AppTopbar />

      <AppPage>
        <div className="w-full">
          <AdminModulesWorkspace />
        </div>
      </AppPage>
    </>
  );
}
