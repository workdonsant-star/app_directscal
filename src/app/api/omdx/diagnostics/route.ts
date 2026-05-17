import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { userCanAccessOrganization } from "@/lib/auth/authorization";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { createDiagnosticInputSchema } from "@/lib/contracts";
import { getPublicAppUrl } from "@/lib/env";
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

  const body: unknown = await request.json().catch(() => null);
  const parsed = createDiagnosticInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revise os dados do diagnóstico." },
      { status: 400 },
    );
  }

  if (
    !(await userCanAccessOrganization(
      session.user.id,
      parsed.data.organizationId,
    ))
  ) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  const templateId = await getTemplateId(parsed.data.templateId);

  if (!templateId) {
    return NextResponse.json(
      { message: "Template OMDx indisponível." },
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
      organization_id: parsed.data.organizationId,
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

  const groups = ["fundador", "lideranca", "operacao"] as const;
  const publicBaseUrl = `${getPublicAppUrl()}/r`;
  const { error: linksError } = await supabase.from("diagnostic_share_links").insert(
    groups.map((group) => {
      const token = `${diagnostic.id}-${group}-${randomUUID()}`;

      return {
        diagnostic_id: diagnostic.id,
        group_id: group,
        token,
      };
    }),
  );

  if (linksError) {
    return NextResponse.json(
      { message: "Diagnóstico criado, mas os links não foram gerados." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      diagnosticId: diagnostic.id,
      linksBaseUrl: publicBaseUrl,
    },
    { status: 201 },
  );
}
