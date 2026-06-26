import type { Metadata } from "next";

import { AppTopbar } from "@/components/app-topbar";
import { GanttWorkspace } from "@/components/gantt/gantt-workspace";
import { getLatestActionPlanGanttWorkspace } from "@/lib/data/omdx-data-source";

export const metadata: Metadata = {
  title: "Cronograma — Directscal",
};

export default async function GanttPage() {
  const workspace = await getLatestActionPlanGanttWorkspace();
  const sourceLabel = workspace.source
    ? `Action points · ${workspace.source.diagnosticName} · ${workspace.source.company}`
    : undefined;

  return (
    <>
      <AppTopbar breadcrumb={[{ label: "Cronograma" }]} />

      <main className="flex h-[calc(100svh-4rem)] min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <GanttWorkspace
            initialTasks={workspace.tasks.length ? workspace.tasks : undefined}
            sourceLabel={sourceLabel}
          />
        </div>
      </main>
    </>
  );
}
