import { NextResponse } from "next/server";

import { getCurrentAuthSession } from "@/lib/auth/session";
import { createManagementAssetInputSchema } from "@/lib/contracts";
import {
  createManagementAsset,
  ManagementAssetError,
} from "@/lib/data/management-assets-admin-data-source";

export async function POST(request: Request) {
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
  const parsed = createManagementAssetInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revise os dados do ativo." },
      { status: 400 },
    );
  }

  try {
    const assetId = await createManagementAsset(session.user.id, parsed.data);
    return NextResponse.json({ assetId }, { status: 201 });
  } catch (error) {
    if (error instanceof ManagementAssetError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("[management-assets] create failed", error);
    return NextResponse.json(
      { message: "Não foi possível criar o ativo." },
      { status: 500 },
    );
  }
}
