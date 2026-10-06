import { notFound } from "next/navigation";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { ManagementAssetDocumentView } from "@/components/management-assets/management-asset-document-view";
import type { ManagementAssetType } from "@/lib/contracts";
import { getManagementAssetDocument } from "@/lib/data/management-assets-data-source";
import { getManagementAssetCategoryFolder } from "@/lib/data/management-asset-categories";

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
  const folder = getManagementAssetCategoryFolder(asset.category);

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: folder.title, href: folder.href },
          { label: asset.title },
        ]}
      />

      <AppPage className="min-w-0 px-6 py-8 lg:px-12">
        <ManagementAssetDocumentView asset={asset} />
      </AppPage>
    </>
  );
}
