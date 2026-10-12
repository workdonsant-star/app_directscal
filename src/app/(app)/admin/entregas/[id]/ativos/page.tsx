import { notFound } from "next/navigation";

import { ManagementAssetsWorkspace } from "@/components/admin/management-assets-workspace";
import { loadAdminDeliveryContext } from "@/lib/data/admin-delivery-workspace-data";
import { listAdminManagementAssets } from "@/lib/data/management-assets-admin-data-source";
import { managementAssetTemplates } from "@/lib/data/management-asset-templates";

export default async function AdminDeliveryAssetsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await loadAdminDeliveryContext(id);

  if (!context) notFound();

  const assets = await listAdminManagementAssets(context.company.organizationId);

  return (
    <ManagementAssetsWorkspace
      assets={assets}
      company={context.company}
      specialists={context.specialists}
      templates={managementAssetTemplates}
      embedded
      deliveryId={id}
    />
  );
}
