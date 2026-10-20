import { NextResponse } from "next/server";
import { canManageOrganization } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { assetNavigationWriteSchema } from "@/lib/contracts/asset-navigation";
import { saveAssetNavigationPreferences } from "@/lib/data/asset-navigation-data-source";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";

export async function PUT(request: Request) {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  if (!canManageOrganization(session.user) || session.acquisition || session.leadershipInvitation) {
    return NextResponse.json({ message: "Apenas o dono da empresa pode organizar os ativos." }, { status: 403 });
  }
  const parsed = assetNavigationWriteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Revise as opções do menu." }, { status: 400 });
  try {
    const profile = await getProfileSettingsData(session.user);
    const result = await saveAssetNavigationPreferences(profile.organizationId, session.user.id, parsed.data);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "Não foi possível salvar a organização do menu." }, { status: 500 });
  }
}
