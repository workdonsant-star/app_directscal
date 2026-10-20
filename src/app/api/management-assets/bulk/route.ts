import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/access-control";
import { customerAssetBulkUpdateSchema } from "@/lib/contracts/management-asset-update";
import { CustomerAssetUpdateError, updateCustomerAssetsInBulk } from "@/lib/data/management-asset-update-data-source";

export async function PATCH(request: Request) {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  if (!canManageOrganization(session.user) || session.acquisition || session.leadershipInvitation) {
    return NextResponse.json({ message: "Apenas o dono da empresa pode alterar os ativos." }, { status: 403 });
  }
  const parsed = customerAssetBulkUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Selecione até 1.000 ativos e escolha o tipo ou a categoria." }, { status: 400 });
  try {
    const result = await updateCustomerAssetsInBulk(session.user.id, parsed.data);
    return NextResponse.json({ result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof CustomerAssetUpdateError) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error("[management-assets] bulk metadata update failed");
    return NextResponse.json({ message: "Não foi possível alterar os ativos. Tente novamente." }, { status: 500 });
  }
}
