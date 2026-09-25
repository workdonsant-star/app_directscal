import { NextResponse } from "next/server";

import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { createDiagnosticInputSchema } from "@/lib/contracts";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type TemplateRow = {
  id: string;
};

async function getTemplateId(slug: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("diagnostic_templates")
    .select("id")
    .eq("slug", slug)
    .eq("is_locked", true)
    .maybeSingle<TemplateRow>();

  if (error) throw error;

  return data?.id ?? null;
}

export async function POST(request: Request) {
  const session = await getCurrentAuthSession();

  if (!session) {
    return NextResponse.json({ message: "Sessão necessária." }, { status: 401 });
  }

  if (!canAccessCustomerApp(session.user)) {
    return NextResponse.json(
      { message: "Acesso restrito à área do cliente." },
      { status: 403 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = createDiagnosticInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revise os dados do diagnóstico." },
      { status: 400 },
    );
  }

  const access = await getAccessibleOrganizationIdsForUser(session.user.id);
  const organizationId = access.primaryOrganizationId;

  if (!organizationId) {
    return NextResponse.json(
      { message: "Organização não encontrada para este usuário." },
      { status: 403 },
    );
  }

  const templateId = await getTemplateId(parsed.data.templateId);

  if (!templateId) {
    return NextResponse.json(
      { message: "Template de Maturidade indisponível." },
      { status: 409 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: diagnostic, error } = await supabase
    .from("diagnostics")
    .insert({
      deadline: parsed.data.deadline ?? null,
      description: parsed.data.description ?? null,
      name: parsed.data.name,
      organization_id: organizationId,
      created_by_user_id: session.user.id,
      status: "rascunho",
      template_id: templateId,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { message: "Não foi possível criar o diagnóstico." },
      { status: 500 },
    );
  }

  const { error: leadersError } = await supabase
    .schema("app_private")
    .rpc("sync_diagnostic_leaders", {
      p_actor_user_id: session.user.id,
      p_diagnostic_id: diagnostic.id,
      p_person_ids: parsed.data.leaderIds,
    });

  if (leadersError) {
    await supabase.from("diagnostics").delete().eq("id", diagnostic.id);

    return NextResponse.json(
      {
        message:
          leadersError.code === "22023"
            ? leadersError.message
            : "Não foi possível vincular as lideranças ao diagnóstico.",
      },
      { status: leadersError.code === "22023" ? 400 : 500 },
    );
  }

  return NextResponse.json(
    {
      diagnosticId: diagnostic.id,
      links: [],
    },
    { status: 201 },
  );
}
