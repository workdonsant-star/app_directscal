import "server-only";

import { getAccessibleOrganizationIdsForUser } from "@/lib/auth/authorization";
import type { CustomerDocument } from "@/lib/contracts/customer-documents";
import { getAssetNavigationPreferences } from "@/lib/data/asset-navigation-data-source";
import { getManagementAssetCategoryFolders } from "@/lib/data/management-asset-categories";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

const bucket = "customer-documents";
const maxBytes = 10 * 1024 * 1024;
type DocumentRow = Database["public"]["Tables"]["customer_documents"]["Row"];

export class CustomerDocumentError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409 | 500 = 400) { super(message); }
}

function publicDocument(document: DocumentRow): CustomerDocument {
  return { id: document.id, organizationId: document.organization_id, kind: document.kind,
    categoryKey: document.category_key, title: document.title, fileName: document.file_name,
    mimeType: document.mime_type, byteSize: document.byte_size, publishedAt: document.published_at };
}

export async function listCustomerDocuments(organizationIds: string[], kind?: "asset" | "report") {
  if (organizationIds.length === 0) return [];
  let query = createSupabaseAdminClient().from("customer_documents").select("*").in("organization_id", organizationIds);
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query.order("published_at", { ascending: false });
  if (error) throw error;
  return data.map(publicDocument);
}

export async function listCustomerDocumentsForUser(userId: string, kind?: "asset" | "report") {
  const access = await getAccessibleOrganizationIdsForUser(userId);
  return listCustomerDocuments(access.organizationIds, kind);
}

export async function createCustomerDocumentCategory(organizationId: string, actorId: string, title: string) {
  const { data, error } = await createSupabaseAdminClient().schema("app_private").rpc("admin_create_customer_document_category", {
    p_organization_id: organizationId, p_actor_user_id: actorId, p_title: title,
  });
  if (error) {
    if (error.code === "23505") throw new CustomerDocumentError("Esta pasta já existe.", 409);
    if (error.code === "22023") throw new CustomerDocumentError("Limite de pastas atingido ou nome inválido.", 400);
    throw error;
  }
  return data;
}

export async function uploadCustomerDocument(input: {
  organizationId: string; actorId: string; kind: "asset" | "report";
  title: string; categoryKey: string | null; file: File;
}) {
  const title = input.title.trim().replace(/\s+/g, " ");
  if (!title || title.length > 160) throw new CustomerDocumentError("Informe um título de até 160 caracteres.");
  if (!input.file.size || input.file.size > maxBytes) throw new CustomerDocumentError("O arquivo deve ter até 10 MB.");
  const mime = input.file.type;
  const allowed = input.kind === "report"
    ? mime === "application/pdf"
    : mime === "application/pdf" || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (!allowed) throw new CustomerDocumentError(input.kind === "report" ? "Envie um relatório em PDF." : "Envie um arquivo PDF ou DOCX.");
  const header = new Uint8Array(await input.file.slice(0, 4).arrayBuffer());
  const pdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
  const zip = header[0] === 0x50 && header[1] === 0x4b;
  if (mime === "application/pdf" ? !pdf : !zip) throw new CustomerDocumentError("O conteúdo do arquivo não corresponde ao formato informado.");
  if (input.kind === "asset") {
    const preferences = await getAssetNavigationPreferences(input.organizationId);
    const folder = getManagementAssetCategoryFolders([], preferences.categories).find(item => item.key === input.categoryKey);
    if (!folder) throw new CustomerDocumentError("Escolha uma pasta válida.");
  } else if (input.categoryKey) throw new CustomerDocumentError("Relatórios não usam pasta de ativos.");

  const id = crypto.randomUUID();
  const extension = mime === "application/pdf" ? "pdf" : "docx";
  const storagePath = `${input.organizationId}/${id}.${extension}`;
  const supabase = createSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, input.file, { contentType: mime, upsert: false });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase.from("customer_documents").insert({
    id, organization_id: input.organizationId, kind: input.kind,
    category_key: input.categoryKey, title, file_name: input.file.name,
    storage_path: storagePath, mime_type: mime, byte_size: input.file.size,
    created_by: input.actorId,
  }).select("*").single();
  if (error) {
    await supabase.storage.from(bucket).remove([storagePath]);
    throw error;
  }
  return publicDocument(data);
}

export async function getCustomerDocument(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await createSupabaseAdminClient().from("customer_documents").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function downloadCustomerDocument(document: DocumentRow) {
  const { data, error } = await createSupabaseAdminClient().storage.from(bucket).download(document.storage_path);
  if (error) throw error;
  return data;
}

export async function deleteCustomerDocument(id: string, organizationId: string) {
  const document = await getCustomerDocument(id);
  if (!document || document.organization_id !== organizationId) throw new CustomerDocumentError("Arquivo não encontrado.", 404);
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("customer_documents").delete().eq("id", id).eq("organization_id", organizationId);
  if (error) throw error;
  await supabase.storage.from(bucket).remove([document.storage_path]);
}
