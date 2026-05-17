import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";

import { getCurrentAuthSession } from "@/lib/auth/session";
import {
  getDiagnosticById,
  getDiagnosticReport,
} from "@/lib/data/omdx-data-source";
import { OmdxReportDocument } from "@/lib/pdf/omdx-report-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReportRouteContext = {
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

export async function GET(_request: Request, { params }: ReportRouteContext) {
  const session = await getCurrentAuthSession();

  if (!session) {
    return new Response("Sessão necessária para baixar o relatório.", {
      status: 401,
    });
  }

  const { id } = await params;
  const diagnostic = await getDiagnosticById(id);

  if (!diagnostic) {
    return new Response("Diagnóstico não encontrado.", { status: 404 });
  }

  const report = await getDiagnosticReport(id);

  if (!report) {
    return new Response("Relatório indisponível para este diagnóstico.", {
      status: 409,
    });
  }

  const document = createElement(OmdxReportDocument, {
    report,
  }) as Parameters<typeof renderToBuffer>[0];
  const pdfBuffer = await renderToBuffer(document);
  const company = normalizeFilePart(report.diagnostic.company);
  const filename = `relatorio-omdx-${company}-${report.diagnostic.id}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.byteLength),
      "Content-Type": "application/pdf",
    },
  });
}
