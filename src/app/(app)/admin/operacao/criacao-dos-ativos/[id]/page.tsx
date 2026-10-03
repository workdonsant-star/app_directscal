import { notFound, redirect } from "next/navigation";
import { getAdminManagementAssetDetail, ManagementAssetError } from "@/lib/data/management-assets-admin-data-source";

export default async function LegacyOperationAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await getAdminManagementAssetDetail(id).catch((error: unknown) => {
    if (error instanceof ManagementAssetError && error.status === 404) return null;
    throw error;
  });
  if (!asset) notFound();
  redirect(`/admin/empresas/company_${asset.organizationId}/criacao-dos-ativos/${asset.id}`);
}
