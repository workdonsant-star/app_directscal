import { NextResponse } from "next/server";

import { getCurrentAuthSession } from "@/lib/auth/session";
import { managementAssetBulkSelectionSchema, managementAssetBulkUpdateSchema } from "@/lib/contracts";
import { deleteManagementAssets, ManagementAssetError, updateManagementAssetsInBulk } from "@/lib/data/management-assets-admin-data-source";

async function mutate(request: Request, deleting: boolean) {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  if (session.user.role !== "superadmin") {
    return NextResponse.json({ message: "Acesso restrito à operação Directscal." }, { status: 403 });
  }
  const body: unknown = await request.json().catch(() => null);
  try {
    let ids: string[];
    if (deleting) {
      const parsed = managementAssetBulkSelectionSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ message: "Revise os ativos selecionados." }, { status: 400 });
      ids = await deleteManagementAssets(parsed.data);
    } else {
      const parsed = managementAssetBulkUpdateSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ message: "Revise os campos e ativos selecionados." }, { status: 400 });
      ids = await updateManagementAssetsInBulk(parsed.data);
    }
    return NextResponse.json({ ids }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ManagementAssetError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error("[management-assets] bulk mutation failed", error);
    return NextResponse.json({ message: "Não foi possível concluir a ação. Atualize a lista e tente novamente." }, { status: 500 });
  }
}

export async function PATCH(request: Request) { return mutate(request, false); }
export async function DELETE(request: Request) { return mutate(request, true); }
