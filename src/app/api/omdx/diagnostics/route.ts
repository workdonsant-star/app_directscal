import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { getCurrentAuthSession } from "@/lib/auth/session";
import {
  createDiagnosticInputSchema,
  diagnosticShareLinkSchema,
} from "@/lib/contracts";
import { suggestedMessages } from "@/lib/data/omdx-domain";
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
      organization_id: organizationId,
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
  const linkRows = groups.map((group) => {
    const token = `${diagnostic.id}-${group}-${randomUUID()}`;

    return {
      diagnostic_id: diagnostic.id,
      group_id: group,
      token,
    };
  });
  const { data: links, error: linksError } = await supabase
    .from("diagnostic_share_links")
    .insert(linkRows)
    .select("diagnostic_id,group_id,token");

  if (linksError) {
    return NextResponse.json(
      { message: "Diagnóstico criado, mas os links não foram gerados." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      diagnosticId: diagnostic.id,
      links:
        links?.map((link) =>
          diagnosticShareLinkSchema.parse({
            diagnosticId: link.diagnostic_id,
            group: link.group_id,
            token: link.token,
            publicUrl: `${publicBaseUrl}/${link.token}`,
            previewPath: `/r/${link.token}`,
            suggestedMessage: suggestedMessages[link.group_id],
          }),
        ) ?? [],
    },
    { status: 201 },
  );
}
