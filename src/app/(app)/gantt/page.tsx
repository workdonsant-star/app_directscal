import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppTopbar } from "@/components/app-topbar";
import { CalendarWorkspace } from "@/components/gantt/calendar-workspace";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getLatestActionPlanGanttWorkspace } from "@/lib/data/omdx-data-source";

export const metadata: Metadata = {
  title: "Action Points — Directscal",
};

export default async function GanttPage() {
  const session = await getCurrentAuthSession();

  if (!session) {
    redirect("/entrar");
  }

  if (!canAccessCustomerApp(session.user)) {
    redirect("/admin/operacao");
  }

  const workspace = await getLatestActionPlanGanttWorkspace();
  const sourceLabel = workspace.source
    ? `Action points · ${workspace.source.diagnosticName} · ${workspace.source.company}`
    : undefined;

  return (
    <>
      <AppTopbar breadcrumb={[{ label: "Action Points" }]} />

      <main className="flex h-[calc(100svh-4rem)] min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <CalendarWorkspace
            initialTasks={workspace.tasks.length ? workspace.tasks : undefined}
            sourceLabel={sourceLabel}
          />
        </div>
      </main>
    </>
  );
}
