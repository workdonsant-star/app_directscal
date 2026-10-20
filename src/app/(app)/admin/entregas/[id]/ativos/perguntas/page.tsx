import { getAgentOperations } from "@/lib/data/agent-operations-data-source";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AssetQuestionAuditsWorkspace } from "@/components/admin/asset-question-audits-workspace";
import { loadAdminDeliveryContext } from "@/lib/data/admin-delivery-workspace-data";
import { listAdminAssetQuestionAudits } from "@/lib/data/management-assets-admin-data-source";

export default async function AdminDeliveryAssetQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await loadAdminDeliveryContext(id);

  if (!context) notFound();

  const audits = await listAdminAssetQuestionAudits({
    onlyGaps: false,
    organizationId: context.company.organizationId,
  });

  const operations = await getAgentOperations(context.company.id, audits.map(audit => audit.id));

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/entregas/${id}/ativos`}
        className="inline-block rounded-sm text-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring"
      >
        Voltar aos ativos da empresa
      </Link>
      <AssetQuestionAuditsWorkspace
        audits={audits} operations={operations}
        company={context.company}
        embedded
      />
    </div>
  );
}
