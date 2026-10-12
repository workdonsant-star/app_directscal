import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { managementAssetTypeSchema } from "@/lib/contracts";
import { getManagementAssetDocument } from "@/lib/data/management-assets-data-source";
import { buildManagementAssetMarkdown } from "@/lib/data/management-asset-markdown";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  const headers = { "Cache-Control": "no-store" };
  const session = await getCurrentAuthSession();
  if (!session) {
    return new Response("Sessão necessária para baixar o ativo.", { status: 401, headers });
  }
  if (!canAccessCustomerApp(session.user)) {
    return new Response("Acesso restrito à área do cliente.", { status: 403, headers });
  }

  const { type, id } = await params;
  const parsedType = managementAssetTypeSchema.safeParse(type);
  const asset = parsedType.success
    ? await getManagementAssetDocument(parsedType.data, id)
    : null;
  if (!asset) {
    return new Response("Ativo não encontrado.", { status: 404, headers });
  }

  const markdown = buildManagementAssetMarkdown(asset);
  const slug = asset.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase().slice(0, 100) || "ativo";

  return new Response(markdown, {
    headers: {
      ...headers,
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.md"`,
      "Content-Length": String(Buffer.byteLength(markdown, "utf8")),
    },
  });
}
