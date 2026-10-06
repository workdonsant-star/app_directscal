import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { ManagementAssetsWorkspace } from "@/components/admin/management-assets-workspace";
import { adminSpecialists } from "@/lib/data/admin-operations-data-source";
import {
  listAdminManagementAssets,
  getAdminManagementAssetCompany,
} from "@/lib/data/management-assets-admin-data-source";
import { managementAssetTemplates } from "@/lib/data/management-asset-templates";

export const metadata: Metadata = {
  title: "Ativos de gestão — Admin Directscal",
};

export default async function AdminManagementAssetsPage({ params }: { params: Promise<{ id: string }> }) {
  // Dados operacionais lidos com service role: nunca pré-renderizar no build.
  await connection();

  const { id } = await params;
  const company = await getAdminManagementAssetCompany(id);
  if (!company) notFound();
  const assets = await listAdminManagementAssets(company.organizationId);

  return (
    <ManagementAssetsWorkspace
      assets={assets}
      company={company}
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
