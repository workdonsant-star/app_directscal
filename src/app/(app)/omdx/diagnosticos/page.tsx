import type { Metadata } from "next";

import { DiagnosticsWorkspace } from "@/components/omdx/diagnostics-workspace";
import { getCurrentAuthSession } from "@/lib/auth/session";
import {
  getDefaultDiagnosticTemplate,
  getDiagnosticShareLinksByDiagnosticIds,
  getDiagnostics,
  getVisibleDiagnosticIds,
} from "@/lib/data/omdx-data-source";

export const metadata: Metadata = {
  title: "Diagnósticos — Maturidade",
};

export default async function DiagnosticsPage() {
  // Links dependem só dos IDs visíveis: não esperam a contagem de respostas.
  const [session, template, diagnostics, shareLinksByDiagnosticId] = await Promise.all([
    getCurrentAuthSession(),
    getDefaultDiagnosticTemplate(),
    getDiagnostics(),
    getVisibleDiagnosticIds().then(getDiagnosticShareLinksByDiagnosticIds),
  ]);

  return (
    <DiagnosticsWorkspace
      currentUserId={session?.user.id ?? ""}
      diagnostics={diagnostics}
      shareLinksByDiagnosticId={shareLinksByDiagnosticId}
      template={template}
    />
  );
}
