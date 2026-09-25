import { NextResponse } from "next/server";

import { canManageOrganization } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { createOrganizationSectorInputSchema } from "@/lib/contracts";
import { createOrganizationSectorAndInvite } from "@/lib/data/organization-structure-data-source";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";

export async function POST(request: Request) {
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

  const body: unknown = await request.json().catch(() => null);
  const parsed = createOrganizationSectorInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revise os dados do setor e da liderança." },
      { status: 400 },
    );
  }

  try {
    const profile = await getProfileSettingsData(session.user);
    const result = await createOrganizationSectorAndInvite({
      companyName: profile.company,
      createdBy: session.user.id,
      input: parsed.data,
      organizationId: profile.organizationId,
    });

    if (result.deliveryStatus === "falhou") {
      return NextResponse.json(
        {
          message: result.deliveryError,
          ok: false,
          persisted: true,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { message: "Setor cadastrado e convite enviado.", ok: true },
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
