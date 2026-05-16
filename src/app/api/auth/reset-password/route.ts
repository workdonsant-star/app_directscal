import { NextResponse } from "next/server";

import { resetPasswordInputSchema } from "@/lib/contracts";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Informe o e-mail da conta." },
      { status: 400 },
    );
  }

  const parsed = resetPasswordInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Informe um e-mail válido." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      message:
        "Se o e-mail existir no ambiente, enviaremos instruções de recuperação.",
    },
    { status: 200 },
  );
}
