import type { Metadata } from "next";

import { AppTopbar } from "@/components/app-topbar";
import { AdminModulesWorkspace } from "@/components/admin/admin-modules-workspace";

export const metadata: Metadata = {
  title: "Módulos — Admin Directscal",
};

export default function AdminModulesPage() {
  return (
    <>
      <AppTopbar
        breadcrumb={[{ label: "Admin", href: "/admin/modulos" }, { label: "Módulos" }]}
      />

      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl">
          <AdminModulesWorkspace />
        </div>
      </main>
    </>
  );
}
