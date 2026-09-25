import { NextResponse } from "next/server";

import { getCurrentAuthSession } from "@/lib/auth/session";
import { updateProfileCommercialInputSchema } from "@/lib/contracts";
import {
  getProfileSettingsData,
  updateOrganizationPersonPosition,
  updateProfileCommercialData,
} from "@/lib/data/profile-data-source";

export async function PATCH(request: Request) {
  const session = await getCurrentAuthSession();

  if (!session) {
    return NextResponse.json(
      { message: "Entre para continuar." },
      { status: 401 },
    );
  }

  if (session.user.role === "superadmin") {
    return NextResponse.json(
      { message: "Acesso restrito ao perfil do cliente." },
      { status: 403 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = updateProfileCommercialInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revise as informações comerciais." },
      { status: 400 },
    );
  }

  try {
    if (session.user.role === "admin") {
      await updateOrganizationPersonPosition(
        session.user.id,
        parsed.data.position,
      );

      return NextResponse.json({ commercialData: parsed.data, ok: true });
    }

    const profile = await getProfileSettingsData(session.user);
    const commercialData = await updateProfileCommercialData(
      session.user.id,
      profile.organizationId,
      parsed.data,
    );

    return NextResponse.json({ commercialData, ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar as informações comerciais.",
      },
      { status: 400 },
    );
  }
}
