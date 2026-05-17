import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AcquisitionPublicFlow } from "@/components/admin/acquisition-public-flow";
import { isFeatureAcquisitionEnabled } from "@/lib/env";

export const metadata: Metadata = {
  title: "Acesso de teste — Directscal",
};

type AcquisitionPageProps = {
  params: Promise<{ token: string }>;
};

export default async function AcquisitionPage({ params }: AcquisitionPageProps) {
  if (!isFeatureAcquisitionEnabled()) {
    notFound();
  }

  const { token } = await params;

  return <AcquisitionPublicFlow token={token} />;
}
