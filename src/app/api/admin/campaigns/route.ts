import { NextResponse } from "next/server";

import { getCurrentAuthSession } from "@/lib/auth/session";
import { acquisitionCampaignSchema } from "@/lib/contracts";
import { saveAcquisitionCampaignToSupabase } from "@/lib/data/acquisition-data-source";

async function saveCampaign(request: Request) {
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

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Envie os dados da campanha." },
      { status: 400 },
    );
  }

  const parsed = acquisitionCampaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revise os dados da campanha." },
      { status: 400 },
    );
  }

  try {
    const campaign = await saveAcquisitionCampaignToSupabase(parsed.data);

    return NextResponse.json({ campaign, ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a campanha.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  return saveCampaign(request);
}

export async function PUT(request: Request) {
  return saveCampaign(request);
}
