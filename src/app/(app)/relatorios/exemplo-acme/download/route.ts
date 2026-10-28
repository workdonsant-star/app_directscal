import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";

import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { acmeReportEditorial, buildAcmeReportExample } from "@/lib/data/acme-report-example";
import { OmdxEditorialReportDocument } from "@/lib/pdf/omdx-editorial-report-document";
import { OmdxReportDocument } from "@/lib/pdf/omdx-report-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getCurrentAuthSession();
  if (!session) return new Response("Sessão necessária para baixar o relatório.", { status: 401 });
  if (!canAccessCustomerApp(session.user)) return new Response("Acesso restrito à área do cliente.", { status: 403 });

  const dataOnly = new URL(request.url).searchParams.get("conteudo") === "dados";
  const document = createElement(dataOnly ? OmdxReportDocument : OmdxEditorialReportDocument, {
    report: buildAcmeReportExample(),
    editorial: acmeReportEditorial,
    example: true,
  }) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(document);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${dataOnly ? "dados" : "relatorio"}-maturidade-acme-exemplo.pdf"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
