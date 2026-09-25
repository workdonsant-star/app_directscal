import { NextResponse } from "next/server";

import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { userCanManageDiagnostic } from "@/lib/auth/authorization";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { closeDiagnosticInputSchema } from "@/lib/contracts";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const session = await getCurrentAuthSession();
  const { id } = await params;

  if (!session) {
    return NextResponse.json({ message: "Sessão necessária." }, { status: 401 });
  }

  if (!canAccessCustomerApp(session.user)) {
    return NextResponse.json(
      { message: "Acesso restrito à área do cliente." },
      { status: 403 },
    );
  }

  if (!(await userCanManageDiagnostic(session.user.id, id))) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  const closedAt = new Date().toISOString();
  const parsed = closeDiagnosticInputSchema.safeParse({
    closedAt,
    diagnosticId: id,
  });

  if (!parsed.success) {
    return NextResponse.json({ message: "Diagnóstico inválido." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("diagnostics")
    .update({
      closed_at: parsed.data.closedAt,
      status: "encerrado",
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { message: "Não foi possível encerrar a coleta." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
