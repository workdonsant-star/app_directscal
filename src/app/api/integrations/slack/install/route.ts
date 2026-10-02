import { NextResponse } from "next/server";

import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getPublicAppUrl, getRequiredServerEnv } from "@/lib/env";
import {
  buildSlackAuthorizeUrl,
  isSlackOAuthConfigured,
} from "@/lib/integrations/slack";
import { signSlackInstallState } from "@/lib/integrations/slack-format";

// Somente o Superadmin da empresa (`cliente`) conecta o Slack da própria empresa.
export async function GET() {
  const session = await getCurrentAuthSession();
  const settingsUrl = `${getPublicAppUrl()}/configuracoes`;

  if (!session) {
    return NextResponse.redirect(`${getPublicAppUrl()}/entrar`);
  }

  if (session.user.role !== "cliente" || !isSlackOAuthConfigured()) {
    return NextResponse.redirect(`${settingsUrl}?slack=indisponivel`);
  }

  const access = await getAccessibleOrganizationIdsForUser(session.user.id);

  if (!access.primaryOrganizationId) {
    return NextResponse.redirect(`${settingsUrl}?slack=indisponivel`);
  }

  const state = signSlackInstallState(getRequiredServerEnv("AUTH_SECRET"), {
    organizationId: access.primaryOrganizationId,
    userId: session.user.id,
  });

  return NextResponse.redirect(buildSlackAuthorizeUrl(state));
}
