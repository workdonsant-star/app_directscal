import { getCurrentAuthSession } from "@/lib/auth/session";
import { routineContactPolicyInputSchema } from "@/lib/contracts/routine-contacts";
import { getRoutineContactPolicy, saveRoutineContactPolicy } from "@/lib/data/routine-contact-data-source";
import { AssetAdherenceError } from "@/lib/data/asset-adherence-data-source";
const headers = { "Cache-Control": "no-store" };
type Context = { params: Promise<{ id: string }> };
async function auth() {
  const session = await getCurrentAuthSession();
  if (!session) return Response.json({ message: "Entre para continuar." }, { status: 401, headers });
  if (session.user.role !== "superadmin" || session.acquisition || session.leadershipInvitation) return Response.json({ message: "Acesso restrito à operação DirectScal." }, { status: 403, headers });
  return session;
}
function failure(error: unknown) { return Response.json({ message: error instanceof AssetAdherenceError ? error.message : "Não foi possível acessar a configuração." }, { status: error instanceof AssetAdherenceError ? error.status : 500, headers }); }
export async function GET(_request: Request, { params }: Context) {
  const session = await auth(); if (session instanceof Response) return session;
  try { return Response.json({ policy: await getRoutineContactPolicy((await params).id, session.user.id) }, { headers }); } catch (error) { return failure(error); }
}
export async function POST(request: Request, { params }: Context) {
  const session = await auth(); if (session instanceof Response) return session;
  const input = routineContactPolicyInputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ message: "Revise público, dias, horário e limites de contato." }, { status: 400, headers });
  try { return Response.json({ revision: await saveRoutineContactPolicy((await params).id, session.user.id, input.data) }, { headers }); } catch (error) { return failure(error); }
}
