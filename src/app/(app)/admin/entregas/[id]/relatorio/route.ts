import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";

import { getCurrentAuthSession } from "@/lib/auth/session";
import {
  getAdminDiagnosticReports,
} from "@/lib/data/omdx-data-source";
import { OmdxReportDocument } from "@/lib/pdf/omdx-report-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentAuthSession();

  if (!session) {
    return new Response("Sessão necessária para baixar o relatório.", {
      status: 401,
    });
  }

  if (session.user.role !== "superadmin") {
    return new Response("Acesso restrito ao superadmin.", { status: 403 });
  }

  const { id } = await params;
  const report = (await getAdminDiagnosticReports(id))[0];

  if (!report) {
    return new Response("Entrega não encontrada.", { status: 404 });
  }

  const document = createElement(OmdxReportDocument, {
    report,
  }) as Parameters<typeof renderToBuffer>[0];
  const pdfBuffer = await renderToBuffer(document);
  const company = normalizeFilePart(report.diagnostic.organizationName);
  const diagnostic = normalizeFilePart(report.diagnostic.name);
  const filename = `relatorio-omdx-${company}-${diagnostic}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.byteLength),
      "Content-Type": "application/pdf",
    },
  });
}
