import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { adminCompanyActionPointInputSchema } from "@/lib/contracts/admin-company-action-points";
import { AdminCompanyActionPointError, getAdminCompanyActionPoints, saveAdminCompanyActionPoint } from "@/lib/data/admin-company-action-points";
import { startManualActionPointFollowup } from "@/lib/data/manual-action-point-followups";
import { z } from "zod";

type Context = { params: Promise<{ id: string }> };
const headers = { "Cache-Control": "no-store" };

async function access() {
  const session = await getCurrentAuthSession();
  if (!session) return { error: NextResponse.json({ message: "Entre para continuar." }, { status: 401, headers }) };
  if (session.user.role !== "superadmin" || session.acquisition || session.leadershipInvitation) return { error: NextResponse.json({ message: "Acesso restrito à operação Directscal." }, { status: 403, headers }) };
  return { session };
}

function failure(error: unknown) {
  return NextResponse.json({ message: error instanceof AdminCompanyActionPointError ? error.message : "Não foi possível concluir a operação." }, { status: error instanceof AdminCompanyActionPointError ? error.status : 500, headers });
}

export async function GET(_request: Request, { params }: Context) {
  const result = await access();
  if (result.error) return result.error;
  try { return NextResponse.json(await getAdminCompanyActionPoints((await params).id), { headers }); }
  catch (error) { return failure(error); }
}

export async function POST(request: Request, { params }: Context) {
  const result = await access();
  if (result.error) return result.error;
  const parsed = adminCompanyActionPointInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Revise os campos do action point." }, { status: 400, headers });
  try { return NextResponse.json(await saveAdminCompanyActionPoint((await params).id, result.session!.user.id, parsed.data), { headers }); }
  catch (error) { return failure(error); }
}

export async function PUT(request: Request, { params }: Context) {
  const result = await access();
  if (result.error) return result.error;
  const parsed = z.object({ actionPointId: z.uuid() }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Selecione um action point válido." }, { status: 400, headers });
  try { return NextResponse.json(await startManualActionPointFollowup((await params).id, result.session!.user.id, parsed.data.actionPointId), { headers }); }
  catch (error) { return failure(error); }
}
