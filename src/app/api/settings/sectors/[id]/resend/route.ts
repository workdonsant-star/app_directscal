import { NextResponse } from "next/server";

import { canManageOrganization } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { resendOrganizationLeadershipInvite } from "@/lib/data/organization-structure-data-source";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/settings/sectors/[id]/resend">,
) {
  const session = await getCurrentAuthSession();

  if (!session) {
    return NextResponse.json(
      { message: "Entre para continuar." },
      { status: 401 },
    );
  }

  if (!canManageOrganization(session.user)) {
    return NextResponse.json(
      { message: "Apenas o Superadmin da empresa pode alterar configurações." },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  try {
    const profile = await getProfileSettingsData(session.user);
    const result = await resendOrganizationLeadershipInvite({
      companyName: profile.company,
      createdBy: session.user.id,
      organizationId: profile.organizationId,
      sectorId: id,
    });

    if (result.deliveryStatus === "falhou") {
      return NextResponse.json(
        { message: result.deliveryError, ok: false },
        { status: 502 },
      );
    }

    return NextResponse.json({ message: "Convite reenviado.", ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível reenviar o convite.",
      },
      { status: 400 },
    );
  }
}
