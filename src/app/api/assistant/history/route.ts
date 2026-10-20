import { NextResponse } from "next/server";
import { getOwnAssistantHistory } from "@/lib/data/assistant-history-data-source";
import { AssetAdherenceError } from "@/lib/data/asset-adherence-data-source";
export async function GET(request: Request) {
 const headers = { "Cache-Control": "no-store" };
 try {
  const params = new URL(request.url).searchParams;
  if ([...params.keys()].some(key => key !== "cursor") || params.getAll("cursor").length > 1) return NextResponse.json({ message: "Página de histórico inválida." }, { status: 400, headers });
  return NextResponse.json(await getOwnAssistantHistory(params.get("cursor") ?? undefined), { headers });
 } catch (error) {
  return NextResponse.json({ message: error instanceof AssetAdherenceError ? error.message : "Não foi possível consultar o histórico." }, { status: error instanceof AssetAdherenceError ? error.status : 500, headers });
 }
}
