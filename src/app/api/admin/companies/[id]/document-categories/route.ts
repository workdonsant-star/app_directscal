import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { assetCategoryInputSchema } from "@/lib/contracts/asset-navigation";
import { createCustomerDocumentCategory, CustomerDocumentError } from "@/lib/data/customer-documents-data-source";
import { getAdminManagementAssetCompany } from "@/lib/data/management-assets-admin-data-source";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  if (session.user.role !== "superadmin" || session.acquisition || session.leadershipInvitation) return NextResponse.json({ message: "Acesso restrito à operação Directscal." }, { status: 403 });
  const parsed = assetCategoryInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.key) return NextResponse.json({ message: "Informe o nome da pasta." }, { status: 400 });
  const company = await getAdminManagementAssetCompany((await params).id);
  if (!company) return NextResponse.json({ message: "Empresa não encontrada." }, { status: 404 });
  try {
    const category = await createCustomerDocumentCategory(company.organizationId, session.user.id, parsed.data.title);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof CustomerDocumentError ? error.message : "Não foi possível criar a pasta." }, { status: error instanceof CustomerDocumentError ? error.status : 500 });
  }
}
