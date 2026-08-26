import type { Metadata } from "next";

import { DiagnosticsWorkspace } from "@/components/omdx/diagnostics-workspace";
import { getCurrentAuthSession } from "@/lib/auth/session";
import {
  getDefaultDiagnosticTemplate,
  getDiagnosticShareLinksByDiagnosticIds,
  getDiagnostics,
} from "@/lib/data/omdx-data-source";

export const metadata: Metadata = {
  title: "Diagnósticos — Maturidade",
};

export default async function DiagnosticsPage() {
  const [session, template, diagnostics] = await Promise.all([
    getCurrentAuthSession(),
    getDefaultDiagnosticTemplate(),
    getDiagnostics(),
  ]);
  const shareLinksByDiagnosticId = await getDiagnosticShareLinksByDiagnosticIds(
    diagnostics.map((diagnostic) => diagnostic.id),
  );

  return (
    <DiagnosticsWorkspace
      diagnostics={diagnostics}
      organizationName={session?.user.company ?? "Empresa não identificada"}
      shareLinksByDiagnosticId={shareLinksByDiagnosticId}
      template={template}
    />
  );
}
