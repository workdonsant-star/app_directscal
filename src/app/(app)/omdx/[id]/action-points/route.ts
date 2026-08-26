import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";

import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import {
  getDiagnosticActionPlan,
  getDiagnosticById,
} from "@/lib/data/omdx-data-source";
import { OmdxActionPlanDocument } from "@/lib/pdf/omdx-action-plan-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ActionPointsRouteContext = {
  params: Promise<{ id: string }>;
};

function normalizeFilePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export async function GET(
  _request: Request,
  { params }: ActionPointsRouteContext,
) {
  const session = await getCurrentAuthSession();

  if (!session) {
    return new Response("Sessão necessária para baixar os action points.", {
      status: 401,
    });
  }

  if (!canAccessCustomerApp(session.user)) {
    return new Response("Acesso restrito à área do cliente.", { status: 403 });
  }

  const { id } = await params;
  const diagnostic = await getDiagnosticById(id);

  if (!diagnostic) {
    return new Response("Diagnóstico não encontrado.", { status: 404 });
  }

  const plan = await getDiagnosticActionPlan(id);

  if (!plan) {
    return new Response("Action points indisponíveis para este diagnóstico.", {
      status: 409,
    });
  }

  const document = createElement(OmdxActionPlanDocument, {
    plan,
  }) as Parameters<typeof renderToBuffer>[0];
  const pdfBuffer = await renderToBuffer(document);
  const company = normalizeFilePart(plan.diagnostic.company);
  const filename = `action-points-omdx-${company}-${plan.diagnostic.id}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.byteLength),
      "Content-Type": "application/pdf",
    },
  });
}
