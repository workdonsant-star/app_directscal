import type { Metadata } from "next";

import { AdminSpecialistsWorkspace } from "@/components/admin/admin-specialists-workspace";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";

export const metadata: Metadata = {
  title: "Especialistas — Admin Directscal",
};

export default function AdminSpecialistsPage() {
  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Admin", href: "/admin/operacao" },
          { label: "Especialistas" },
        ]}
      />
      <AppPage>
        <AdminSpecialistsWorkspace />
      </AppPage>
    </>
  );
}
