import { getSpecialists } from "@/lib/data/person-profiles-data-source";
import type { Metadata } from "next";

import { AdminSpecialistsWorkspace } from "@/components/admin/admin-specialists-workspace";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";

export const metadata: Metadata = {
  title: "Especialistas — Admin Directscal",
};

export default async function AdminSpecialistsPage() {
  const specialists = (await getSpecialists()).filter((item) => !item.deleted);
  return (
    <>
      <AppTopbar />
      <AppPage>
        <AdminSpecialistsWorkspace initialSpecialists={specialists} />
      </AppPage>
    </>
  );
}
