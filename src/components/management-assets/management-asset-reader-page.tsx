import { notFound } from "next/navigation";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { ManagementAssetDocumentView } from "@/components/management-assets/management-asset-document-view";
import type { ManagementAssetType } from "@/lib/contracts";
import { getManagementAssetDocument } from "@/lib/data/management-assets-data-source";
import { getManagementAssetLibraryHref } from "@/lib/data/management-asset-routes";

export async function ManagementAssetReaderPage({
  id,
  libraryLabel,
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

  return (
    <>
      <AppTopbar
        breadcrumb={[
          { label: libraryLabel, href: getManagementAssetLibraryHref(type) },
          { label: asset.title },
        ]}
      />

      <AppPage className="min-w-0 px-6 py-8 lg:px-12">
        <ManagementAssetDocumentView asset={asset} />
      </AppPage>
    </>
  );
}
