import { NextResponse } from "next/server";

import { getCurrentAuthSession } from "@/lib/auth/session";
import { getAdminAcquisitionSnapshot } from "@/lib/data/acquisition-data-source";

export async function GET() {
  const session = await getCurrentAuthSession();

  if (!session) {
    return NextResponse.json(
      { message: "Entre para continuar." },
      { status: 401 },
    );
  }

  if (session.user.role !== "superadmin") {
    return NextResponse.json(
      { message: "Acesso restrito ao superadmin." },
      { status: 403 },
    );
  }

  try {
    return NextResponse.json(await getAdminAcquisitionSnapshot());
  } catch {
    return NextResponse.json(
      { message: "Não foi possível carregar aquisição." },
      { status: 500 },
    );
  }
}
