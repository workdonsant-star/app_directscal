import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { companyDeletionInputSchema } from "@/lib/contracts/company-deletion";
import { CompanyDeletionError, deleteAdminCompanies } from "@/lib/data/company-deletion-data-source";
import { isFeatureAcquisitionEnabled } from "@/lib/env";

export async function DELETE(request: Request) {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  if (session.user.role !== "superadmin" || session.acquisition || session.leadershipInvitation) {
    return NextResponse.json({ message: "Acesso restrito ao superadmin." }, { status: 403 });
  }
  if (!isFeatureAcquisitionEnabled()) return NextResponse.json({ message: "Recurso indisponível." }, { status: 404 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ message: "Origem não permitida." }, { status: 403 });
  }
  const input = companyDeletionInputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ message: "Revise a seleção e digite EXCLUIR para confirmar." }, { status: 400 });
  try {
    return NextResponse.json(await deleteAdminCompanies(session.user.id, input.data), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ message: error instanceof CompanyDeletionError ? error.message : "Não foi possível excluir as empresas." },
      { status: error instanceof CompanyDeletionError ? error.status : 500 });
  }
}
