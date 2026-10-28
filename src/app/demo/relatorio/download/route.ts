import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { demoReportEditorial, demoReport, demoReports } from "@/lib/data/demo/demo-data";
import { OmdxEditorialReportDocument } from "@/lib/pdf/omdx-editorial-report-document";
import { OmdxReportDocument } from "@/lib/pdf/omdx-report-document";

import { buildDiagnosticReportCsv } from "@/lib/data/omdx-report-csv";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("diagnostico");
  const report = id ? demoReports.find(report => report.diagnostic.id === id) : demoReport;
  if (!report) return new Response("Relatório não encontrado.", { status: 404 });
  if (new URL(request.url).searchParams.get("formato") === "csv") return new Response(buildDiagnosticReportCsv(report), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="relatorio-vertex.csv"' } });
  const dataOnly = new URL(request.url).searchParams.get("conteudo") === "dados";
  const document = createElement(dataOnly ? OmdxReportDocument : OmdxEditorialReportDocument, { report, editorial: demoReportEditorial(report), example: true }) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(document);
  return new Response(new Uint8Array(buffer), { headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${dataOnly ? "dados" : "diagnostico"}-vertex-logistics-demo.pdf"`,
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
  } });
}
