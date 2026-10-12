import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { completeClientOnboarding } from "@/lib/data/client-onboarding-data-source";

export async function POST() {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  if (session.user.role !== "cliente" || session.acquisition || session.leadershipInvitation) {
    return NextResponse.json({ message: "Apenas o dono da empresa pode concluir a configuração." }, { status: 403 });
  }
  try {
    const result = await completeClientOnboarding(session);
    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  } catch {
    return NextResponse.json({ message: "Não foi possível salvar a configuração. Tente novamente." }, { status: 503 });
  }
}
