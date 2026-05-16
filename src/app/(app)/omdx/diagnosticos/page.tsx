import type { Metadata } from "next";

import { AppTopbar } from "@/components/app-topbar";
import { DiagnosticsWorkspace } from "@/components/omdx/diagnostics-workspace";
import {
  getDefaultDiagnosticTemplate,
  getDiagnostics,
} from "@/lib/data/omdx-data-source";

export const metadata: Metadata = {
  title: "Diagnósticos — OMDx",
};

export default function DiagnosticsPage() {
  const template = getDefaultDiagnosticTemplate();
  const diagnostics = getDiagnostics();

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
            template={template}
          />
        </div>
      </main>
    </>
  );
}
