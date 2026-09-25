import { NextResponse } from "next/server";

import { getCurrentAuthSession } from "@/lib/auth/session";
import { adminDeliveryMutationSchema } from "@/lib/contracts/admin-operations";
import {
  adminActionPointTemplates,
  getAdminSpecialist,
} from "@/lib/data/admin-operations-data-source";
import { saveAdminDeliveryPublication } from "@/lib/data/admin-delivery-data-source";

const actionPointIds = new Set(
  adminActionPointTemplates.map((actionPoint) => actionPoint.id),
);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
      { message: "Envie os dados da entrega." },
      { status: 400 },
    );
  }

  const parsed = adminDeliveryMutationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revise o conteúdo da entrega." },
      { status: 400 },
    );
  }

  if (
    (parsed.data.specialistId &&
      !getAdminSpecialist(parsed.data.specialistId)) ||
    parsed.data.selectedActionPointIds.some((id) => !actionPointIds.has(id))
  ) {
    return NextResponse.json(
      { message: "A entrega contém uma seleção inválida." },
      { status: 400 },
    );
  }

  try {
    const { id } = await params;
    const publication = await saveAdminDeliveryPublication({
      actorUserId: session.user.id,
      diagnosticId: id,
      input: parsed.data,
    });

    return NextResponse.json({ ok: true, publication });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a entrega.",
      },
      { status: 400 },
    );
  }
}
