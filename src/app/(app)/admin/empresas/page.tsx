import type { Metadata } from "next";

import { AppTopbar } from "@/components/app-topbar";
import { AdminCompaniesTable } from "@/components/admin/admin-companies-table";
import { AppPage } from "@/components/app-page";
import { getAdminPageSnapshot } from "@/lib/data/admin-page-data";

export const metadata: Metadata = {
  title: "Empresas — Admin Directscal",
};

export default async function AdminCompaniesPage() {
  const initialSnapshot = await getAdminPageSnapshot();

  return (
    <>
      <AppTopbar />

      <AppPage>
        <div className="flex w-full flex-col gap-6">
          <AdminCompaniesTable initialSnapshot={initialSnapshot} />
        </div>
      </AppPage>
    </>
  );
}
