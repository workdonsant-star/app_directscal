import { getCurrentAuthSession } from "@/lib/auth/session";
import { routineEventInputSchema } from "@/lib/contracts/routine-contacts";
import { openRoutineEventContact } from "@/lib/data/routine-contact-data-source";
import { AssetAdherenceError } from "@/lib/data/asset-adherence-data-source";
const headers = { "Cache-Control": "no-store" };
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentAuthSession();
  if (!session) return Response.json({ message: "Entre para continuar." }, { status: 401, headers });
  if (session.user.role !== "superadmin" || session.acquisition || session.leadershipInvitation) return Response.json({ message: "Acesso restrito à operação DirectScal." }, { status: 403, headers });
  const input = routineEventInputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ message: "Revise a ocorrência, a referência e os horários." }, { status: 400, headers });
  try { return Response.json(await openRoutineEventContact((await params).id, session.user.id, input.data), { headers }); }
  catch (error) { return Response.json({ message: error instanceof AssetAdherenceError ? error.message : "Não foi possível registrar a ocorrência." }, { status: error instanceof AssetAdherenceError ? error.status : 500, headers }); }
}
