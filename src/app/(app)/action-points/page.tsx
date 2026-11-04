import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RoutineAgreements } from "@/components/action-points/routine-agreements";
import { getCustomerRoutineAgreements } from "@/lib/data/customer-routine-agreements";
import { getCustomerRoutineRecords } from "@/lib/data/customer-routine-records";
import { ActionPointsPeopleView } from "@/components/action-points/action-points-people-view";
import { ActionPointsDownload } from "@/components/action-points/action-points-download";
import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getPublishedActionPointsWorkspace } from "@/lib/data/published-action-points";
import { getActionPointExecution } from "@/lib/data/action-point-execution-data-source";
import { buildPublishedActionPointsBoard } from "@/lib/data/published-action-points-board";
import { getCustomerCompanyActionPoints } from "@/lib/data/customer-company-action-points";
import { buildManualActionPointsBoard } from "@/lib/data/manual-action-points-board";

export const metadata: Metadata = {
  title: "Action Points — Directscal",
};

export default async function ActionPointsPage({ searchParams }: {
  searchParams?: Promise<{ diagnostico?: string }>;
}) {
  const session = await getCurrentAuthSession();

  if (!session) {
    redirect("/entrar");
  }

  if (!canAccessCustomerApp(session.user)) {
    redirect("/admin/operacao");
  }

  const selected = (await searchParams)?.diagnostico;
  const [{ workspace, organizationId }, manual] = await Promise.all([
    getPublishedActionPointsWorkspace(selected),
    selected ? Promise.resolve([]) : getCustomerCompanyActionPoints(session),
  ]);
  const [execution, agreements, records] = workspace.source && organizationId
    ? await Promise.all([
      getActionPointExecution({ diagnosticId: workspace.source.diagnosticId, organizationId }),
      getCustomerRoutineAgreements(session, organizationId, workspace.source.diagnosticId),
      getCustomerRoutineRecords(session, organizationId, workspace.source.diagnosticId),
    ])
    : [{ assignments: [] }, [], []];
  const board = buildPublishedActionPointsBoard(workspace, execution.assignments, records);

  return (
    <>
      <AppTopbar actions={workspace.source ? <ActionPointsDownload diagnosticId={workspace.source.diagnosticId} /> : undefined} />

      <AppPage>
        {manual.length ? <ActionPointsPeopleView board={buildManualActionPointsBoard(manual)} manual /> : null}
        {workspace.source ? <div className={manual.length ? "mt-12" : undefined}><ActionPointsPeopleView board={board} nested={manual.length > 0} /><RoutineAgreements agreements={agreements} records={records} /></div> : manual.length === 0 ? (
          <div className="py-10">
            <h1 className="text-ui-page">Action points</h1>
            <p className="mt-2 text-sm text-muted-foreground">Nenhum action point disponível para esta empresa.</p>
          </div>
        ) : null}
      </AppPage>
    </>
  );
}
