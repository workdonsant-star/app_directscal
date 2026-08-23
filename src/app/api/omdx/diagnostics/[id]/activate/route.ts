import { NextResponse } from "next/server";

import {
  getDiagnosticOrganizationId,
  userCanAccessDiagnostic,
} from "@/lib/auth/authorization";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { activateDiagnosticInputSchema } from "@/lib/contracts";
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

  if (!(await userCanAccessDiagnostic(session.user.id, id))) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  const activatedAt = new Date().toISOString();
  const parsed = activateDiagnosticInputSchema.safeParse({
    activatedAt,
    diagnosticId: id,
  });

  if (!parsed.success) {
    return NextResponse.json({ message: "Diagnóstico inválido." }, { status: 400 });
  }

  const organizationId = await getDiagnosticOrganizationId(id);

  if (!organizationId) {
    return NextResponse.json(
      { message: "Organização não encontrada para este diagnóstico." },
      { status: 404 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("diagnostics")
    .update({
      activated_at: parsed.data.activatedAt,
      status: "ativo",
    })
    .eq("id", id)
    .eq("status", "rascunho");

  if (error) {
    return NextResponse.json(
      { message: "Não foi possível ativar o diagnóstico." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
