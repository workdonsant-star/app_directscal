import { NextResponse } from "next/server";

import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { getCurrentAuthSession } from "@/lib/auth/session";
import {
  getSlackInstallationForOrganization,
  revokeSlackInstallation,
  revokeSlackToken,
} from "@/lib/integrations/slack";

export async function DELETE() {
  const session = await getCurrentAuthSession();

  if (!session) {
    return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  }

  if (session.user.role !== "cliente") {
    return NextResponse.json(
      { message: "Somente o Superadmin da empresa desconecta o Slack." },
      { status: 403 },
    );
  }

  const access = await getAccessibleOrganizationIdsForUser(session.user.id);
  const organizationId = access.primaryOrganizationId;
  const installation = organizationId
    ? await getSlackInstallationForOrganization(organizationId)
    : null;

  if (!organizationId || !installation) {
    return NextResponse.json({ message: "Nenhum Slack conectado." }, { status: 404 });
  }

  const token = await revokeSlackInstallation(installation.teamId, organizationId);
  if (token) await revokeSlackToken(token);

  return NextResponse.json({ ok: true });
}
