import type { Metadata } from "next";
import { connection } from "next/server";

import { ManagementAssetsWorkspace } from "@/components/admin/management-assets-workspace";
import { adminSpecialists } from "@/lib/data/admin-operations-data-source";
import {
  listAdminManagementAssets,
  listAdminOrganizations,
} from "@/lib/data/management-assets-admin-data-source";
import { managementAssetTemplates } from "@/lib/data/management-asset-templates";

export const metadata: Metadata = {
  title: "Ativos de gestão — Admin Directscal",
};

export default async function AdminManagementAssetsPage() {
  // Dados operacionais lidos com service role: nunca pré-renderizar no build.
  await connection();

  const [assets, organizations] = await Promise.all([
    listAdminManagementAssets(),
    listAdminOrganizations(),
  ]);

  return (
    <ManagementAssetsWorkspace
      assets={assets}
      organizations={organizations}
      specialists={adminSpecialists
        .filter((specialist) => specialist.status === "ativo")
        .map((specialist) => ({ id: specialist.id, name: specialist.name }))}
      templates={managementAssetTemplates.map((template) => ({
        id: template.id,
        type: template.type,
        label: template.label,
        description: template.description,
        title: template.title,
        summary: template.summary,
        category: template.category,
        ownerLabel: template.ownerLabel,
        reviewCycle: template.reviewCycle,
      }))}
    />
  );
}
