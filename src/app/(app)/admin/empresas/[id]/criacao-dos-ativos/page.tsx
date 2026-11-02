import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { CompanyFilesWorkspace } from "@/components/admin/company-files-workspace";
import { listCustomerDocuments } from "@/lib/data/customer-documents-data-source";
import { getAssetNavigationPreferences } from "@/lib/data/asset-navigation-data-source";
import { getManagementAssetCategoryFolders } from "@/lib/data/management-asset-categories";
import {
  listAdminManagementAssets,
  getAdminManagementAssetCompany,
} from "@/lib/data/management-assets-admin-data-source";

export const metadata: Metadata = {
  title: "Ativos de gestão — Admin Directscal",
};

export default async function AdminManagementAssetsPage({ params }: { params: Promise<{ id: string }> }) {
  // Dados operacionais lidos com service role: nunca pré-renderizar no build.
  await connection();

  const { id } = await params;
  const company = await getAdminManagementAssetCompany(id);
  if (!company) notFound();
  const [assets, preferences, documents] = await Promise.all([
    listAdminManagementAssets(company.organizationId),
    getAssetNavigationPreferences(company.organizationId),
    listCustomerDocuments([company.organizationId]),
  ]);
  const folders = getManagementAssetCategoryFolders(assets, preferences.categories);

  return (
    <CompanyFilesWorkspace company={company} assets={assets} documents={documents} folders={folders} showActionPoints />
  );
}
