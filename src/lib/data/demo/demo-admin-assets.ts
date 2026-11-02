import { adminManagementAssetDetailSchema, managementAssetDocumentSchema, managementAssetTransitionInputSchema, quickCreateManagementAssetInputSchema, updateManagementAssetInputSchema, managementAssetBulkUpdateSchema, type AdminManagementAssetDetail } from "@/lib/contracts/management-assets";
import { managementAssetTemplates } from "@/lib/data/management-asset-templates";
import { legacySopContentToRichText } from "@/lib/data/rich-text";
import { demoAssets, DEMO_COMPANY, DEMO_DATE } from "./demo-data";
import { demoAdminSpecialists } from "./demo-admin-data";
import type { DemoState } from "./demo-state";

export const DEMO_ADMIN_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";
export const demoAdminId = (index: number) => `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
export function demoAdminAssetId(id: string) {
  const index = demoAssets.findIndex(asset => asset.id === id);
  return index < 0 ? id : demoAdminId(100 + index);
}
export function getDemoAdminAssets(state: DemoState): AdminManagementAssetDetail[] {
  const documents = state.assets ?? demoAssets;
  const overrides = state.adminAssets ?? [];
  const initial = documents.filter(document => !state.adminDeletedAssetIds?.includes(demoAdminAssetId(document.id))).map((document) => {
    const index = demoAssets.findIndex(asset => asset.id === document.id);
    const published = { id: demoAdminId(200 + index), versionNumber: document.versionNumber, status: "publicado" as const, changeNote: null, createdAt: DEMO_DATE, updatedAt: document.updatedAt, publishedAt: document.publishedAt, indexStatus: "pronto" as const, indexError: null, content: document.content };
    return adminManagementAssetDetailSchema.parse({ id: demoAdminAssetId(document.id), organizationId: DEMO_ADMIN_ORGANIZATION_ID, organizationName: DEMO_COMPANY, type: document.type, title: document.title, summary: document.summary, category: document.category, ownerLabel: document.operationalOwner, specialistId: demoAdminSpecialists[0].id, status: "publicado", archivedAt: null, updatedAt: document.updatedAt, revision: { assetUpdatedAt: document.updatedAt, draftId: null, draftUpdatedAt: null }, draft: null, published, versions: [published], chunkCount: 1, embeddedChunkCount: 0 });
  });
  return [...initial.filter(asset => !overrides.some(item => item.id === asset.id)), ...overrides].filter(asset => !state.adminDeletedAssetIds?.includes(asset.id));
}

export function demoAdminAssetList(state: DemoState) {
  return getDemoAdminAssets(state).map(asset => ({ ...asset, draftStatus: asset.draft?.status ?? null, publishedVersionNumber: asset.published?.versionNumber ?? null }));
}

function storeAsset(state: DemoState, asset: AdminManagementAssetDetail): DemoState {
  const originals = state.assets ?? demoAssets;
  const source = originals.find(document => demoAdminAssetId(document.id) === asset.id) ?? demoAssets.find(document => demoAdminAssetId(document.id) === asset.id);
  const remaining = originals.filter(document => demoAdminAssetId(document.id) !== asset.id);
  const specialist = (state.adminSpecialists ?? demoAdminSpecialists).find(item => item.id === asset.specialistId);
  const document = asset.status === "publicado" && asset.published ? managementAssetDocumentSchema.parse({ id: source?.id ?? asset.id, organizationId: "demo-vertex", type: asset.type, title: asset.title, summary: asset.summary, category: asset.category, author: { name: specialist?.name ?? "Directscal", role: specialist?.title ?? "Estruturação empresarial" }, versionNumber: asset.published.versionNumber, publishedAt: asset.published.publishedAt, updatedAt: asset.updatedAt, versionId: asset.published.id, operationalOwner: asset.ownerLabel ?? "Directscal", content: asset.published.content }) : null;
  return { ...state, adminAssets: [...(state.adminAssets ?? []).filter(item => item.id !== asset.id), asset], assets: [...remaining, ...(document ? [document] : [])] };
}

export function applyDemoAdminAssetRequest(state: DemoState, pathname: string, method: string, body: unknown) {
  const match = pathname.match(/^\/api\/admin\/management-assets(?:\/([^/]+))?(?:\/(transition))?$/);
  if (!match) return null;
  const result = (response: unknown, next = state, status?: number) => ({ body: response, state: next, status });
  const fail = (message: string, status = 400) => result({ message }, state, status);
  const assets = getDemoAdminAssets(state);
  const [, id, transition] = match;
  if (!id && method === "POST") {
    const input = quickCreateManagementAssetInputSchema.parse(body);
    if (input.organizationId !== DEMO_ADMIN_ORGANIZATION_ID) return fail("Empresa não encontrada.", 404);
    const template = managementAssetTemplates.find(item => item.type === input.type)!;
    const versionId = crypto.randomUUID();
    const draft = { id: versionId, versionNumber: "1", status: "rascunho" as const, changeNote: null, createdAt: DEMO_DATE, updatedAt: DEMO_DATE, publishedAt: null, indexStatus: "pendente" as const, indexError: null, content: legacySopContentToRichText(template.content) };
    const asset = adminManagementAssetDetailSchema.parse({ id: crypto.randomUUID(), organizationId: DEMO_ADMIN_ORGANIZATION_ID, organizationName: DEMO_COMPANY, type: input.type, title: `Novo ${input.type === "raci" ? "RACI" : input.type === "governanca" ? "ativo de governança" : input.type.toUpperCase()}`, summary: "Descreva o objetivo e quando este ativo deve ser consultado.", ownerLabel: "Definir responsável", specialistId: null, category: input.category, status: "rascunho", archivedAt: null, updatedAt: DEMO_DATE, revision: { assetUpdatedAt: DEMO_DATE, draftId: versionId, draftUpdatedAt: DEMO_DATE }, draft, published: null, versions: [draft], chunkCount: 0, embeddedChunkCount: 0 });
    return result({ assetId: asset.id }, storeAsset(state, asset));
  }
  if (id === "bulk" && (method === "PATCH" || method === "DELETE")) {
    const selection = method === "PATCH" ? managementAssetBulkUpdateSchema.parse(body) : managementAssetBulkUpdateSchema.omit({ changes: true }).parse(body);
    if (selection.organizationId !== DEMO_ADMIN_ORGANIZATION_ID || selection.assetIds.some(id => !assets.some(asset => asset.id === id))) return fail("Ativo não encontrado.", 404);
    if (method === "DELETE") {
      if (selection.assetIds.includes(demoAdminId(100)) || state.adminRoutineChanges?.some(change => change.operation === "salvar" && selection.assetIds.includes(change.assetId))) return fail("O ativo tem histórico de rotina. Arquive para preservar os vínculos.");
      return result({ ids: selection.assetIds }, { ...state, adminAssets: assets.filter(asset => !selection.assetIds.includes(asset.id)), adminDeletedAssetIds: [...new Set([...(state.adminDeletedAssetIds ?? []), ...selection.assetIds])], assets: (state.assets ?? demoAssets).filter(asset => !selection.assetIds.includes(demoAdminAssetId(asset.id))) });
    }
    const { changes } = managementAssetBulkUpdateSchema.parse(body);
    if (assets.some(asset => selection.assetIds.includes(asset.id) && asset.status === "arquivado")) return fail("Restaure os ativos antes de editar.");
    if (changes.specialistId && !(state.adminSpecialists ?? demoAdminSpecialists).some(item => item.id === changes.specialistId && item.status === "ativo" && !item.archived)) return fail("Selecione um especialista ativo.");
    let next = state;
    for (const asset of assets.filter(asset => selection.assetIds.includes(asset.id))) {
      const updatedAt = new Date(new Date(asset.updatedAt).getTime() + 1).toISOString();
      next = storeAsset(next, { ...asset, ...changes, updatedAt, revision: { ...asset.revision, assetUpdatedAt: updatedAt } });
    }
    return result({ ids: selection.assetIds }, next);
  }
  const current = assets.find(asset => asset.id === id);
  if (!current) return fail("Ativo não encontrado.", 404);
  if (method === "GET") return result({ asset: current });
  let asset = structuredClone(current);
  // A revisão avança mesmo com as datas fixas do cenário.
  const updatedAt = new Date(new Date(asset.updatedAt).getTime() + 1).toISOString();
  if (!transition && method === "PATCH") {
    const input = updateManagementAssetInputSchema.parse(body);
    if (JSON.stringify(input.expectedRevision) !== JSON.stringify(asset.revision)) return fail("O ativo foi atualizado. Reabra a versão vigente.", 409);
    if (asset.status === "arquivado") return fail("Restaure o ativo antes de editar.");
    if (input.specialistId && !(state.adminSpecialists ?? demoAdminSpecialists).some(item => item.id === input.specialistId && item.status === "ativo" && !item.archived)) return fail("Selecione um especialista ativo.");
    if (input.content && !asset.draft) return fail("Abra uma versão em rascunho antes de editar.");
    asset = { ...asset, title: input.title, summary: input.summary, category: input.category, ownerLabel: input.ownerLabel, specialistId: input.specialistId, draft: asset.draft ? { ...asset.draft, changeNote: input.changeNote, content: input.content ?? asset.draft.content, updatedAt } : null };
  } else if (transition && method === "POST") {
    const { action } = managementAssetTransitionInputSchema.parse(body);
    if (action === "abrir_rascunho") {
      if (asset.status === "arquivado") return fail("Restaure o ativo antes de editar.");
      if (!asset.draft && asset.published) asset.draft = { ...asset.published, id: crypto.randomUUID(), versionNumber: String(Math.max(...asset.versions.map(version => Number(version.versionNumber))) + 1), status: "rascunho", createdAt: updatedAt, updatedAt, publishedAt: null, indexStatus: "pendente", changeNote: null };
    } else if (action === "publicar") {
      if (!asset.draft || asset.status === "arquivado") return fail("Nenhum rascunho disponível para publicar.");
      if (asset.title.startsWith("Novo ") || asset.ownerLabel === "Definir responsável") return fail("Defina o título e o responsável antes de publicar.");
      asset.published = { ...asset.draft, status: "publicado", updatedAt, publishedAt: updatedAt, indexStatus: "pronto" };
      asset.draft = null;
      asset.status = "publicado";
    } else if (action === "arquivar") { asset.status = "arquivado"; asset.archivedAt = updatedAt; }
    else if (action === "restaurar") { asset.status = asset.published ? "publicado" : "rascunho"; asset.archivedAt = null; }
    else return fail("A indexação externa não é executada na demo.");
  } else return fail("Ação indisponível.", 404);
  const versions = new Map(asset.versions.map(version => [version.id, version]));
  if (asset.published) for (const [id, version] of versions) if (version.status === "publicado" && id !== asset.published.id) versions.set(id, { ...version, status: "substituido" });
  if (asset.published) versions.set(asset.published.id, asset.published);
  if (asset.draft) versions.set(asset.draft.id, asset.draft);
  asset = adminManagementAssetDetailSchema.parse({ ...asset, updatedAt, revision: { assetUpdatedAt: updatedAt, draftId: asset.draft?.id ?? null, draftUpdatedAt: asset.draft?.updatedAt ?? null }, versions: [...versions.values()] });
  return result({ asset }, storeAsset(state, asset));
}
