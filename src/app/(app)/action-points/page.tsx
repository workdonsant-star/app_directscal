import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppPage } from "@/components/app-page";
import { AppTopbar } from "@/components/app-topbar";
import { ActionPointsWorkspace } from "@/components/gantt/action-points-workspace";
import {
  canAccessCustomerApp,
  canManageOrganization,
} from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import type { ActionPointSlackStatus } from "@/lib/contracts";
import { getActionPointExecution } from "@/lib/data/action-point-execution-data-source";
import { getPublishedActionPointsWorkspace } from "@/lib/data/published-action-points";
import { getSlackInstallationForOrganization } from "@/lib/integrations/slack";
import {
  hasSlackScopes,
  SLACK_ACTION_POINT_SCOPES,
} from "@/lib/integrations/slack-format";

export const metadata: Metadata = {
  title: "Action Points — Directscal",
};

async function getSlackStatus(
  organizationId: string | null,
): Promise<ActionPointSlackStatus> {
  if (!organizationId) return "desconectado";

  const installation = await getSlackInstallationForOrganization(
    organizationId,
  ).catch((error: unknown) => {
    console.error("[slack] installation lookup failed", error);
    return null;
  });

  if (!installation) return "desconectado";

  return hasSlackScopes(installation.scope, SLACK_ACTION_POINT_SCOPES)
    ? "conectado"
    : "reconectar";
}

export default async function GanttPage() {
  const session = await getCurrentAuthSession();

  if (!session) {
    redirect("/entrar");
  }

  if (!canAccessCustomerApp(session.user)) {
    redirect("/admin/operacao");
  }

  const { workspace, organizationId } = await getPublishedActionPointsWorkspace();
  const diagnosticId = workspace.source?.diagnosticId ?? null;
  const canEdit = canManageOrganization(session.user);
  const [execution, slackStatus] = await Promise.all([
    diagnosticId && organizationId
      ? getActionPointExecution({ diagnosticId, organizationId }).catch(
          (error: unknown) => {
            // Ex.: migração das tabelas de execução ainda não aplicada.
            console.error("[action-points] execution lookup failed", error);
            return null;
          },
        )
      : { assignments: [], events: [] },
    canEdit
      ? getSlackStatus(organizationId)
      : Promise.resolve<ActionPointSlackStatus>("desconectado"),
  ]);
  const sourceLabel = workspace.source
    ? `${workspace.source.diagnosticName} · ${workspace.source.company}`
    : undefined;

  return (
    <>
      <AppTopbar />

      <AppPage>
        <ActionPointsWorkspace
          tasks={workspace.tasks}
          diagnosticId={diagnosticId}
          assignments={execution?.assignments ?? []}
          events={execution?.events ?? []}
          today={new Date().toISOString().slice(0, 10)}
          sourceLabel={sourceLabel}
          canEdit={canEdit && execution !== null}
          slackStatus={slackStatus}
        />
      </AppPage>
    </>
  );
}
