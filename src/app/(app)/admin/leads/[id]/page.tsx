import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminLeadDetail } from "@/components/admin/admin-lead-detail";
import { AppTopbar } from "@/components/app-topbar";
import { isFeatureAcquisitionEnabled } from "@/lib/env";

export const metadata: Metadata = {
  title: "Detalhe do lead — Admin Directscal",
};

type AdminLeadDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminLeadDetailPage({
  params,
}: AdminLeadDetailPageProps) {
  if (!isFeatureAcquisitionEnabled()) {
    notFound();
  }

  const { id } = await params;

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Admin", href: "/admin/modulos" },
          { label: "Leads", href: "/admin/leads" },
          { label: "Detalhe" },
        ]}
      />

      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl">
          <AdminLeadDetail leadId={id} />
        </div>
      </main>
    </>
  );
}
