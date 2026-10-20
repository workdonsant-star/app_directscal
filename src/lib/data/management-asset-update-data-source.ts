import "server-only";
import { getPublishedManagementAssets, getPublishedManagementAssetFolders } from "@/lib/data/management-assets-data-source";
import type { CustomerAssetBulkUpdate } from "@/lib/contracts/management-asset-update";
import type { CustomerManagementAssetUpdate } from "@/lib/contracts/management-asset-update";
import { buildManagementAssetChunks } from "@/lib/data/management-asset-indexer";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export class CustomerAssetUpdateError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function updateCustomerManagementAsset(actorId: string, assetId: string, input: CustomerManagementAssetUpdate) {
  const chunks = buildManagementAssetChunks(input);
  if (!chunks.length) throw new CustomerAssetUpdateError("Escreva o conteúdo antes de salvar.", 400);
  const { data, error } = await createSupabaseAdminClient().schema("app_private")
    .rpc("update_customer_management_asset", {
      p_actor_user_id: actorId,
      p_asset_id: assetId,
      p_expected_version_id: input.expectedVersionId,
      p_title: input.title,
      p_summary: input.summary,
      p_content: input.content as unknown as Json,
      p_chunks: chunks.map((chunk) => ({ heading_path: chunk.headingPath, content: chunk.content, token_count: chunk.tokenCount })),
    });
  if (error) {
    if (error.code === "42501") throw new CustomerAssetUpdateError("Você não tem permissão para editar este ativo.", 403);
    if (error.code === "P0002") throw new CustomerAssetUpdateError("Ativo não encontrado.", 404);
    if (["PT409", "55P03", "40001", "23505", "22023"].includes(error.code)) throw new CustomerAssetUpdateError("O ativo foi atualizado ou possui uma revisão aberta. Preserve seu texto e atualize a página antes de tentar novamente.", 409);
    throw error;
  }
  return data;
}

export async function updateCustomerAssetsInBulk(actorId: string, input: CustomerAssetBulkUpdate) {
  const published = await getPublishedManagementAssets();
  const selected = published.filter(asset => input.assetIds.includes(asset.id));
  if (selected.length !== input.assetIds.length || new Set(selected.map(asset => asset.organizationId)).size !== 1) {
    throw new CustomerAssetUpdateError("Selecione ativos disponíveis de uma única empresa e atualize a lista.", 409);
  }
  const folders = await getPublishedManagementAssetFolders();
  const folder = folders.find(item => item.key === input.changes.categoryKey);
  if (input.changes.categoryKey !== undefined && !folder) {
    throw new CustomerAssetUpdateError("Selecione uma das pastas de Ativos de gestão.", 400);
  }
  const changes = {
    ...(input.changes.type !== undefined ? { type: input.changes.type } : {}),
    ...(folder ? { category: folder.key === "sem categoria" ? null : folder.title } : {}),
  };
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("update_customer_assets_metadata", {
    p_actor_user_id: actorId, p_asset_ids: input.assetIds, p_changes: changes,
  });
  if (error) {
    if (error.code === "42501") throw new CustomerAssetUpdateError("Apenas o dono da empresa pode alterar estes ativos.", 403);
    if (["PT409", "40001", "22023"].includes(error.code)) throw new CustomerAssetUpdateError("Alguns ativos mudaram ou não estão disponíveis. Atualize a lista e tente novamente.", 409);
    throw error;
  }
  return data;
}
