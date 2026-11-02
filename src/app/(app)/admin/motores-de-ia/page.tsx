import type { Metadata } from "next";

import { AdminAiProvidersWorkspace } from "@/components/admin/admin-ai-providers-workspace";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { requireAdminPageSession } from "@/lib/data/admin-page-data";
import { getAgentProviderOverview } from "@/lib/data/agent-provider-data-source";

export const metadata: Metadata = { title: "Motores de IA — Admin Directscal" };

export default async function AdminAiProvidersPage() {
  await requireAdminPageSession();
  const providers = await getAgentProviderOverview();
  return <><AppTopbar /><AppPage><AdminAiProvidersWorkspace initialProviders={providers} /></AppPage></>;
}
