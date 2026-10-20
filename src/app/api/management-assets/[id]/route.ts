import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { canManageOrganization } from "@/lib/auth/access-control";
import { customerManagementAssetUpdateSchema } from "@/lib/contracts/management-asset-update";
import { CustomerAssetUpdateError, updateCustomerManagementAsset } from "@/lib/data/management-asset-update-data-source";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  if (!canManageOrganization(session.user) || session.acquisition || session.leadershipInvitation) {
    return NextResponse.json({ message: "Apenas o dono da empresa pode editar os ativos." }, { status: 403 });
  }
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ message: "Ativo não encontrado." }, { status: 404 });
  const parsed = customerManagementAssetUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Revise o título, o resumo e o conteúdo do ativo." }, { status: 400 });
  try {
    const result = await updateCustomerManagementAsset(session.user.id, id, parsed.data);
    return NextResponse.json({ result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof CustomerAssetUpdateError) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error("[management-assets] customer update failed");
    return NextResponse.json({ message: "Não foi possível salvar o ativo. Seu texto permanece no editor." }, { status: 500 });
  }
}
