import { NextResponse } from "next/server";
import { agentGapInputSchema } from "@/lib/contracts/agent-operations";
import { requireAgentOperator, saveAgentGap } from "@/lib/data/agent-operations-data-source";
import { AssetAdherenceError } from "@/lib/data/asset-adherence-data-source";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { "Cache-Control": "no-store" };
  try {
    await requireAgentOperator();
    const input = agentGapInputSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) return NextResponse.json({ message: "Revise responsável, status, justificativa e evidência." }, { status: 400, headers });
    const id = await saveAgentGap((await params).id, input.data);
    return NextResponse.json({ id }, { headers });
  } catch (error) {
    return NextResponse.json({ message: error instanceof AssetAdherenceError ? error.message : "Não foi possível registrar a revisão." }, { status: error instanceof AssetAdherenceError ? error.status : 500, headers });
  }
}
