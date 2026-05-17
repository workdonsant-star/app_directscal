import { NextResponse } from "next/server";

import { userCanAccessDiagnostic } from "@/lib/auth/authorization";
import { getCurrentAuthSession } from "@/lib/auth/session";
import {
  deleteDiagnosticInputSchema,
  updateDiagnosticDraftInputSchema,
} from "@/lib/contracts";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getCurrentAuthSession();
  const { id } = await params;

  if (!session) {
    return NextResponse.json({ message: "Sessão necessária." }, { status: 401 });
  }

  if (!(await userCanAccessDiagnostic(session.user.id, id))) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = updateDiagnosticDraftInputSchema.safeParse({
    ...(body && typeof body === "object" ? body : {}),
    diagnosticId: id,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revise os dados do diagnóstico." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("diagnostics")
    .update({
      deadline: parsed.data.deadline ?? null,
      description: parsed.data.description ?? null,
      name: parsed.data.name,
    })
    .eq("id", id)
    .eq("status", "rascunho");

  if (error) {
    return NextResponse.json(
      { message: "Não foi possível atualizar o diagnóstico." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getCurrentAuthSession();
  const { id } = await params;

  if (!session) {
    return NextResponse.json({ message: "Sessão necessária." }, { status: 401 });
  }

  const parsed = deleteDiagnosticInputSchema.safeParse({ diagnosticId: id });

  if (!parsed.success) {
    return NextResponse.json({ message: "Diagnóstico inválido." }, { status: 400 });
  }

  if (!(await userCanAccessDiagnostic(session.user.id, id))) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("diagnostics").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { message: "Não foi possível excluir o diagnóstico." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
