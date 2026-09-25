import { NextResponse } from "next/server";

import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { userCanManageDiagnostic } from "@/lib/auth/authorization";
import { getCurrentAuthSession } from "@/lib/auth/session";
import {
  activateDiagnosticInputSchema,
  diagnosticShareLinkSchema,
} from "@/lib/contracts";
import { suggestedMessages } from "@/lib/data/omdx-domain";
import { getPublicAppUrl } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

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

  const activatedAt = new Date().toISOString();
  const parsed = activateDiagnosticInputSchema.safeParse({
    activatedAt,
    diagnosticId: id,
  });

  if (!parsed.success) {
    return NextResponse.json({ message: "Diagnóstico inválido." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .schema("app_private")
    .rpc("activate_diagnostic_with_links", {
      p_activated_at: parsed.data.activatedAt,
      p_actor_user_id: session.user.id,
      p_diagnostic_id: id,
    });

  if (error) {
    return NextResponse.json(
      {
        message:
          error.code === "22023" || error.code === "P0002"
            ? error.message
            : "Não foi possível ativar o diagnóstico.",
      },
      {
        status:
          error.code === "42501"
            ? 403
            : error.code === "22023"
              ? 400
              : error.code === "P0002"
                ? 404
                : 500,
      },
    );
  }

  type ShareLinkRow =
    Database["public"]["Tables"]["diagnostic_share_links"]["Row"];
  type SectorRow = Pick<
    Database["public"]["Tables"]["organization_sectors"]["Row"],
    "id" | "name"
  >;

  const { data: linkRows, error: linksError } = await supabase
    .from("diagnostic_share_links")
    .select("id,diagnostic_id,group_id,sector_id,token,created_at,expires_at")
    .eq("diagnostic_id", id)
    .returns<ShareLinkRow[]>();

  if (linksError) {
    return NextResponse.json(
      { message: "Diagnóstico ativado, mas os links não puderam ser carregados." },
      { status: 500 },
    );
  }

  const sectorIds = linkRows
    .map((link) => link.sector_id)
    .filter((sectorId): sectorId is string => Boolean(sectorId));
  const sectorsResult =
    sectorIds.length > 0
      ? await supabase
          .from("organization_sectors")
          .select("id,name")
          .in("id", sectorIds)
          .returns<SectorRow[]>()
      : { data: [] as SectorRow[], error: null };

  if (sectorsResult.error) {
    return NextResponse.json(
      { message: "Diagnóstico ativado, mas os setores não puderam ser carregados." },
      { status: 500 },
    );
  }

  const sectorNamesById = new Map(
    sectorsResult.data.map((sector) => [sector.id, sector.name]),
  );
  const publicBaseUrl = `${getPublicAppUrl()}/r`;
  const links = linkRows.map((link) => {
    const sectorName = link.sector_id
      ? sectorNamesById.get(link.sector_id) ?? null
      : null;

    return diagnosticShareLinkSchema.parse({
      id: link.id,
      diagnosticId: link.diagnostic_id,
      group: link.group_id,
      sectorId: link.sector_id,
      sectorName,
      token: link.token,
      publicUrl: `${publicBaseUrl}/${link.token}`,
      previewPath: `/r/${link.token}`,
      suggestedMessage:
        link.group_id === "operacao" && sectorName
          ? `Compartilhe este link com o time de ${sectorName}. As respostas são anônimas e entram na leitura consolidada da empresa.`
          : suggestedMessages[link.group_id],
    });
  });

  return NextResponse.json({ links, ok: true });
}
