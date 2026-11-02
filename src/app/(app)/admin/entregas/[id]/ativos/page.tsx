import { notFound } from "next/navigation";

import { ManagementAssetsWorkspace } from "@/components/admin/management-assets-workspace";
import { getAssetNavigationPreferences } from "@/lib/data/asset-navigation-data-source";
import { getManagementAssetCategoryFolders } from "@/lib/data/management-asset-categories";
import { loadAdminDeliveryContext } from "@/lib/data/admin-delivery-workspace-data";
import { listAdminManagementAssets } from "@/lib/data/management-assets-admin-data-source";

export default async function AdminDeliveryAssetsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await loadAdminDeliveryContext(id);

  if (!context) notFound();

  const [assets, preferences] = await Promise.all([
    listAdminManagementAssets(context.company.organizationId),
    getAssetNavigationPreferences(context.company.organizationId),
  ]);

  return (
    <ManagementAssetsWorkspace
      assets={assets}
      company={context.company}
      specialists={context.specialists}
      categories={getManagementAssetCategoryFolders(assets, preferences.categories).map((category) => category.title).filter((title) => title !== "Sem categoria")}
      embedded
      deliveryId={id}
    />
  );
}
