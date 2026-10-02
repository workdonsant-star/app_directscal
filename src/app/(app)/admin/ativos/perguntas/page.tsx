import type { Metadata } from "next";
import { connection } from "next/server";

import { AssetQuestionAuditsWorkspace } from "@/components/admin/asset-question-audits-workspace";
import { listAdminAssetQuestionAudits } from "@/lib/data/management-assets-admin-data-source";

export const metadata: Metadata = {
  title: "Perguntas ao agente — Admin Directscal",
};

export default async function AdminAssetQuestionsPage() {
  // Dados operacionais lidos com service role: nunca pré-renderizar no build.
  await connection();

  const audits = await listAdminAssetQuestionAudits({ onlyGaps: false });

  return <AssetQuestionAuditsWorkspace audits={audits} />;
}
