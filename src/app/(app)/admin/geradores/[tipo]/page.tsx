import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { GeneratorBriefingWorkspace } from "@/components/admin/generators/generator-briefing-workspace";
import { isGeneratorKind } from "@/components/admin/generators/generator-config";

export const metadata: Metadata = { title: "Geradores — Admin Directscal" };

export default async function AdminGeneratorPage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  if (!isGeneratorKind(tipo)) notFound();

  return (
    <>
      <AppTopbar />
      <AppPage><GeneratorBriefingWorkspace key={tipo} kind={tipo} /></AppPage>
    </>
  );
}
