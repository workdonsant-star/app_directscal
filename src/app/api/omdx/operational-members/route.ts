import { NextResponse } from "next/server";

import {
  OperationalMemberDomainError,
  submitOperationalMemberRegistration,
} from "@/lib/data/operational-onboarding-data-source";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);

  try {
    const member = await submitOperationalMemberRegistration(body);

    return NextResponse.json(
      { memberId: member.id, ok: true, status: member.status },
      { status: 201 },
    );
  } catch (error) {
    const status =
      error instanceof OperationalMemberDomainError
        ? 403
        : error instanceof Error &&
            error.message === "Este link não é válido ou foi desativado."
          ? 404
          : 400;

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível registrar o cadastro.",
      },
      { status },
    );
  }
}
