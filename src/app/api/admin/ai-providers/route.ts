import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAuthSession } from "@/lib/auth/session";
import {
  agentProviderSchema,
  disconnectAgentProvider,
  getAgentProviderOverview,
  saveAgentProvider,
  testAgentProvider,
} from "@/lib/data/agent-provider-data-source";

export const runtime = "nodejs";
export const maxDuration = 60;

const inputSchema = z.object({
  provider: agentProviderSchema,
  model: z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9._:-]+$/),
  apiKey: z.string().trim().min(8).max(500).optional(),
  select: z.boolean().optional(),
}).strict();

async function authorized() {
  const session = await getCurrentAuthSession();
  return session?.user.role === "superadmin" && !session.acquisition && !session.leadershipInvitation ? session : null;
}

function failed(error: unknown) {
  const message = error instanceof Error && /^(Chave recusada|Modelo não encontrado|Informe uma chave|O provedor respondeu)/.test(error.message)
    ? error.message : "Não foi possível consultar o provedor. Tente novamente.";
  return NextResponse.json({ message }, { status: 502 });
}

export async function GET() {
  if (!await authorized()) return NextResponse.json({ message: "Acesso restrito." }, { status: 403 });
  return NextResponse.json({ providers: await getAgentProviderOverview() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!await authorized()) return NextResponse.json({ message: "Acesso restrito." }, { status: 403 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Revise o provedor, modelo e chave." }, { status: 400 });
  try {
    await testAgentProvider(parsed.data.provider, parsed.data.model, parsed.data.apiKey);
    return NextResponse.json({ ok: true });
  } catch (error) { return failed(error); }
}

export async function PUT(request: Request) {
  const session = await authorized();
  if (!session) return NextResponse.json({ message: "Acesso restrito." }, { status: 403 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Revise o provedor, modelo e chave." }, { status: 400 });
  try {
    await saveAgentProvider({ actorId: session.user.id, ...parsed.data });
    return NextResponse.json({ providers: await getAgentProviderOverview() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failed(error); }
}

export async function DELETE(request: Request) {
  if (!await authorized()) return NextResponse.json({ message: "Acesso restrito." }, { status: 403 });
  const parsed = z.object({ provider: agentProviderSchema }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Provedor inválido." }, { status: 400 });
  try {
    await disconnectAgentProvider(parsed.data.provider);
    return NextResponse.json({ providers: await getAgentProviderOverview() }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ message: "Não foi possível desconectar o provedor." }, { status: 500 }); }
}
