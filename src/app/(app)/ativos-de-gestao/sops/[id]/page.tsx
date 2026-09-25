import { notFound } from "next/navigation";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { SopDocumentView } from "@/components/management-assets/sop-document-view";
import { getSopDocumentById } from "@/lib/data/management-assets-data-source";

export const metadata = {
  title: "SOP — Directscal",
};

export default async function ManagementAssetSopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sop = await getSopDocumentById(id);

  if (!sop) {
    notFound();
  }

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: "SOPs", href: "/ativos-de-gestao/sops" },
          { label: sop.title },
        ]}
      />

      <AppPage className="min-w-0 px-6 py-8 lg:px-12">
        <SopDocumentView sop={sop} />
      </AppPage>
    </>
  );
}
