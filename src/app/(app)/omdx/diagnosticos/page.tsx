import type { Metadata } from "next";

import { AppTopbar } from "@/components/app-topbar";
import { DiagnosticsWorkspace } from "@/components/omdx/diagnostics-workspace";
import { getCurrentAuthSession } from "@/lib/auth/session";
import {
  getDefaultDiagnosticTemplate,
  getDiagnosticShareLinksByDiagnosticIds,
  getDiagnostics,
} from "@/lib/data/omdx-data-source";

export const metadata: Metadata = {
  title: "Diagnósticos — OMDx",
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
    <>
      <AppTopbar
        breadcrumb={[
          { label: "Overview", href: "/omdx" },
          { label: "Diagnósticos" },
        ]}
      />

      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl">
          <DiagnosticsWorkspace
            diagnostics={diagnostics}
            organizationName={session?.user.company ?? "Empresa não identificada"}
            shareLinksByDiagnosticId={shareLinksByDiagnosticId}
            template={template}
          />
        </div>
      </main>
    </>
  );
}
