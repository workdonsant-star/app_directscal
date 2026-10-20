import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { adminRoutineWriteSchema } from "@/lib/contracts/admin-adherence";
import { AssetAdherenceError } from "@/lib/data/asset-adherence-data-source";
import { getAdminRoutineDirectory, getAdminRoutineWorkspace, writeAdminRoutine } from "@/lib/data/admin-adherence-data-source";

type Context = { params: Promise<{ id: string }> };
const headers = { "Cache-Control": "no-store" };
function failure(error: unknown) {
  return NextResponse.json({ message: error instanceof AssetAdherenceError ? error.message : "Não foi possível concluir a operação das rotinas." }, { status: error instanceof AssetAdherenceError ? error.status : 500, headers });
}

export async function GET(request: Request, { params }: Context) {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401, headers });
  if (session.user.role !== "superadmin" || session.acquisition || session.leadershipInvitation) return NextResponse.json({ message: "Acesso restrito à operação DirectScal." }, { status: 403, headers });
  try {
    const { id } = await params;
    return NextResponse.json(new URL(request.url).searchParams.get("directory") === "1"
      ? { users: await getAdminRoutineDirectory(id, session.user.id) }
      : { workspace: await getAdminRoutineWorkspace(id, session.user.id) }, { headers });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request, { params }: Context) {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401, headers });
  if (session.user.role !== "superadmin" || session.acquisition || session.leadershipInvitation) return NextResponse.json({ message: "Acesso restrito à operação DirectScal." }, { status: 403, headers });
  const input = adminRoutineWriteSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ message: "Revise a origem, o responsável e os campos da rotina." }, { status: 400, headers });
  try {
    const { id } = await params;
    const result = await writeAdminRoutine(id, session.user.id, input.data);
    return NextResponse.json({ result }, { headers });
  } catch (error) { return failure(error); }
}
