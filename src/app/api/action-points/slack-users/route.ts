import { NextResponse } from "next/server";

import { canManageOrganization } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";
import {
  getSlackBotTokenForOrganization,
  listSlackWorkspaceUsers,
} from "@/lib/integrations/slack";

export async function GET() {
  const session = await getCurrentAuthSession();

  if (!session) {
    return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  }

  if (!canManageOrganization(session.user)) {
    return NextResponse.json(
      { message: "Apenas o Superadmin da empresa pode escolher responsáveis." },
      { status: 403 },
    );
  }

  try {
    const profile = await getProfileSettingsData(session.user);
    const installation = await getSlackBotTokenForOrganization(profile.organizationId);

    if (!installation) {
      return NextResponse.json(
        { message: "Conecte o Slack em Configurações para escolher responsáveis." },
        { status: 409 },
      );
    }

    const users = await listSlackWorkspaceUsers(installation.botToken);

    return NextResponse.json({ users }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[action-points] slack users failed", error);
    return NextResponse.json(
      {
        message:
          "Não foi possível listar as pessoas do Slack. Reconecte o app em Configurações e tente de novo.",
      },
      { status: 502 },
    );
  }
}
