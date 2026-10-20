import { getCurrentAuthSession } from "@/lib/auth/session";
import { getSlackIdentityStatus, startSlackIdentity, unlinkSlackIdentity, SlackIdentityError } from "@/lib/data/slack-identity-data-source";
const headers = { "Cache-Control": "no-store" };
async function sessionOrFailure() {
  const session = await getCurrentAuthSession();
  if (!session) return Response.json({ message: "Entre para continuar." }, { status: 401, headers });
  if (session.user.role === "superadmin" || session.acquisition || session.leadershipInvitation || !session.supabaseAccessToken) return Response.json({ message: "Entre com uma conta definitiva da empresa." }, { status: 403, headers });
  return session;
}
function failure(error: unknown) {
  return Response.json({ message: error instanceof SlackIdentityError ? error.message : "Não foi possível consultar sua identidade Slack." }, { status: error instanceof SlackIdentityError ? error.status : 500, headers });
}
export async function GET() {
  const session = await sessionOrFailure(); if (session instanceof Response) return session;
  try { return Response.json(await getSlackIdentityStatus(session), { headers }); } catch (error) { return failure(error); }
}
async function write(request: Request, operation: "start" | "unlink") {
  const session = await sessionOrFailure(); if (session instanceof Response) return session;
  const text = await request.text();
  if (text.trim() && text.trim() !== "{}") return Response.json({ message: "Não envie dados de outra conta ou empresa." }, { status: 400, headers });
  try {
    if (operation === "start") return Response.json(await startSlackIdentity(session), { headers });
    await unlinkSlackIdentity(session); return Response.json({ ok: true }, { headers });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) { return write(request, "start"); }
export async function DELETE(request: Request) { return write(request, "unlink"); }
