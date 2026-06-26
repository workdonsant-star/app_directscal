import { NextResponse } from "next/server";

import { idSchema } from "@/lib/contracts/omdx";
import { deleteCurrentOperationalMember } from "@/lib/data/operational-onboarding-data-source";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const parsed = idSchema.safeParse(id);

  if (!parsed.success) {
    return NextResponse.json({ message: "Pessoa inválida." }, { status: 400 });
  }

  try {
    await deleteCurrentOperationalMember(parsed.data);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível excluir a pessoa.";
    const status =
      message === "Sessão necessária."
        ? 401
        : message === "Pessoa não encontrada."
          ? 404
          : 500;

    return NextResponse.json({ message }, { status });
  }
}
