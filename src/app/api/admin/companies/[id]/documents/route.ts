import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getAdminManagementAssetCompany } from "@/lib/data/management-assets-admin-data-source";
import { CustomerDocumentError, deleteCustomerDocument, uploadCustomerDocument } from "@/lib/data/customer-documents-data-source";

async function adminCompany(id: string) {
  const session = await getCurrentAuthSession();
  if (!session) return { error: NextResponse.json({ message: "Entre para continuar." }, { status: 401 }) };
  if (session.user.role !== "superadmin" || session.acquisition || session.leadershipInvitation) {
    return { error: NextResponse.json({ message: "Acesso restrito à operação Directscal." }, { status: 403 }) };
  }
  const company = await getAdminManagementAssetCompany(id);
  if (!company) return { error: NextResponse.json({ message: "Empresa não encontrada." }, { status: 404 }) };
  return { session, company };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await adminCompany((await params).id);
  if (access.error) return access.error;
  if (!access.session || !access.company) return NextResponse.json({ message: "Empresa não encontrada." }, { status: 404 });
  const body = await request.formData().catch(() => null);
  const file = body?.get("file");
  const kind = body?.get("kind");
  const title = body?.get("title");
  const categoryKey = body?.get("categoryKey");
  if (!(file instanceof File) || (kind !== "asset" && kind !== "report") || typeof title !== "string" || (categoryKey !== null && typeof categoryKey !== "string")) {
    return NextResponse.json({ message: "Revise os dados do arquivo." }, { status: 400 });
  }
  try {
    const document = await uploadCustomerDocument({
      organizationId: access.company.organizationId, actorId: access.session.user.id,
      kind, title, categoryKey: categoryKey || null, file,
    });
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("[customer documents] upload failed", error);
    return NextResponse.json({ message: error instanceof CustomerDocumentError ? error.message : "Não foi possível enviar o arquivo." }, { status: error instanceof CustomerDocumentError ? error.status : 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await adminCompany((await params).id);
  if (access.error) return access.error;
  if (!access.company) return NextResponse.json({ message: "Empresa não encontrada." }, { status: 404 });
  const body = await request.json().catch(() => null) as { documentId?: unknown } | null;
  if (typeof body?.documentId !== "string") return NextResponse.json({ message: "Informe o arquivo." }, { status: 400 });
  try {
    await deleteCustomerDocument(body.documentId, access.company.organizationId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: error instanceof CustomerDocumentError ? error.message : "Não foi possível excluir o arquivo." }, { status: error instanceof CustomerDocumentError ? error.status : 500 });
  }
}
