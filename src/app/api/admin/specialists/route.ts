import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { getSpecialists, mutateSpecialist } from "@/lib/data/person-profiles-data-source";
import { persistedAvatarSchema } from "@/lib/contracts/profile";

const fields = z.object({
  name: z.string().trim().min(1).max(160), email: z.string().email().max(320),
  title: z.string().trim().min(1).max(160), location: z.string().trim().min(1).max(160),
  avatarUrl: persistedAvatarSchema, status: z.enum(["ativo", "inativo"]),
  archived: z.boolean(), deleted: z.boolean(),
});
const createInput = fields.pick({ name: true, email: true, title: true, location: true }).strict();
const updateInput = fields.partial().extend({ id: z.string().min(1).max(100) }).strict();

async function mutate(request: Request, creating: boolean) {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  if (session.user.role !== "superadmin") return NextResponse.json({ message: "Acesso restrito." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const parsed = creating ? createInput.safeParse(body) : updateInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Revise os dados do especialista." }, { status: 400 });
  try {
    await mutateSpecialist(parsed.data, creating);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "Não foi possível salvar o especialista." }, { status: 500 });
  }
}
export async function POST(request: Request) { return mutate(request, true); }
export async function PATCH(request: Request) { return mutate(request, false); }
export async function GET() {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({}, { status: 401 });
  if (session.user.role !== "superadmin") return NextResponse.json({}, { status: 403 });
  return NextResponse.json({ specialists: (await getSpecialists()).filter((item) => !item.deleted) }, { headers: { "Cache-Control": "no-store" } });
}
