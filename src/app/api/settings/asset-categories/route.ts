import { NextResponse } from "next/server";
import { canManageOrganization } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import { assetCategoryInputSchema, deleteAssetCategoryInputSchema } from "@/lib/contracts/asset-navigation";
import { saveAssetCategory, deleteAssetCategory, getAssetCategoryDocumentCount } from "@/lib/data/asset-navigation-data-source";
import { getProfileSettingsData } from "@/lib/data/profile-data-source";
import { getPublishedManagementAssetFolders } from "@/lib/data/management-assets-data-source";

async function save(request: Request, rename: boolean) {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  if (!canManageOrganization(session.user) || session.acquisition || session.leadershipInvitation) {
    return NextResponse.json({ message: "Apenas o dono da empresa pode editar categorias." }, { status: 403 });
  }
  const parsed = assetCategoryInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || rename !== Boolean(parsed.data?.key)) return NextResponse.json({ message: "Informe um nome de até 80 caracteres." }, { status: 400 });
  try {
    const profile = await getProfileSettingsData(session.user);
    const folders = await getPublishedManagementAssetFolders();
    const previous = folders.find(folder => folder.key === parsed.data.key);
    if (rename && !previous) return NextResponse.json({ message: "Categoria não encontrada. Atualize a página." }, { status: 409 });
    const result = await saveAssetCategory(profile.organizationId, session.user.id, parsed.data, previous?.title ?? null);
    return NextResponse.json(result, { status: rename ? 200 : 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error && ["Já existe uma categoria com esse nome.", "A categoria mudou ou o nome não está disponível. Atualize e tente novamente."].includes(error.message)
      ? error.message : "Não foi possível salvar a categoria.";
    return NextResponse.json({ message }, { status: 409 });
  }
}
export async function POST(request: Request) { return save(request, false); }
export async function PATCH(request: Request) { return save(request, true); }

export async function GET(request: Request) {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  if (!canManageOrganization(session.user) || session.acquisition || session.leadershipInvitation) return NextResponse.json({ message: "Apenas o dono pode editar categorias." }, { status: 403 });
  const key = new URL(request.url).searchParams.get("key");
  if (!key || key.length > 160) return NextResponse.json({ message: "Informe a categoria." }, { status: 400 });
  try {
    const profile = await getProfileSettingsData(session.user);
    const count = await getAssetCategoryDocumentCount(profile.organizationId, session.user.id, key);
    return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ message: "Não foi possível consultar os documentos da categoria." }, { status: 409 }); }
}

export async function DELETE(request: Request) {
  const session = await getCurrentAuthSession();
  if (!session) return NextResponse.json({ message: "Entre para continuar." }, { status: 401 });
  if (!canManageOrganization(session.user) || session.acquisition || session.leadershipInvitation) return NextResponse.json({ message: "Apenas o dono pode excluir categorias." }, { status: 403 });
  const parsed = deleteAssetCategoryInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Revise a categoria e o destino." }, { status: 400 });
  try {
    const profile = await getProfileSettingsData(session.user);
    const folders = await getPublishedManagementAssetFolders();
    const source = folders.find(folder => folder.key === parsed.data.key);
    if (!source) return NextResponse.json({ message: "Categoria não encontrada. Atualize a página." }, { status: 409 });
    if (parsed.data.destinationKey && (parsed.data.destinationKey === source.key || !folders.some(folder => folder.key === parsed.data.destinationKey))) {
      return NextResponse.json({ message: "Escolha outra categoria de destino." }, { status: 400 });
    }
    const result = await deleteAssetCategory(profile.organizationId, session.user.id, parsed.data, source.title);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const allowed = ["Já existe uma categoria com esse nome.", "Escolha outra categoria de destino ou crie uma nova para receber os documentos.", "A categoria mudou. Atualize a página e tente novamente."];
    const message = error instanceof Error && allowed.includes(error.message) ? error.message : "Não foi possível excluir a categoria.";
    return NextResponse.json({ message }, { status: 409 });
  }
}
