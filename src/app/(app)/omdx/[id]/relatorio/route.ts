import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";

import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getAdminDeliveryPublication } from "@/lib/data/admin-delivery-data-source";
import {
  getDiagnosticById,
  getDiagnosticReport,
} from "@/lib/data/omdx-data-source";
import { buildDiagnosticReportCsv } from "@/lib/data/omdx-report-csv";
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

export async function GET(request: Request, { params }: ReportRouteContext) {
  const session = await getCurrentAuthSession();

  if (!session) {
    return new Response("Sessão necessária para baixar o relatório.", {
      status: 401,
    });
  }

  if (!canAccessCustomerApp(session.user)) {
    return new Response("Acesso restrito à área do cliente.", { status: 403 });
  }

  const { id } = await params;
  const [diagnostic, publication] = await Promise.all([
    getDiagnosticById(id),
    getAdminDeliveryPublication(id),
  ]);

  if (!diagnostic) {
    return new Response("Diagnóstico não encontrado.", { status: 404 });
  }

  if (publication?.status !== "publicada") {
    return new Response("Relatório ainda não publicado.", { status: 404 });
  }

  const report = await getDiagnosticReport(id);

  if (!report) {
    return new Response("Relatório indisponível para este diagnóstico.", {
      status: 409,
    });
  }

  const format = new URL(request.url).searchParams.get("formato");
  const company = normalizeFilePart(report.diagnostic.company);

  if (format === "csv") {
    const csv = buildDiagnosticReportCsv(report);
    const csvBuffer = new TextEncoder().encode(csv);
    const filename = `relatorio-omdx-${company}-${report.diagnostic.id}.csv`;

    return new Response(csvBuffer, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(csvBuffer.byteLength),
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  }

  const document = createElement(OmdxReportDocument, {
    report,
  }) as Parameters<typeof renderToBuffer>[0];
  const pdfBuffer = await renderToBuffer(document);
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
