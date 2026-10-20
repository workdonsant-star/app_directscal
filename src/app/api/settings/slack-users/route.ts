import { NextResponse } from "next/server";
import { canManageOrganization } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";
import { getSlackLeadershipDirectory } from "@/lib/data/slack-leadership-data-source";

export async function GET() {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  if (!canManageOrganization(session.user) || session.acquisition || session.leadershipInvitation) {
    return NextResponse.json({ message: "Apenas o dono da empresa pode configurar lideranças." }, { status: 403 });
  }
  try {
    const profile = await getProfileSettingsData(session.user);
    const users = await getSlackLeadershipDirectory(profile.organizationId);
    return NextResponse.json({ users }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "Não foi possível listar as pessoas. Verifique a conexão com o Slack e tente novamente." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
