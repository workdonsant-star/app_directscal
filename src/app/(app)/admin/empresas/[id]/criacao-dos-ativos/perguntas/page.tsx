import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import { AssetQuestionAuditsWorkspace } from "@/components/admin/asset-question-audits-workspace";
import { getAdminManagementAssetCompany, listAdminAssetQuestionAudits } from "@/lib/data/management-assets-admin-data-source";

export const metadata: Metadata = {
  title: "Perguntas ao agente — Admin Directscal",
};

export default async function AdminAssetQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  // Dados operacionais lidos com service role: nunca pré-renderizar no build.
  await connection();

  const { id } = await params;
  const company = await getAdminManagementAssetCompany(id);
  if (!company) notFound();
  const audits = await listAdminAssetQuestionAudits({ onlyGaps: false, organizationId: company.organizationId });

  return <AssetQuestionAuditsWorkspace audits={audits} company={company} />;
}
