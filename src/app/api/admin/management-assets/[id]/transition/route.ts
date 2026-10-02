import { NextResponse } from "next/server";

import { getCurrentAuthSession } from "@/lib/auth/session";
import { managementAssetTransitionInputSchema } from "@/lib/contracts";
import {
  getAdminManagementAssetDetail,
  ManagementAssetError,
  transitionManagementAsset,
} from "@/lib/data/management-assets-admin-data-source";

// Publicação inclui geração de embeddings; o limite padrão pode ser curto.
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentAuthSession();

  if (!session) {
    return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  }

  if (session.user.role !== "superadmin") {
    return NextResponse.json(
      { message: "Acesso restrito à operação Directscal." },
      { status: 403 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = managementAssetTransitionInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Ação inválida." }, { status: 400 });
  }

  try {
    const { id } = await params;
    const { notice } = await transitionManagementAsset(
      session.user.id,
      id,
      parsed.data.action,
    );
    const asset = await getAdminManagementAssetDetail(id);

    return NextResponse.json({ asset, notice });
  } catch (error) {
    if (error instanceof ManagementAssetError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("[management-assets] transition failed", error);
    return NextResponse.json(
      { message: "Não foi possível concluir a ação." },
      { status: 500 },
    );
  }
}
