import "server-only";
import { cache } from "react";

import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import { canAccessCustomerApp } from "@/lib/auth/access-control";
import { getCurrentAuthSession } from "@/lib/auth/session";
import {
  managementAssetDocumentSchema,
  managementAssetSchema,
  type ManagementAsset,
  type ManagementAssetDocument,
  type ManagementAssetType,
} from "@/lib/contracts";
import { getAdminSpecialist } from "@/lib/data/admin-operations-data-source";
import { parseStoredAssetContent } from "@/lib/data/rich-text";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type AssetRow = Pick<
  Database["public"]["Tables"]["management_assets"]["Row"],
  | "id"
  | "organization_id"
  | "type"
  | "title"
  | "description"
  | "category"
  | "owner_label"
  | "review_cycle"
  | "assigned_specialist_id"
  | "current_published_version_id"
>;

type VersionRow = Pick<
  Database["public"]["Tables"]["management_asset_versions"]["Row"],
  "id" | "version_number" | "summary" | "content" | "published_at" | "updated_at"
>;

type AssetWithVersionRow = AssetRow & {
  current_version: VersionRow | null;
};

const assetColumns =
  "id,organization_id,type,title,description,category,owner_label,review_cycle,assigned_specialist_id,current_published_version_id";

export const managementAssetLibraryTypes = [
  "sop",
  "playbook",
  "governanca",
  "raci",
] as const satisfies readonly ManagementAssetType[];

function isLibraryType(value: string): value is ManagementAssetType {
  return (managementAssetLibraryTypes as readonly string[]).includes(value);
}

function getAuthor(specialistId: string | null) {
  const specialist = getAdminSpecialist(specialistId);

  return specialist
    ? { name: specialist.name, role: "Especialista Directscal" }
    : { name: "Directscal", role: "Método e operação" };
}

function mapLibraryAsset(row: AssetWithVersionRow): ManagementAsset | null {
  const version = row.current_version;

  if (!version?.published_at || !isLibraryType(row.type)) return null;

  return managementAssetSchema.parse({
    id: row.id,
    organizationId: row.organization_id,
    type: row.type,
    title: row.title,
    summary: version.summary ?? row.description ?? row.title,
    category: row.category,
    author: getAuthor(row.assigned_specialist_id),
    versionNumber: version.version_number,
    publishedAt: version.published_at,
    updatedAt: version.published_at,
  });
}

// Organizações cuja biblioteca a sessão atual pode ler. O superadmin não
// recebe escopo de cliente e, portanto, nenhuma organização.
async function getReadableOrganizationIds() {
  const session = await getCurrentAuthSession();

  if (!session || !canAccessCustomerApp(session.user)) return [];

  const access = await getAccessibleOrganizationIdsForUser(session.user.id);
  return access.organizationIds;
}

async function selectPublishedAssets(
  organizationIds: string[],
  filter: { type?: ManagementAssetType; id?: string },
) {
  if (organizationIds.length === 0) return [];

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("management_assets")
    .select(
      `${assetColumns},current_version:management_asset_versions!management_assets_current_version_fkey(id,version_number,summary,content,published_at,updated_at)`,
    )
    .in("organization_id", organizationIds)
    .eq("status", "publicado")
    .is("archived_at", null)
    .not("current_published_version_id", "is", null);

  if (filter.type) query = query.eq("type", filter.type);
  if (filter.id) query = query.eq("id", filter.id);

  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .returns<AssetWithVersionRow[]>();

  if (error) throw error;

  return data;
}

export async function getManagementAssetsByType(type: ManagementAssetType) {
  const organizationIds = await getReadableOrganizationIds();
  const rows = await selectPublishedAssets(organizationIds, { type });

  return rows
    .map(mapLibraryAsset)
    .filter((asset): asset is ManagementAsset => asset !== null);
}

const getPublishedAssetsForUser = cache(async (userId: string) => {
  const access = await getAccessibleOrganizationIdsForUser(userId);
  const rows = await selectPublishedAssets(access.organizationIds, {});
  return rows.map(mapLibraryAsset).filter((asset): asset is ManagementAsset => asset !== null);
});

export async function getPublishedManagementAssets() {
  const session = await getCurrentAuthSession();
  if (!session || !canAccessCustomerApp(session.user)) return [];
  return getPublishedAssetsForUser(session.user.id);
}

export async function getManagementAssetDocument(
  type: ManagementAssetType,
  id: string,
): Promise<ManagementAssetDocument | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const organizationIds = await getReadableOrganizationIds();
  const [row] = await selectPublishedAssets(organizationIds, { type, id });

  if (!row) return null;

  const asset = mapLibraryAsset(row);
  const content = parseStoredAssetContent(row.current_version?.content);

  if (!asset || !content || !row.current_version) return null;

  return managementAssetDocumentSchema.parse({
    ...asset,
    versionId: row.current_version.id,
    operationalOwner: row.owner_label ?? asset.author.name,
    reviewCycle: row.review_cycle ?? "Sob demanda",
    content,
  });
}
