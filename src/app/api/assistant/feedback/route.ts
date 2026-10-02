import { NextResponse } from "next/server";

import { recordAssetAnswerFeedback } from "@/lib/agent/asset-question-service";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { assetAnswerFeedbackInputSchema } from "@/lib/contracts";

export async function POST(request: Request) {
  const session = await getCurrentAuthSession();

  if (!session) {
    return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  }

  if (!canAccessCustomerApp(session.user)) {
    return NextResponse.json(
      { message: "Acesso restrito à área do cliente." },
      { status: 403 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = assetAnswerFeedbackInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Avaliação inválida." }, { status: 400 });
  }

  const access = await getAccessibleOrganizationIdsForUser(session.user.id);

  if (!access.primaryOrganizationId) {
    return NextResponse.json(
      { message: "Organização não encontrada para este usuário." },
      { status: 403 },
    );
  }

  const saved = await recordAssetAnswerFeedback({
    auditId: parsed.data.auditId,
    organizationId: access.primaryOrganizationId,
    userId: session.user.id,
    value: parsed.data.value,
    comment: parsed.data.comment ?? null,
  });

  if (!saved) {
    return NextResponse.json({ message: "Resposta não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
