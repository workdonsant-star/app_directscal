import "server-only";

import { embedTexts, toPgVector } from "@/lib/agent/embeddings";
import {
  adminAssetQuestionAuditSchema,
  adminManagementAssetDetailSchema,
  adminManagementAssetListItemSchema,
  emptyRichTextDocument,
  type AdminAssetQuestionAudit,
  type AdminManagementAssetDetail,
  type AdminManagementAssetListItem,
  type CreateManagementAssetInput,
  type ManagementAssetStatus,
  type ManagementAssetTransition,
  type ManagementAssetVersionStatus,
  type ManagementAssetBulkSelection,
  type ManagementAssetBulkUpdate,
  type RichTextDocument,
  type UpdateManagementAssetInput,
} from "@/lib/contracts";
import { canAssignSpecialist } from "@/lib/data/person-profiles-data-source";
import {
  buildManagementAssetChunks,
  getChunkEmbeddingText,
} from "@/lib/data/management-asset-indexer";
import { getManagementAssetTemplate } from "@/lib/data/management-asset-templates";
import { getManagementAssetReview } from "@/lib/data/management-asset-review";
import {
  isRichTextEmpty,
  legacySopContentToRichText,
  parseStoredAssetContent,
} from "@/lib/data/rich-text";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";

type AssetRow = Database["public"]["Tables"]["management_assets"]["Row"];
type VersionRow = Database["public"]["Tables"]["management_asset_versions"]["Row"];

export class ManagementAssetError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409 | 500 = 400,
  ) {
    super(message);
  }
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(value: string, message = "Ativo não encontrado.") {
  if (!uuidPattern.test(value)) throw new ManagementAssetError(message, 404);
}

function toIso(value: string) {
  return new Date(value).toISOString();
}

function toIsoOrNull(value: string | null) {
  return value ? toIso(value) : null;
}

function contentToJson(content: RichTextDocument) {
  return content as unknown as Json;
}

// O estado do ativo comunica o que o cliente enxerga. Antes da primeira
// publicação, ele espelha o estado editorial do rascunho.
function deriveAssetStatus(
  asset: Pick<AssetRow, "archived_at" | "current_published_version_id">,
  draftStatus: ManagementAssetVersionStatus | null,
): ManagementAssetStatus {
  if (asset.archived_at) return "arquivado";
  if (asset.current_published_version_id) return "publicado";
  if (draftStatus === "em_revisao" || draftStatus === "pronto_para_publicar") {
    return draftStatus;
  }

  return "rascunho";
}

async function getOrganizationNames(organizationIds: string[]) {
  if (organizationIds.length === 0) return new Map<string, string>();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id,name")
    .in("id", Array.from(new Set(organizationIds)));

  if (error) throw error;

  return new Map(data.map((row) => [row.id, row.name]));
}

export async function listAdminOrganizations() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id,name")
    .order("name", { ascending: true });

  if (error) throw error;

  return data.map((row) => ({ id: row.id, name: row.name }));
}

export async function getAdminManagementAssetCompany(companyId: string) {
  const organizations = await listAdminOrganizations();
  const organization = organizations.find((item) => `company_${item.id}` === companyId);
  return organization
    ? { id: companyId, organizationId: organization.id, name: organization.name }
    : null;
}

export async function listAdminManagementAssets(organizationId?: string): Promise<
  AdminManagementAssetListItem[]
> {
  const supabase = createSupabaseAdminClient();
  const assetQuery = supabase.from("management_assets").select("*");
  if (organizationId) {
    assertUuid(organizationId, "Empresa não encontrada.");
    assetQuery.eq("organization_id", organizationId);
  }
  const [{ data: assets, error }, { data: drafts, error: draftsError }] =
    await Promise.all([
      assetQuery.order("updated_at", { ascending: false }).returns<AssetRow[]>(),
      supabase
        .from("management_asset_versions")
        .select("asset_id,review_status,updated_at")
        .is("published_at", null),
    ]);

  if (error) throw error;
  if (draftsError) throw draftsError;

  const draftByAsset = new Map(drafts.map((draft) => [draft.asset_id, draft]));
  const publishedIds = assets
    .map((asset) => asset.current_published_version_id)
    .filter((id): id is string => Boolean(id));
  const [organizationNames, publishedVersions] = await Promise.all([
    getOrganizationNames(assets.map((asset) => asset.organization_id)),
    publishedIds.length > 0
      ? supabase
          .from("management_asset_versions")
          .select("id,version_number,published_at")
          .in("id", publishedIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (publishedVersions.error) throw publishedVersions.error;

  const publishedVersionById = new Map(
    (publishedVersions.data ?? []).map((version) => [version.id, version]),
  );
  const now = new Date();

  return assets.map((asset) => {
    const draft = draftByAsset.get(asset.id) ?? null;
    const lastChange =
      draft && new Date(draft.updated_at) > new Date(asset.updated_at)
        ? draft.updated_at
        : asset.updated_at;

    return adminManagementAssetListItemSchema.parse({
      id: asset.id,
      organizationId: asset.organization_id,
      organizationName:
        organizationNames.get(asset.organization_id) ?? "Empresa sem nome",
      type: asset.type,
      title: asset.title,
      category: asset.category,
      status: deriveAssetStatus(asset, draft?.review_status ?? null),
      draftStatus: draft?.review_status ?? null,
      publishedVersionNumber: asset.current_published_version_id
        ? (publishedVersionById.get(asset.current_published_version_id)?.version_number ?? null)
        : null,
      specialistId: asset.assigned_specialist_id,
      ownerLabel: asset.owner_label,
      reviewCycle: asset.review_cycle,
      review: getManagementAssetReview({ publishedAt: publishedVersionById.get(asset.current_published_version_id ?? "")?.published_at ?? null, reviewCycle: asset.review_cycle, archivedAt: asset.archived_at }, now),
      updatedAt: toIso(lastChange),
    });
  });
}

async function getAssetRow(assetId: string) {
  assertUuid(assetId);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("management_assets")
    .select("*")
    .eq("id", assetId)
    .maybeSingle<AssetRow>();

  if (error) throw error;
  if (!data) throw new ManagementAssetError("Ativo não encontrado.", 404);

  return data;
}

async function getVersionRows(assetId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("management_asset_versions")
    .select("*")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: false })
    .returns<VersionRow[]>();

  if (error) throw error;

  return data;
}

function mapVersion(row: VersionRow) {
  return {
    id: row.id,
    versionNumber: row.version_number,
    status: row.review_status,
    changeNote: row.change_note,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    reviewedAt: toIsoOrNull(row.reviewed_at),
    publishedAt: toIsoOrNull(row.published_at),
    indexStatus: row.index_status,
    indexError: row.index_error,
  };
}

function mapVersionWithContent(row: VersionRow) {
  return {
    ...mapVersion(row),
    content: parseStoredAssetContent(row.content) ?? emptyRichTextDocument,
  };
}

export async function getAdminManagementAssetDetail(
  assetId: string,
): Promise<AdminManagementAssetDetail> {
  const asset = await getAssetRow(assetId);
  const supabase = createSupabaseAdminClient();
  const [versions, organizationNames, chunkCounts] = await Promise.all([
    getVersionRows(asset.id),
    getOrganizationNames([asset.organization_id]),
    asset.current_published_version_id
      ? Promise.all([
          supabase
            .from("management_asset_chunks")
            .select("id", { count: "exact", head: true })
            .eq("version_id", asset.current_published_version_id),
          supabase
            .from("management_asset_chunks")
            .select("id", { count: "exact", head: true })
            .eq("version_id", asset.current_published_version_id)
            .not("embedding", "is", null),
        ])
      : Promise.resolve(null),
  ]);
  const draft = versions.find((version) => version.published_at === null) ?? null;
  const published =
    versions.find((version) => version.id === asset.current_published_version_id) ??
    null;

  return adminManagementAssetDetailSchema.parse({
    id: asset.id,
    organizationId: asset.organization_id,
    organizationName:
      organizationNames.get(asset.organization_id) ?? "Empresa sem nome",
    type: asset.type,
    title: asset.title,
    summary: asset.description ?? "",
    category: asset.category,
    ownerLabel: asset.owner_label,
    reviewCycle: asset.review_cycle,
    specialistId: asset.assigned_specialist_id,
    status: deriveAssetStatus(asset, draft?.review_status ?? null),
    archivedAt: toIsoOrNull(asset.archived_at),
    updatedAt: toIso(asset.updated_at),
    revision: { assetUpdatedAt: asset.updated_at, draftId: draft?.id ?? null, draftUpdatedAt: draft?.updated_at ?? null },
    draft: draft ? mapVersionWithContent(draft) : null,
    published: published ? mapVersionWithContent(published) : null,
    versions: versions.map(mapVersion),
    chunkCount: chunkCounts?.[0].count ?? 0,
    embeddedChunkCount: chunkCounts?.[1].count ?? 0,
  });
}

async function validateSpecialist(specialistId: string | null) {
  if (specialistId && !(await canAssignSpecialist(specialistId))) {
    throw new ManagementAssetError("Selecione um especialista válido.");
  }
}

async function validateBulkSelection(input: ManagementAssetBulkSelection, editing: boolean) {
  assertUuid(input.organizationId, "Empresa não encontrada.");
  for (const id of input.assetIds) assertUuid(id);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("management_assets")
    .select("id,archived_at")
    .eq("organization_id", input.organizationId)
    .in("id", input.assetIds);
  if (error) throw error;
  if (data.length !== input.assetIds.length) {
    throw new ManagementAssetError("Alguns ativos não estão mais disponíveis nesta empresa. Atualize a lista.", 409);
  }
  if (editing && data.some((asset) => asset.archived_at)) {
    throw new ManagementAssetError("Restaure os ativos arquivados antes de editar.", 409);
  }
}

export async function updateManagementAssetsInBulk(input: ManagementAssetBulkUpdate) {
  if (input.changes.specialistId !== undefined) await validateSpecialist(input.changes.specialistId);
  await validateBulkSelection(input, true);
  const changes: Database["public"]["Tables"]["management_assets"]["Update"] = {};
  if (input.changes.specialistId !== undefined) changes.assigned_specialist_id = input.changes.specialistId;
  if (input.changes.category !== undefined) changes.category = input.changes.category;
  if (input.changes.ownerLabel !== undefined) changes.owner_label = input.changes.ownerLabel;
  if (input.changes.reviewCycle !== undefined) changes.review_cycle = input.changes.reviewCycle;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("management_assets").update(changes)
    .eq("organization_id", input.organizationId).in("id", input.assetIds)
    .is("archived_at", null).select("id");
  if (error) throw error;
  return data.map((asset) => asset.id);
}

export async function deleteManagementAssets(input: ManagementAssetBulkSelection) {
  await validateBulkSelection(input, false);
  const supabase = createSupabaseAdminClient();
  // As FKs existentes removem versões, escopos e trechos na mesma instrução.
  const { data, error } = await supabase.from("management_assets").delete()
    .eq("organization_id", input.organizationId).in("id", input.assetIds).select("id");
  if (error?.code === "23503") throw new ManagementAssetError("Há ativos vinculados ao histórico de rotinas nesta seleção. Arquive esses ativos para preservar os registros.", 409);
  if (error) throw error;
  return data.map((asset) => asset.id);
}

function nextVersionNumber(versions: Pick<VersionRow, "version_number">[]) {
  const highest = versions.reduce((max, version) => {
    const parsed = Number.parseInt(version.version_number, 10);
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0);

  return String(Math.max(highest, versions.length) + 1);
}

export async function createManagementAsset(
  actorUserId: string,
  input: CreateManagementAssetInput,
) {
  assertUuid(input.organizationId, "Empresa não encontrada.");
  await validateSpecialist(input.specialistId);

  const template = input.templateId
    ? getManagementAssetTemplate(input.templateId)
    : null;

  if (input.templateId && !template) {
    throw new ManagementAssetError("Modelo de partida não encontrado.");
  }
  if (template && template.type !== input.type) {
    throw new ManagementAssetError("Selecione um modelo do mesmo tipo do ativo.");
  }

  const content = template
    ? legacySopContentToRichText(template.content)
    : emptyRichTextDocument;
  const supabase = createSupabaseAdminClient();
  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", input.organizationId)
    .maybeSingle();

  if (organizationError) throw organizationError;
  if (!organization) throw new ManagementAssetError("Empresa não encontrada.", 404);

  const { data: asset, error } = await supabase
    .from("management_assets")
    .insert({
      organization_id: input.organizationId,
      type: input.type,
      title: input.title,
      description: input.summary,
      category: input.category,
      owner_label: input.ownerLabel,
      review_cycle: input.reviewCycle,
      assigned_specialist_id: input.specialistId,
      created_by_user_id: actorUserId,
      status: "rascunho",
    })
    .select("id")
    .single();

  if (error) throw error;

  const { error: versionError } = await supabase
    .from("management_asset_versions")
    .insert({
      asset_id: asset.id,
      organization_id: input.organizationId,
      version_number: "1",
      content_format: "json",
      content: contentToJson(content),
      summary: input.summary,
      created_by_user_id: actorUserId,
      last_edited_by_user_id: actorUserId,
      review_status: "rascunho",
    });

  if (versionError) {
    await supabase.from("management_assets").delete().eq("id", asset.id);
    throw versionError;
  }

  return asset.id;
}

async function syncUnpublishedAssetStatus(asset: AssetRow) {
  if (asset.current_published_version_id || asset.archived_at) return;

  const versions = await getVersionRows(asset.id);
  const draft = versions.find((version) => version.published_at === null);
  const status = deriveAssetStatus(asset, draft?.review_status ?? null);

  if (status !== asset.status) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("management_assets")
      .update({ status })
      .eq("id", asset.id);

    if (error) throw error;
  }
}

async function createDraftFromPublished(
  actorUserId: string,
  asset: AssetRow,
  versions: VersionRow[],
  content?: RichTextDocument,
) {
  const published = versions.find(
    (version) => version.id === asset.current_published_version_id,
  );
  const baseContent =
    content ??
    (published ? parseStoredAssetContent(published.content) : null) ??
    emptyRichTextDocument;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("management_asset_versions")
    .insert({
      asset_id: asset.id,
      organization_id: asset.organization_id,
      version_number: nextVersionNumber(versions),
      content_format: "json",
      content: contentToJson(baseContent),
      summary: asset.description,
      created_by_user_id: actorUserId,
      last_edited_by_user_id: actorUserId,
      review_status: "rascunho",
    })
    .select("*")
    .single<VersionRow>();

  if (error) {
    if (error.code === "23505") {
      throw new ManagementAssetError("Já existe um rascunho aberto para este ativo.", 409);
    }

    throw error;
  }

  return data;
}

export async function updateManagementAsset(
  actorUserId: string,
  assetId: string,
  input: UpdateManagementAssetInput,
) {
  assertUuid(assetId);
  const { error } = await createSupabaseAdminClient().schema("app_private").rpc("save_admin_management_asset", {
    p_actor_user_id: actorUserId, p_asset_id: assetId, p_input: input as unknown as Json,
  });
  if (error) {
    if (error.code === "PT404") throw new ManagementAssetError("Ativo não encontrado.", 404);
    if (["PT409", "55P03", "40001", "23505"].includes(error.code)) {
      throw new ManagementAssetError("O ativo mudou ou está sendo alterado em outra sessão. Seu texto permanece no editor. Atualize a página antes de tentar novamente.", 409);
    }
    if (error.code === "PT400") throw new ManagementAssetError("Revise os dados e o especialista do ativo.", 400);
    throw new ManagementAssetError("Não foi possível salvar o ativo. Seu texto permanece no editor.", 500);
  }
}

async function setDraftStatus(
  draft: VersionRow,
  from: ManagementAssetVersionStatus[],
  to: ManagementAssetVersionStatus,
  extra: Database["public"]["Tables"]["management_asset_versions"]["Update"] = {},
) {
  if (!from.includes(draft.review_status)) {
    throw new ManagementAssetError("Esta ação não está disponível no estado atual.", 409);
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("management_asset_versions")
    .update({ review_status: to, ...extra })
    .eq("id", draft.id)
    .eq("review_status", draft.review_status)
    .is("published_at", null);

  if (error) throw error;
}

async function buildChunkPayload(title: string, content: RichTextDocument) {
  const chunks = buildManagementAssetChunks({ title, content });

  if (chunks.length === 0) {
    throw new ManagementAssetError("O conteúdo não gerou trechos pesquisáveis.");
  }

  let embedding: Awaited<ReturnType<typeof embedTexts>> = null;
  let embeddingError: string | null = null;

  try {
    embedding = await embedTexts(
      chunks.map((chunk) => getChunkEmbeddingText(title, chunk)),
      "document",
    );
  } catch (error) {
    // A publicação não depende do vetor: o índice textual já permite busca
    // e "Reindexar" completa os vetores depois.
    embeddingError = error instanceof Error ? error.message : "Falha nos embeddings.";
    console.error("[management-assets] embedding failed", error);
  }

  return {
    embeddingError,
    payload: chunks.map((chunk, index) => ({
      heading_path: chunk.headingPath,
      content: chunk.content,
      token_count: chunk.tokenCount,
      ...(embedding
        ? {
            embedding: embedding.vectors[index],
            embedding_model: embedding.modelKey,
          }
        : {}),
    })),
  };
}

async function publishDraft(actorUserId: string, asset: AssetRow, draft: VersionRow) {
  const content = parseStoredAssetContent(draft.content);

  if (!content || isRichTextEmpty(content)) {
    throw new ManagementAssetError("Escreva o conteúdo antes de publicar.");
  }

  const { payload, embeddingError } = await buildChunkPayload(asset.title, content);
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .schema("app_private")
    .rpc("publish_management_asset_version", {
      p_actor_user_id: actorUserId,
      p_version_id: draft.id,
      p_chunks: payload as unknown as Json,
      p_published_at: new Date().toISOString(),
    });

  if (error) {
    if (error.code === "22023") throw new ManagementAssetError(error.message, 409);
    throw error;
  }

  return { embeddingError };
}

async function reindexPublishedEmbeddings(asset: AssetRow) {
  if (!asset.current_published_version_id) {
    throw new ManagementAssetError("Publique o ativo antes de reindexar.", 409);
  }

  const supabase = createSupabaseAdminClient();
  const { data: chunks, error } = await supabase
    .from("management_asset_chunks")
    .select("id,heading_path,content")
    .eq("version_id", asset.current_published_version_id)
    .order("ordinal", { ascending: true });

  if (error) throw error;

  const embedding = await embedTexts(
    chunks.map((chunk) =>
      getChunkEmbeddingText(asset.title, {
        headingPath: chunk.heading_path,
        content: chunk.content,
      }),
    ),
    "document",
  );

  if (!embedding) {
    throw new ManagementAssetError(
      "Configure um provedor de embeddings para reindexar.",
      409,
    );
  }

  for (const [index, chunk] of chunks.entries()) {
    const { error: updateError } = await supabase
      .from("management_asset_chunks")
      .update({
        embedding: toPgVector(embedding.vectors[index]),
        embedding_model: embedding.modelKey,
      })
      .eq("id", chunk.id);

    if (updateError) throw updateError;
  }
}

export async function transitionManagementAsset(
  actorUserId: string,
  assetId: string,
  action: ManagementAssetTransition,
): Promise<{ notice: string }> {
  const asset = await getAssetRow(assetId);
  const versions = await getVersionRows(asset.id);
  const draft = versions.find((version) => version.published_at === null) ?? null;
  const supabase = createSupabaseAdminClient();
  const requireDraft = () => {
    if (!draft) throw new ManagementAssetError("Não há rascunho aberto.", 409);
    return draft;
  };
  const requireActive = () => {
    if (asset.archived_at) {
      throw new ManagementAssetError("Restaure o ativo antes de continuar.", 409);
    }
  };

  switch (action) {
    case "abrir_rascunho": {
      requireActive();
      if (draft) return { notice: "O rascunho já está aberto." };
      await createDraftFromPublished(actorUserId, asset, versions);
      return { notice: "Nova versão aberta em rascunho." };
    }
    case "enviar_para_revisao": {
      requireActive();
      const current = requireDraft();
      const content = parseStoredAssetContent(current.content);

      if (!content || isRichTextEmpty(content)) {
        throw new ManagementAssetError("Escreva o conteúdo antes de enviar para revisão.");
      }

      await setDraftStatus(current, ["rascunho"], "em_revisao");
      await syncUnpublishedAssetStatus(asset);
      return { notice: "Rascunho enviado para revisão." };
    }
    case "aprovar_revisao": {
      requireActive();
      await setDraftStatus(requireDraft(), ["em_revisao"], "pronto_para_publicar", {
        reviewed_by_user_id: actorUserId,
        reviewed_at: new Date().toISOString(),
      });
      await syncUnpublishedAssetStatus(asset);
      return { notice: "Revisão concluída. A versão está pronta para publicar." };
    }
    case "devolver_para_rascunho": {
      await setDraftStatus(
        requireDraft(),
        ["em_revisao", "pronto_para_publicar"],
        "rascunho",
        { reviewed_by_user_id: null, reviewed_at: null },
      );
      await syncUnpublishedAssetStatus(asset);
      return { notice: "Versão devolvida para rascunho." };
    }
    case "publicar": {
      requireActive();
      const { embeddingError } = await publishDraft(actorUserId, asset, requireDraft());
      return {
        notice: embeddingError
          ? "Versão publicada com busca textual. Os vetores semânticos falharam; use Reindexar."
          : "Versão publicada e disponível para o cliente e para o agente.",
      };
    }
    case "arquivar": {
      if (asset.archived_at) return { notice: "O ativo já está arquivado." };
      const { error } = await supabase
        .from("management_assets")
        .update({ archived_at: new Date().toISOString(), status: "arquivado" })
        .eq("id", asset.id);
      if (error) throw error;
      return { notice: "Ativo arquivado. Ele saiu da biblioteca e das respostas do agente." };
    }
    case "restaurar": {
      if (!asset.archived_at) return { notice: "O ativo já está ativo." };
      const restored = { ...asset, archived_at: null };
      const { error } = await supabase
        .from("management_assets")
        .update({
          archived_at: null,
          status: deriveAssetStatus(restored, draft?.review_status ?? null),
        })
        .eq("id", asset.id);
      if (error) throw error;
      return { notice: "Ativo restaurado." };
    }
    case "reindexar": {
      requireActive();
      await reindexPublishedEmbeddings(asset);
      return { notice: "Vetores semânticos atualizados." };
    }
  }
}

export async function listAdminAssetQuestionAudits(filter: {
  onlyGaps: boolean;
  organizationId?: string;
}): Promise<AdminAssetQuestionAudit[]> {
  const { requireAgentOperator } = await import("@/lib/data/agent-operations-data-source");
  await requireAgentOperator();
  const supabase = createSupabaseAdminClient();
  if (!filter.organizationId) throw new ManagementAssetError("Selecione uma empresa.");
  assertUuid(filter.organizationId, "Empresa não encontrada.");
  const audits: Array<Pick<Database["public"]["Tables"]["asset_question_audits"]["Row"], "id" | "organization_id" | "channel" | "question" | "answer" | "answer_status" | "citations" | "provider" | "latency_ms" | "created_at">> = [];
  let beforeAudit: { created_at: string; id: string } | undefined;
  for (;;) {
    const query = supabase.from("asset_question_audits")
      .select("id,organization_id,channel,question,answer,answer_status,citations,provider,latency_ms,created_at")
      .eq("organization_id", filter.organizationId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(500);
    if (beforeAudit) query.or(`created_at.lt.${beforeAudit.created_at},and(created_at.eq.${beforeAudit.created_at},id.lt.${beforeAudit.id})`);
    const { data, error } = await query;
    if (error) throw error;
    audits.push(...data);
    if (data.length < 500) break;
    beforeAudit = data.at(-1)!;
  }
  const organizationNames = await getOrganizationNames([filter.organizationId]);
  const feedback: { data: Array<{question_audit_id: string; value: "util" | "nao_util"; comment: string | null}> } = { data: [] };
  for (let start = 0; start < audits.length; start += 200) {
    let beforeFeedback: { created_at: string; id: string } | undefined;
    for (;;) {
      const query = supabase.from("asset_answer_feedback").select("question_audit_id,value,comment,created_at,id")
        .eq("organization_id", filter.organizationId).in("question_audit_id", audits.slice(start, start + 200).map(audit => audit.id))
        .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(500);
      if (beforeFeedback) query.or(`created_at.lt.${beforeFeedback.created_at},and(created_at.eq.${beforeFeedback.created_at},id.lt.${beforeFeedback.id})`);
      const { data, error } = await query;
      if (error) throw error;
      feedback.data.push(...data);
      if (data.length < 500) break;
      beforeFeedback = data.at(-1)!;
    }
  }

  const feedbackByAudit = new Map<string, { value: "util" | "nao_util"; comment: string | null }>();

  for (const item of feedback.data ?? []) {
    if (!feedbackByAudit.has(item.question_audit_id)) {
      feedbackByAudit.set(item.question_audit_id, {
        value: item.value,
        comment: item.comment,
      });
    }
  }

  return audits
    .map((audit) => {
      const itemFeedback = feedbackByAudit.get(audit.id) ?? null;
      const citations = Array.isArray(audit.citations)
        ? (audit.citations as Array<{ title?: unknown }>)
        : [];

      return adminAssetQuestionAuditSchema.parse({
        id: audit.id,
        organizationName:
          organizationNames.get(audit.organization_id) ?? "Empresa sem nome",
        channel: audit.channel === "slack" ? "slack" : "app",
        question: audit.question,
        answer: audit.answer,
        status: audit.answer_status,
        sourceTitles: Array.from(
          new Set(
            citations
              .map((citation) => citation.title)
              .filter((title): title is string => typeof title === "string"),
          ),
        ),
        feedback: itemFeedback?.value ?? null,
        feedbackComment: itemFeedback?.comment ?? null,
        provider: audit.provider,
        latencyMs: audit.latency_ms,
        createdAt: toIso(audit.created_at),
      });
    })
    .filter(
      (audit) =>
        !filter.onlyGaps ||
        audit.status !== "respondida" ||
        audit.feedback === "nao_util",
    );
}
