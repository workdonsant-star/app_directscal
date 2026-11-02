import type { Metadata } from "next";

import { DiagnosticsWorkspace } from "@/components/omdx/diagnostics-workspace";
import { getCurrentAuthSession } from "@/lib/auth/session";
import {
  getDefaultDiagnosticTemplate,
  getDiagnosticShareLinksByDiagnosticIds,
  getDiagnostics,
  getVisibleDiagnosticIds,
} from "@/lib/data/omdx-data-source";
import { getOrganizationStructure } from "@/lib/data/organization-structure-data-source";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";

export const metadata: Metadata = {
  title: "Diagnósticos — Maturidade",
};

export default async function DiagnosticsPage() {
  // Links e perfil da empresa não esperam a contagem de respostas.
  const [session, template, diagnostics, shareLinksByDiagnosticId, companyProfile] = await Promise.all([
    getCurrentAuthSession(),
    getDefaultDiagnosticTemplate(),
    getDiagnostics(),
    getVisibleDiagnosticIds().then(getDiagnosticShareLinksByDiagnosticIds),
    getCurrentAuthSession().then((current) =>
      current ? getProfileSettingsData(current.user).catch(() => null) : null,
    ),
  ]);
  const sectors = companyProfile?.organizationId
    ? await getOrganizationStructure(companyProfile.organizationId)
    : [];

  return (
    <DiagnosticsWorkspace
      currentUserEmail={session?.user.email ?? ""}
      currentUserId={session?.user.id ?? ""}
      currentUserRole={session?.user.role ?? "admin"}
      diagnostics={diagnostics}
      organizationName={
        companyProfile?.company ??
        session?.user.company ??
        "Empresa não identificada"
      }
      shareLinksByDiagnosticId={shareLinksByDiagnosticId}
      sectors={sectors}
      template={template}
    />
  );
}
