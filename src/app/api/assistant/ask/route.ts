import { NextResponse } from "next/server";

import { answerAssetQuestion } from "@/lib/agent/asset-question-service";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { askAssetQuestionInputSchema } from "@/lib/contracts";

export const maxDuration = 60;

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
  const parsed = askAssetQuestionInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Escreva uma pergunta com ao menos 3 caracteres." },
      { status: 400 },
    );
  }

  const access = await getAccessibleOrganizationIdsForUser(session.user.id);

  if (!access.primaryOrganizationId) {
    return NextResponse.json(
      { message: "Organização não encontrada para este usuário." },
      { status: 403 },
    );
  }

  const answer = await answerAssetQuestion({
    organizationId: access.primaryOrganizationId,
    question: parsed.data.question,
    channel: "app",
    userId: session.user.id,
    history: parsed.data.history,
  });

  return NextResponse.json({ answer });
}
