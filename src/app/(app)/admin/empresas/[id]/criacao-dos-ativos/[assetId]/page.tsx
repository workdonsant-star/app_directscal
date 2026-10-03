import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ManagementAssetEditorWorkspace } from "@/components/admin/management-asset-editor-workspace";
import { adminSpecialists } from "@/lib/data/admin-operations-data-source";
import {
  getAdminManagementAssetDetail,
  getAdminManagementAssetCompany,
  ManagementAssetError,
} from "@/lib/data/management-assets-admin-data-source";

export const metadata: Metadata = {
  title: "Ativo — Admin Directscal",
};

export default async function AdminManagementAssetPage({
  params,
}: {
  params: Promise<{ id: string; assetId: string }>;
}) {
  const { id, assetId } = await params;
  const company = await getAdminManagementAssetCompany(id);
  if (!company) notFound();
  const asset = await getAdminManagementAssetDetail(assetId).catch((error: unknown) => {
    if (error instanceof ManagementAssetError && error.status === 404) return null;
    throw error;
  });

  if (!asset || asset.organizationId !== company.organizationId) notFound();

  return (
    <ManagementAssetEditorWorkspace
      initialAsset={asset}
      specialists={adminSpecialists
        .filter((specialist) => specialist.status === "ativo")
        .map((specialist) => ({ id: specialist.id, name: specialist.name }))}
    />
  );
}
