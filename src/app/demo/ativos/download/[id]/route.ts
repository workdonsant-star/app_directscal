import { demoAssets } from "@/lib/data/demo/demo-data";
import { buildManagementAssetMarkdown } from "@/lib/data/management-asset-markdown";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = demoAssets.find(asset => asset.id === id);
  if (!asset) return new Response("Documento não encontrado.", { status: 404 });
  return new Response(buildManagementAssetMarkdown(asset), { headers: {
    "Content-Type": "text/markdown; charset=utf-8",
    "Content-Disposition": `attachment; filename="${asset.id}-demo.md"`,
    "X-Robots-Tag": "noindex, nofollow",
  } });
}
