import { NextResponse } from "next/server";

import { getCurrentAuthSession } from "@/lib/auth/session";
import { getPublicAppUrl, getRequiredServerEnv } from "@/lib/env";
import {
  exchangeSlackOAuthCode,
  saveSlackInstallation,
} from "@/lib/integrations/slack";
import { verifySlackInstallState } from "@/lib/integrations/slack-format";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const settingsUrl = `${getPublicAppUrl()}/configuracoes`;
  const session = await getCurrentAuthSession();
  const state = verifySlackInstallState(
    getRequiredServerEnv("AUTH_SECRET"),
    url.searchParams.get("state"),
  );
  const code = url.searchParams.get("code");

  // O state amarra a instalação à empresa e à pessoa que iniciou o fluxo.
  if (
    !session ||
    session.user.role !== "cliente" ||
    !state ||
    state.userId !== session.user.id ||
    !code
  ) {
    return NextResponse.redirect(`${settingsUrl}?slack=erro`);
  }

  try {
    const installation = await exchangeSlackOAuthCode(code);

    await saveSlackInstallation({
      ...installation,
      organizationId: state.organizationId,
      installedByUserId: session.user.id,
    });
  } catch (error) {
    console.error("[slack] oauth failed", error);
    return NextResponse.redirect(`${settingsUrl}?slack=erro`);
  }

  return NextResponse.redirect(`${settingsUrl}?slack=conectado`);
}
