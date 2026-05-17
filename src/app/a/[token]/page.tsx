import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AcquisitionPublicFlow } from "@/components/admin/acquisition-public-flow";
import { getAcquisitionCampaignByToken } from "@/lib/data/acquisition-data-source";
import { getAdminModuleById } from "@/lib/data/admin-data-source";
import { isFeatureAcquisitionEnabled } from "@/lib/env";

export const metadata: Metadata = {
  title: "Acesso — Directscal",
};

type AcquisitionPageProps = {
  params: Promise<{ token: string }>;
};

export default async function AcquisitionPage({ params }: AcquisitionPageProps) {
  if (!isFeatureAcquisitionEnabled()) {
    notFound();
  }

  const { token } = await params;
  const campaign = await getAcquisitionCampaignByToken(token);
  const selectedModule = campaign ? getAdminModuleById(campaign.moduleId) : null;

  return (
    <AcquisitionPublicFlow
      campaign={campaign}
      selectedModule={selectedModule}
      token={token}
    />
  );
}
