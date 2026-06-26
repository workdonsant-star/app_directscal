import { NextResponse } from "next/server";

import { getCurrentAuthSession } from "@/lib/auth/session";
import { adminModuleAccessInputSchema } from "@/lib/contracts";
import { saveOrganizationModuleAccess } from "@/lib/data/acquisition-data-source";
import { getAdminModuleById } from "@/lib/data/admin-data-source";

export async function PATCH(request: Request) {
  const session = await getCurrentAuthSession();

  if (!session) {
    return NextResponse.json(
      { message: "Entre para continuar." },
      { status: 401 },
    );
  }

  if (session.user.role !== "superadmin") {
    return NextResponse.json(
      { message: "Acesso restrito ao superadmin." },
      { status: 403 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Envie os dados do acesso." },
      { status: 400 },
    );
  }

  const parsed = adminModuleAccessInputSchema.safeParse(body);

  if (!parsed.success || !getAdminModuleById(parsed.data.moduleId)) {
    return NextResponse.json(
      { message: "Revise o cliente e o módulo selecionados." },
      { status: 400 },
    );
  }

  try {
    const access = await saveOrganizationModuleAccess(parsed.data);

    return NextResponse.json({ access, ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar o acesso.",
      },
      { status: 400 },
    );
  }
}
