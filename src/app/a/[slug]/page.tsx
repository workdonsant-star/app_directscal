import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AcquisitionPublicFlow } from "@/components/admin/acquisition-public-flow";
import { getAcquisitionCampaignBySlug } from "@/lib/data/acquisition-data-source";
import { getAdminModuleById } from "@/lib/data/admin-data-source";
import { isFeatureAcquisitionEnabled } from "@/lib/env";

export const metadata: Metadata = {
  title: "Acesso — Directscal",
};

type AcquisitionPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ erro?: string | string[] }>;
};

function getAcquisitionAuthErrorMessage(error?: string | string[]) {
  const errorCode = Array.isArray(error) ? error[0] : error;

  if (errorCode === "sessao-google") {
    return "A sessão anterior foi encerrada. Tente continuar com Google novamente.";
  }

  if (errorCode === "conta-google") {
    return "Esta conta Google já está vinculada a outro usuário no módulo Maturidade.";
  }

  return null;
}

export default async function AcquisitionPage({
  params,
  searchParams,
}: AcquisitionPageProps) {
  if (!isFeatureAcquisitionEnabled()) {
    notFound();
  }

  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const campaign = await getAcquisitionCampaignBySlug(slug);
  const selectedModule = campaign ? getAdminModuleById(campaign.moduleId) : null;

  return (
    <AcquisitionPublicFlow
      campaign={campaign}
      initialAuthError={getAcquisitionAuthErrorMessage(
        resolvedSearchParams?.erro,
      )}
      selectedModule={selectedModule}
      slug={slug}
    />
  );
}
