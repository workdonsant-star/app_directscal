import type { Metadata } from "next";

import { AcquisitionPublicFlow } from "@/components/admin/acquisition-public-flow";

export const metadata: Metadata = {
  title: "Acesso de teste — Directscal",
};

type AcquisitionPageProps = {
  params: Promise<{ token: string }>;
};

export default async function AcquisitionPage({ params }: AcquisitionPageProps) {
  const { token } = await params;

  return <AcquisitionPublicFlow token={token} />;
}
