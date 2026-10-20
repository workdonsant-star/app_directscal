import { NextResponse } from "next/server";
import { requireAgentOperator } from "@/lib/data/agent-operations-data-source";
import { getRoutineResultBaselines, captureResultBaseline } from "@/lib/data/routine-results-data-source";
import { captureResultBaselineInputSchema } from "@/lib/contracts/routine-results";
import { AssetAdherenceError } from "@/lib/data/asset-adherence-data-source";
const headers = { "Cache-Control": "no-store" };
const failure = (error: unknown) => NextResponse.json({ message: error instanceof AssetAdherenceError ? error.message : "Não foi possível acessar a linha de base." }, { status: error instanceof AssetAdherenceError ? error.status : 500, headers });
export async function GET(_request: Request, { params }: { params: Promise<{id: string}> }) {
 try { await requireAgentOperator(); return NextResponse.json({ items: await getRoutineResultBaselines((await params).id) }, { headers }); } catch (error) { return failure(error); }
}
export async function POST(request: Request, { params }: { params: Promise<{id: string}> }) {
 try {
  await requireAgentOperator(); const input = captureResultBaselineInputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ message: "Selecione o acordo da rotina." }, { status: 400, headers });
  return NextResponse.json({ id: await captureResultBaseline((await params).id, input.data) }, { headers });
 } catch (error) { return failure(error); }
}
