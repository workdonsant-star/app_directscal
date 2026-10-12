import "server-only";

import type { GanttWorkspaceData } from "@/lib/contracts";
import { buildGanttWorkspaceDataFromDelivery } from "@/lib/data/action-plan-gantt";
import { getAdminDeliveryPublications } from "@/lib/data/admin-delivery-data-source";
import { adminActionPointTemplates } from "@/lib/data/admin-operations-data-source";
import {
  getDiagnosticActionPlan,
  getOmdxOverviewDiagnosticOptions,
} from "@/lib/data/omdx-data-source";

export type PublishedActionPoints = {
  workspace: GanttWorkspaceData;
  organizationId: string | null;
};

const empty: PublishedActionPoints = {
  workspace: { source: null, tasks: [] },
  organizationId: null,
};

/**
 * Action points do cliente: a seleção que o gestor Directscal publicou na
 * entrega mais recente dos diagnósticos que a sessão pode ver. Entregas não
 * publicadas e diagnósticos fora do escopo da sessão não aparecem.
 */
export async function getPublishedActionPointsWorkspace(): Promise<PublishedActionPoints> {
  const diagnostics = await getOmdxOverviewDiagnosticOptions();
  const publications = await getAdminDeliveryPublications(
    diagnostics.map((diagnostic) => diagnostic.id),
  );
  const latest = publications
    .filter(
      (publication) =>
        publication.status === "publicada" &&
        publication.publishedAt !== null &&
        publication.selectedActionPointIds.length > 0,
    )
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))[0];

  if (!latest) return empty;

  const plan = await getDiagnosticActionPlan(latest.diagnosticId);

  if (!plan) return empty;

  return {
    workspace: buildGanttWorkspaceDataFromDelivery({
      plan,
      publication: latest,
      templates: adminActionPointTemplates,
    }),
    organizationId: latest.organizationId,
  };
}
