import { notFound } from "next/navigation";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { ManagementAssetEditableReader } from "@/components/management-assets/management-asset-editable-reader";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/access-control";
import type { ManagementAssetType } from "@/lib/contracts";
import { getManagementAssetDocument, getPublishedManagementAssetFolders } from "@/lib/data/management-assets-data-source";
import { getManagementAssetCategoryFolder, normalizeManagementAssetCategory } from "@/lib/data/management-asset-categories";

export async function ManagementAssetReaderPage({
  id,
  type,
}: {
  id: string;
  libraryLabel: string;
  type: ManagementAssetType;
}) {
  const asset = await getManagementAssetDocument(type, id);

  if (!asset) {
    notFound();
  }
  const folders = await getPublishedManagementAssetFolders();
  const folder = folders.find(item => normalizeManagementAssetCategory(item.title) === normalizeManagementAssetCategory(asset.category)) ?? getManagementAssetCategoryFolder(asset.category);
  const session = await getCurrentAuthSession();
  const canEdit = !!session && canManageOrganization(session.user) && !session.acquisition && !session.leadershipInvitation;

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: folder.title, href: folder.href },
          { label: asset.title },
        ]}
      />

      <AppPage className="min-w-0 px-6 py-8 lg:px-12">
        <ManagementAssetEditableReader asset={asset} canEdit={canEdit} />
      </AppPage>
    </>
  );
}
