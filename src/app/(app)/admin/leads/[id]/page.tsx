import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminLeadDetail } from "@/components/admin/admin-lead-detail";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { isFeatureAcquisitionEnabled } from "@/lib/env";
import { getAdminPageSnapshot } from "@/lib/data/admin-page-data";

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
  const initialSnapshot = await getAdminPageSnapshot();
  if (!initialSnapshot.leads.some((lead) => lead.id === id)) notFound();

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Leads", href: "/admin/leads" },
          { label: "Detalhe" },
        ]}
      />

      <AppPage>
        <div className="w-full">
          <AdminLeadDetail leadId={id} initialSnapshot={initialSnapshot} />
        </div>
      </AppPage>
    </>
  );
}
