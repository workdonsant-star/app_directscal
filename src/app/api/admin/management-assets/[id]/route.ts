import { NextResponse } from "next/server";

import { getCurrentAuthSession } from "@/lib/auth/session";
import { updateManagementAssetInputSchema } from "@/lib/contracts";
import {
  getAdminManagementAssetDetail,
  ManagementAssetError,
  updateManagementAsset,
} from "@/lib/data/management-assets-admin-data-source";

export async function PATCH(
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
  const parsed = updateManagementAssetInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message:
          parsed.error.issues.find((issue) => issue.path[0] === "content")
            ? "O conteúdo contém um formato não suportado."
            : "Revise os dados do ativo.",
      },
      { status: 400 },
    );
  }

  try {
    const { id } = await params;
    await updateManagementAsset(session.user.id, id, parsed.data);
    const asset = await getAdminManagementAssetDetail(id);

    return NextResponse.json({ asset });
  } catch (error) {
    if (error instanceof ManagementAssetError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("[management-assets] update failed", error);
    return NextResponse.json(
      { message: "Não foi possível salvar o ativo." },
      { status: 500 },
    );
  }
}
