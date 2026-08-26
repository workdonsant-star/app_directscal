import { NextResponse } from "next/server";
import { z } from "zod";

import {
  CompanyRegistryLookupError,
  lookupCompanyByCnpj,
} from "@/lib/data/company-registry-data-source";

const inputSchema = z.object({ cnpj: z.string().min(1) });

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Informe um CNPJ válido." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await lookupCompanyByCnpj(parsed.data.cnpj));
  } catch (error) {
    if (error instanceof CompanyRegistryLookupError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "Não foi possível consultar o CNPJ agora." },
      { status: 503 },
    );
  }
}
