import type { OrganizationSector } from "@/lib/types";
import { hasSlackScopes, SLACK_ACTION_POINT_SCOPES } from "@/lib/integrations/slack-format";

export function getClientOnboardingProgress(
  connection: { scope: string | null } | null,
  sectors: OrganizationSector[],
  activeSectorCount = sectors.filter((sector) => sector.active).length,
) {
  const slackReady = connection !== null && hasSlackScopes(connection.scope, SLACK_ACTION_POINT_SCOPES);
  const activeSectors = sectors.filter((sector) => sector.active);
  const sectorsReady = activeSectorCount > 0;
  const leadersReady = sectorsReady && activeSectors.length === activeSectorCount && activeSectors.every((sector) =>
    sector.leader.slackUserId
      ? Boolean(sector.leader.slackTeamId) && sector.inviteStatus === "ativo"
      : Boolean(sector.leader.email && sector.leader.position) &&
        (sector.inviteStatus === "ativo" || sector.inviteStatus === "convite_enviado"),
  );
  return { slackReady, sectorsReady, leadersReady, canComplete: slackReady && leadersReady };
}
