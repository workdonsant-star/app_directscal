import { getCurrentAuthSession } from "@/lib/auth/session";
import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { downloadCustomerDocument, getCustomerDocument } from "@/lib/data/customer-documents-data-source";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentAuthSession();
  if (!session) return new Response("Entre para continuar.", { status: 401 });
  if (session.acquisition || session.leadershipInvitation) return new Response("Acesso negado.", { status: 403 });
  const document = await getCustomerDocument((await params).id);
  if (!document) return new Response("Arquivo não encontrado.", { status: 404 });
  if (session.user.role !== "superadmin") {
    const access = await getAccessibleOrganizationIdsForUser(session.user.id);
    if (!access.organizationIds.some(organizationId => organizationId === document.organization_id)) return new Response("Arquivo não encontrado.", { status: 404 });
  }
  try {
    const file = await downloadCustomerDocument(document);
    const safeName = document.file_name.replace(/[\r\n"\\]/g, "_");
    return new Response(file, {
      headers: {
        "Content-Type": document.mime_type,
        "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(document.file_name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Não foi possível baixar o arquivo.", { status: 500 });
  }
}
