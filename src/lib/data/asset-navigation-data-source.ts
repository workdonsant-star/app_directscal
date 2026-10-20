import "server-only";
import type { DeleteAssetCategoryInput } from "@/lib/contracts/asset-navigation";
import { assetNavigationPreferencesSchema, type AssetNavigationPreferences } from "@/lib/contracts/asset-navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function getAssetNavigationPreferences(organizationId: string): Promise<AssetNavigationPreferences> {
  const { data, error } = await createSupabaseAdminClient().from("organization_asset_navigation")
    .select("preferences").eq("organization_id", organizationId).maybeSingle();
  if (error) throw error;
  return data ? assetNavigationPreferencesSchema.parse(data.preferences) : { order: [], icons: {} };
}

export async function saveAssetNavigationPreferences(organizationId: string, actorId: string, preferences: AssetNavigationPreferences) {
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("save_asset_navigation_preferences", {
    p_organization_id: organizationId, p_actor_user_id: actorId, p_preferences: { order: preferences.order, icons: preferences.icons },
  });
  if (error) throw error;
  return assetNavigationPreferencesSchema.parse(data);
}

export async function saveAssetCategory(organizationId: string, actorId: string, input: { title: string; key?: string }, previousTitle: string | null) {
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("save_management_asset_category", {
    p_organization_id: organizationId, p_actor_user_id: actorId, p_key: input.key ?? null,
    p_title: input.title, p_previous_title: previousTitle,
  });
  if (error) {
    if (error.code === "23505") throw new Error("Já existe uma categoria com esse nome.");
    if (["PT409", "40001", "22023"].includes(error.code)) throw new Error("A categoria mudou ou o nome não está disponível. Atualize e tente novamente.");
    throw new Error("Não foi possível salvar a categoria.");
  }
  return data;
}

export async function getAssetCategoryDocumentCount(organizationId: string, actorId: string, key: string) {
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("management_asset_category_document_count", {
    p_organization_id: organizationId, p_actor_user_id: actorId, p_key: key,
  });
  if (error) throw error;
  return data;
}

export async function deleteAssetCategory(organizationId: string, actorId: string, input: DeleteAssetCategoryInput, expectedTitle: string) {
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("delete_management_asset_category", {
    p_organization_id: organizationId, p_actor_user_id: actorId, p_key: input.key, p_expected_title: expectedTitle,
    p_destination_key: input.destinationKey ?? null, p_new_title: input.newTitle ?? null,
  });
  if (error) {
    if (error.code === "23505") throw new Error("Já existe uma categoria com esse nome.");
    if (error.code === "22023") throw new Error("Escolha outra categoria de destino ou crie uma nova para receber os documentos.");
    if (["PT409", "40001"].includes(error.code)) throw new Error("A categoria mudou. Atualize a página e tente novamente.");
    throw new Error("Não foi possível excluir a categoria.");
  }
  return data;
}
