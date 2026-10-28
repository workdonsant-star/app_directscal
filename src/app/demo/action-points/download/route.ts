import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { demoActionPlan, demoReport, demoReports } from "@/lib/data/demo/demo-data";
import { OmdxActionPlanDocument } from "@/lib/pdf/omdx-action-plan-document";
export const runtime = "nodejs";
export async function GET(request: Request) {
 const id = new URL(request.url).searchParams.get("diagnostico");
 const report = id ? demoReports.find(r => r.diagnostic.id === id) : demoReport;
 if (!report) return new Response("Diagnóstico não encontrado.", { status: 404 });
 const document = createElement(OmdxActionPlanDocument, { plan: demoActionPlan(report) }) as Parameters<typeof renderToBuffer>[0];
 const buffer = await renderToBuffer(document);
 return new Response(new Uint8Array(buffer), { headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="action-points-vertex.pdf"', "Cache-Control": "no-store" } });
}
