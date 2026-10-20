import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { routineSupervisionInputSchema } from "@/lib/contracts/routine-supervision";
import { AssetAdherenceError } from "@/lib/data/asset-adherence-data-source";
import { getRoutineSupervision, saveRoutineSupervision } from "@/lib/data/routine-supervision-data-source";
type Context = { params: Promise<{ id: string }> };
const headers = { "Cache-Control": "no-store" };
async function authorize() {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401, headers });
  if (session.user.role !== "superadmin" || session.acquisition || session.leadershipInvitation) return NextResponse.json({ message: "Acesso restrito à operação DirectScal." }, { status: 403, headers });
  return session;
}
function failure(error: unknown) {
  return NextResponse.json({ message: error instanceof AssetAdherenceError ? error.message : "Não foi possível concluir a revisão da rotina." }, { status: error instanceof AssetAdherenceError ? error.status : 500, headers });
}
export async function GET(_request: Request, { params }: Context) {
  const session = await authorize(); if (session instanceof NextResponse) return session;
  try { return NextResponse.json({ items: await getRoutineSupervision((await params).id, session.user.id) }, { headers }); }
  catch (error) { return failure(error); }
}
export async function POST(request: Request, { params }: Context) {
  const session = await authorize(); if (session instanceof NextResponse) return session;
  const input = routineSupervisionInputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ message: "Revise o ciclo, a justificativa e os campos da decisão." }, { status: 400, headers });
  try { return NextResponse.json({ id: await saveRoutineSupervision((await params).id, session.user.id, input.data) }, { headers }); }
  catch (error) { return failure(error); }
}
