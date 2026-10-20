import { NextResponse } from "next/server";

import { canManageOrganization } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { createSlackSectorLeaderInputSchema } from "@/lib/contracts";
import { createSlackSectorLeader } from "@/lib/data/slack-leadership-data-source";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";

export async function POST(request: Request) {
  const session = await getCurrentAuthSession();

  if (!session) {
    return NextResponse.json(
      { message: "Entre para continuar." },
      { status: 401 },
    );
  }

  if (!canManageOrganization(session.user) || session.acquisition || session.leadershipInvitation) {
    return NextResponse.json(
      { message: "Apenas o Superadmin da empresa pode alterar configurações." },
      { status: 403 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = createSlackSectorLeaderInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revise os dados do setor e da liderança." },
      { status: 400 },
    );
  }

  try {
    const profile = await getProfileSettingsData(session.user);
    await createSlackSectorLeader({
      createdBy: session.user.id,
      input: parsed.data,
      organizationId: profile.organizationId,
    });

    return NextResponse.json(
      { message: "Setor e liderança salvos.", ok: true },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível cadastrar o setor.";

    return NextResponse.json(
      { message },
      { status: message.includes("Já existe") ? 409 : 400 },
    );
  }
}
