import { after } from "next/server";
import { z } from "zod";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { listSlackDeliveries, retrySlackDelivery, SlackOperationsError } from "@/lib/data/slack-delivery-operations";
import { processSlackDelivery } from "@/lib/integrations/slack-delivery";
const headers = { "Cache-Control": "no-store" };
type Context = { params: Promise<{ id: string }> };
const inputSchema = z.object({ id: z.uuid(), expectedUpdatedAt: z.iso.datetime({ offset: true }) }).strict();
async function auth() {
  const session = await getCurrentAuthSession();
  if (!session) return Response.json({ message: "Entre para continuar." }, { status: 401, headers });
  if (session.user.role !== "superadmin" || session.acquisition || session.leadershipInvitation) return Response.json({ message: "Acesso restrito à operação DirectScal." }, { status: 403, headers });
  return session;
}
function failure(error: unknown) {
  return Response.json({ message: error instanceof SlackOperationsError ? error.message : "Não foi possível concluir a operação." }, { status: error instanceof SlackOperationsError ? error.status : 500, headers });
}
export async function GET(request: Request, { params }: Context) {
  const session = await auth(); if (session instanceof Response) return session;
  try { return Response.json(await listSlackDeliveries((await params).id, session.user.id, new URL(request.url).searchParams.get("cursor")), { headers }); }
  catch (error) { return failure(error); }
}
export async function POST(request: Request, { params }: Context) {
  const session = await auth(); if (session instanceof Response) return session;
  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ message: "Revise a entrega e sua versão." }, { status: 400, headers });
  try {
    await retrySlackDelivery((await params).id, session.user.id, input.data.id, input.data.expectedUpdatedAt);
    after(async () => { try { await processSlackDelivery(input.data.id); } catch { console.error("[slack] retry processing unavailable"); } });
    return Response.json({ message: "Entrega recolocada na fila." }, { headers });
  } catch (error) { return failure(error); }
}
