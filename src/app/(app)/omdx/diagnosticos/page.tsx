import type { Metadata } from "next";

import { DiagnosticsWorkspace } from "@/components/omdx/diagnostics-workspace";
import { getCurrentAuthSession } from "@/lib/auth/session";
import {
  getDefaultDiagnosticTemplate,
  getDiagnosticShareLinksByDiagnosticIds,
  getDiagnostics,
} from "@/lib/data/omdx-data-source";
import { getOrganizationStructure } from "@/lib/data/organization-structure-data-source";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";

export const metadata: Metadata = {
  title: "Diagnósticos — Maturidade",
};

export default async function DiagnosticsPage() {
  const [session, template, diagnostics] = await Promise.all([
    getCurrentAuthSession(),
    getDefaultDiagnosticTemplate(),
    getDiagnostics(),
  ]);
  const [shareLinksByDiagnosticId, companyProfile] = await Promise.all([
    getDiagnosticShareLinksByDiagnosticIds(
      diagnostics.map((diagnostic) => diagnostic.id),
    ),
    session
      ? getProfileSettingsData(session.user).catch(() => null)
      : Promise.resolve(null),
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
