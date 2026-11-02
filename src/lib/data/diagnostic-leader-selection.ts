import "server-only";

import { getOrganizationStructure } from "@/lib/data/organization-structure-data-source";

export async function getActiveDiagnosticLeaderIds(organizationId: string) {
  const sectors = await getOrganizationStructure(organizationId);
  return [...new Set(sectors
    .filter((sector) => sector.active && sector.inviteStatus === "ativo")
    .map((sector) => sector.leader.id))];
}
