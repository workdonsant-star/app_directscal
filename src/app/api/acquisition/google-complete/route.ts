import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "../../../../../auth";
import {
  acquisitionOauthIntentCookieName,
  completeAcquisitionGoogleLead,
  consumeAcquisitionOauthIntent,
  getAcquisitionOauthIntent,
  isAcquisitionSessionMismatchError,
} from "@/lib/data/acquisition-data-source";
import {
  authSessionCookieName,
  getAuthCookieOptions,
} from "@/lib/auth/mock-auth";

const googleCompleteInputSchema = z.object({
  token: z.string().min(1),
  values: z.record(z.string(), z.string()),
});

function clearCampaignCookies(response: NextResponse) {
  response.cookies.set(authSessionCookieName, "", {
    ...getAuthCookieOptions(false),
    maxAge: 0,
  });
  response.cookies.set(acquisitionOauthIntentCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json(
      { message: "Entre com Google para continuar." },
      { status: 401 },
    );
  }

  if (session.acquisition !== true) {
    return NextResponse.json(
      { message: "Entre pelo link da campanha para continuar." },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Envie os dados da empresa para continuar." },
      { status: 400 },
    );
  }

  const parsed = googleCompleteInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revise os dados da empresa." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const intentToken = cookieStore.get(acquisitionOauthIntentCookieName)?.value;
  const intent = await getAcquisitionOauthIntent(intentToken);

  if (!intent || intent.campaign.token !== parsed.data.token) {
    return NextResponse.json(
      { message: "A sessão de campanha expirou. Abra o link novamente." },
      { status: 409 },
    );
  }

  try {
    const lead = await completeAcquisitionGoogleLead({
      email: session.user.email,
      name: session.user.name,
      token: parsed.data.token,
      userId: session.user.id,
      values: parsed.data.values,
    });
    await consumeAcquisitionOauthIntent(intentToken);

    const response = NextResponse.json({ lead, ok: true }, { status: 201 });
    clearCampaignCookies(response);

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível completar o acesso.",
      },
      { status: isAcquisitionSessionMismatchError(error) ? 409 : 400 },
    );
  }
}
