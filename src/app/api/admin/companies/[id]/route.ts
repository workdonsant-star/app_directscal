import { NextResponse } from "next/server";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { companySpecialistInputSchema } from "@/lib/contracts/admin-operations";
import { CompanyAssignmentError, saveCompanySpecialistAssignment } from "@/lib/data/admin-company-operations-data-source";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  if (session.user.role !== "superadmin") return NextResponse.json({ message: "Acesso restrito ao superadmin." }, { status: 403 });
  const input = companySpecialistInputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ message: "Revise a atribuição." }, { status: 400 });
  try {
    const { id } = await params;
    const assignment = await saveCompanySpecialistAssignment(id, session.user.id, input.data);
    return NextResponse.json({ assignment });
  } catch (error) {
    return NextResponse.json({ message: error instanceof CompanyAssignmentError ? error.message : "Não foi possível salvar a atribuição." }, { status: error instanceof CompanyAssignmentError ? error.status : 500 });
  }
}
